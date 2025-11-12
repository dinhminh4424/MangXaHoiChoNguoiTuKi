// controllers/journalController.js
const Journal = require("../models/Journal");
const Notification = require("../models/Notification");
const FileManager = require("../utils/fileManager");
const { logUserActivity } = require("../logging/userActivityLogger");

// Tạo nhật ký mới và gửi thông báo
exports.createJournal = async (req, res) => {
  try {
    const {
      userId,
      title,
      content,
      emotions,
      tags,
      isPrivate,
      moodRating,
      moodTriggers,
    } = req.body;

    // Kiểm tra xem hôm nay đã có nhật ký chưa
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const existingJournal = await Journal.findOne({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existingJournal) {
      return res.status(400).json({
        success: false,
        message: "Hôm nay bạn đã ghi nhật ký rồi!",
      });
    }

    // Xử lý media files nếu có
    const mediaFiles = req.files
      ? req.files.map((file) => {
          // Xác định thư mục theo mimetype của file
          let fileFolder = "documents";

          if (file.mimetype.startsWith("image/")) {
            fileFolder = "images";
          } else if (file.mimetype.startsWith("video/")) {
            fileFolder = "videos";
          } else if (file.mimetype.startsWith("audio/")) {
            fileFolder = "audio";
          }

          // Tạo URL truy cập - SỬA: file.filename thay vì req.file.filename
          const fileUrl = `${req.protocol}://${req.get(
            "host"
          )}/api/uploads/${fileFolder}/${file.filename}`;

          return fileUrl;
        })
      : [];

    // Tạo nhật ký mới
    const newJournal = new Journal({
      userId,
      title,
      content,
      emotions: emotions || [],
      tags: tags || [],
      moodRating: moodRating || null,
      moodTriggers: moodTriggers || [],
      media: mediaFiles,
      isPrivate: isPrivate !== undefined ? isPrivate : true,
      date: new Date(),
    });

    await newJournal.save();

    // Tạo thông báo
    // const notification = new Notification({
    //   userId,
    //   message: `📝 Bạn vừa ghi nhật ký "${title}" thành công! Hãy tiếp tục duy trì thói quen tốt này nhé!`,
    //   read: false,
    // });

    // await notification.save();

    const responsePayload = {
      success: true,
      message: "Ghi nhật ký thành công!",
      data: {
        journal: newJournal,
      },
    };

    const actorId = req.user?.userId || userId;

    res.status(201);
    logUserActivity({
      action: "journal.create",
      req,
      res,
      userId: actorId,
      role: req.user?.role,
      target: { type: "journal", id: newJournal._id.toString() },
      description: "Người dùng tạo nhật ký",
      payload: {
        journalId: newJournal._id.toString(),
        isPrivate: newJournal.isPrivate,
        hasMedia: Array.isArray(newJournal.media)
          ? newJournal.media.length > 0
          : false,
      },
    });

    return res.json(responsePayload);
  } catch (error) {
    console.error("Error creating journal:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi ghi nhật ký: " + error.message,
      error: error.message,
    });
  }
};

// === TÍNH NĂNG MỚI: API LẤY DỮ LIỆU THỐNG KÊ NHẬT KÝ ===
exports.getJournalStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = "7d" } = req.query; // Mặc định là 7 ngày

    // Xác định ngày bắt đầu dựa trên period
    const endDate = new Date();
    const startDate = new Date();
    if (period === "30d") {
      startDate.setDate(endDate.getDate() - 30);
    } else if (period === "90d") {
      startDate.setDate(endDate.getDate() - 90);
    } else {
      startDate.setDate(endDate.getDate() - 7); // Mặc định 7 ngày
    }
    startDate.setHours(0, 0, 0, 0);

    // Query chính để lấy dữ liệu
    const stats = await Journal.aggregate([
      // 1. Lọc các nhật ký của user trong khoảng thời gian
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: startDate, $lte: endDate },
        },
      },
      // 2. Gom nhóm theo nhiều tiêu chí
      {
        $facet: {
          // 2.1. Thống kê cảm xúc theo ngày (cho line chart)
          moodOverTime: [
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                avgMood: { $avg: "$moodRating" },
              },
            },
            { $sort: { _id: 1 } }, // Sắp xếp theo ngày
          ],
          // 2.2. Đếm tần suất các loại cảm xúc (cho pie chart)
          emotionCounts: [
            { $unwind: "$emotions" }, // Tách mảng emotions thành các document riêng
            { $group: { _id: "$emotions", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          // 2.3. Đếm tần suất các yếu tố kích hoạt (cho bar chart)
          triggerCounts: [
            { $unwind: "$moodTriggers" },
            { $group: { _id: "$moodTriggers", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
        },
      },
    ]);

    res.json({
      success: true,
      message: "Lấy dữ liệu thống kê nhật ký thành công",
      data: {
        moodOverTime: stats[0].moodOverTime,
        emotionCounts: stats[0].emotionCounts,
        triggerCounts: stats[0].triggerCounts,
      },
    });
  } catch (error) {
    console.error("Error getting journal stats:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Cập nhật nhật ký hôm nay - ĐÃ SỬA LỖI
exports.updateTodayJournal = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Xử lý media files mới nếu có - ĐÃ SỬA LỖI
    if (req.files && req.files.length > 0) {
      const newMedia = req.files.map((file) => {
        // Xác định thư mục theo mimetype của file
        let fileFolder = "documents";

        if (file.mimetype.startsWith("image/")) {
          fileFolder = "images";
        } else if (file.mimetype.startsWith("video/")) {
          fileFolder = "videos";
        } else if (file.mimetype.startsWith("audio/")) {
          fileFolder = "audio";
        }

        // Tạo URL truy cập - SỬA: file.filename thay vì req.file.filename
        const fileUrl = `${req.protocol}://${req.get(
          "host"
        )}/api/uploads/${fileFolder}/${file.filename}`;

        return fileUrl;
      });

      updateData.media = [...(updateData.media || []), ...newMedia];
    }

    const updatedJournal = await Journal.findOneAndUpdate(
      {
        userId,
        date: { $gte: startOfDay, $lte: endOfDay },
      },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedJournal) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhật ký hôm nay để cập nhật",
      });
    }

    // Tạo thông báo cập nhật
    // const notification = new Notification({
    //   userId,
    //   message: `✏️ Nhật ký "${updatedJournal.title}" đã được cập nhật!`,
    //   read: false,
    // });

    // await notification.save();

    const responsePayload = {
      success: true,
      message: "Cập nhật nhật ký thành công!",
      data: {
        journal: updatedJournal,
      },
    };

    res.status(200);
    logUserActivity({
      action: "journal.update_today",
      req,
      res,
      userId: req.user?.userId || userId,
      role: req.user?.role,
      target: { type: "journal", id: updatedJournal._id.toString() },
      description: "Người dùng cập nhật nhật ký trong ngày",
      payload: {
        journalId: updatedJournal._id.toString(),
        isPrivate: updatedJournal.isPrivate,
      },
    });

    return res.json(responsePayload);
  } catch (error) {
    console.error("Error updating journal:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật nhật ký",
    });
  }
};

exports.updateJournal = async (req, res) => {
  try {
    const { journalId } = req.params;

    console.log("🧠 [Update Journal] journalId:", journalId);
    console.log("📦 req.body:", req.body);
    console.log("📸 req.files:", req.files);

    // ✅ Xử lý dữ liệu từ form-data
    const normalizedData = {};

    // Xử lý các field từ req.body (đã bị stringify từ client)
    Object.keys(req.body).forEach((key) => {
      let value = req.body[key];

      // Parse JSON strings
      if (typeof value === "string") {
        try {
          // Thử parse JSON
          value = JSON.parse(value);
        } catch (error) {
          // Nếu không phải JSON, giữ nguyên giá trị
          console.log(`Field ${key} is not JSON, keeping as string:`, value);
        }
      }

      normalizedData[key] = value;
    });

    // ✅ Xử lý file uploads
    if (req.files && req.files.length > 0) {
      const newMedia = req.files.map((file) => {
        let fileFolder = "documents";
        if (file.mimetype.startsWith("image/")) {
          fileFolder = "images";
        } else if (file.mimetype.startsWith("video/")) {
          fileFolder = "videos";
        } else if (file.mimetype.startsWith("audio/")) {
          fileFolder = "audio";
        }

        const fileUrl = `${req.protocol}://${req.get(
          "host"
        )}/api/uploads/${fileFolder}/${file.filename}`;
        return fileUrl;
      });

      // Kết hợp media cũ và media mới
      normalizedData.media = [
        ...(normalizedData.media || []), // Media URLs từ client
        ...newMedia, // Media mới upload
      ];
    }

    console.log("✅ Normalized data after processing:", normalizedData);

    // Tìm journal trước để lấy userId và kiểm tra tồn tại
    const existingJournal = await Journal.findById(journalId);
    if (!existingJournal) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhật ký",
      });
    }

    // ✅ Đảm bảo các field array không bị undefined
    const finalUpdateData = {
      ...normalizedData,
      emotions: Array.isArray(normalizedData.emotions)
        ? normalizedData.emotions
        : [],
      tags: Array.isArray(normalizedData.tags) ? normalizedData.tags : [],
      media: Array.isArray(normalizedData.media) ? normalizedData.media : [],
      updatedAt: new Date(),
    };

    // Cập nhật journal
    const updatedJournal = await Journal.findByIdAndUpdate(
      journalId,
      { $set: finalUpdateData },
      { new: true, runValidators: true }
    ).populate("userId", "username email");

    if (!updatedJournal) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhật ký để cập nhật",
      });
    }

    // ✅ Tạo notification
    // try {
    //   const notification = new Notification({
    //     userId: existingJournal.userId,
    //     type: "journal_updated",
    //     message: `✏️ Nhật ký "${updatedJournal.title}" đã được cập nhật!`,
    //     relatedId: journalId,
    //     read: false,
    //   });

    //   await notification.save();
    //   console.log("✅ Notification created successfully");
    // } catch (notificationError) {
    //   console.error("❌ Notification creation failed:", notificationError);
    //   // Không throw error - journal đã update thành công
    // }

    const responsePayload = {
      success: true,
      message: "Cập nhật nhật ký thành công!",
      data: {
        journal: updatedJournal,
      },
    };

    res.status(200);
    logUserActivity({
      action: "journal.update",
      req,
      res,
      userId: req.user?.userId,
      role: req.user?.role,
      target: { type: "journal", id: updatedJournal._id.toString() },
      description: "Người dùng chỉnh sửa nhật ký",
      payload: {
        journalId: updatedJournal._id.toString(),
        updatedFields: Object.keys(normalizedData || {}),
      },
    });

    return res.json(responsePayload);
  } catch (error) {
    console.error("❌ Error updating journal:", error);

    let errorMessage = "Lỗi server khi cập nhật nhật ký";
    let statusCode = 500;

    if (error.name === "ValidationError") {
      statusCode = 400;
      errorMessage = "Dữ liệu không hợp lệ";
    } else if (error.name === "CastError") {
      statusCode = 400;
      errorMessage = "ID nhật ký không hợp lệ";
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Lấy nhật ký hôm nay của user (giữ nguyên)
exports.getTodayJournal = async (req, res) => {
  try {
    const { userId } = req.params;

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const todayJournal = await Journal.findOne({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).populate("userId", "username email");

    if (!todayJournal) {
      return res.json({
        success: false,
        message: "Hôm nay bạn chưa ghi nhật ký",
        data: null,
      });
    }

    res.json({
      success: true,
      data: todayJournal,
    });
  } catch (error) {
    console.error("Error getting today's journal:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy nhật ký",
    });
  }
};

exports.getJournalById = async (req, res) => {
  try {
    const { journalId } = req.params;
    const journal = await Journal.findById(journalId).populate(
      "userId",
      "username email"
    );

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhật ký",
        data: null,
      });
    }
    res.json({
      success: true,
      data: journal,
      message: "Tìm kiếm nhật ký thành công",
    });
  } catch (error) {
    console.error("Error getting journal by ID:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy nhật ký",
    });
  }
};

exports.deleteJournal = async (req, res) => {
  const { journalId } = req.params;
  const userId = req.user.userId;

  try {
    const journal = await Journal.findById(journalId);
    // Kiểm tra xem journal có tồn tại không
    if (!journal) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy nhật ký với ID: ${journalId}`,
      });
    }

    // Kiểm tra quyền sở hữu - so sánh ObjectId
    if (journal.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: `Bạn không có quyền xoá nhật ký này`,
        error: `Bạn không có quyền xoá nhật ký: id: [${journal._id}]`,
      });
    }

    const journalDelete = { ...journal.toObject() };

    await Journal.deleteOne({ _id: journalId });

    if (journalDelete.media) {
      if (journalDelete.media.length > 0) {
        await FileManager.deleteMultipleFiles(journalDelete.media);
      }
    }
    const responsePayload = {
      success: true,
      message: `Đã xoá thành công nhật kí ngày [${journalDelete.createdAt}]  này`,
      journalDelete: journalDelete,
    };

    res.status(200);
    logUserActivity({
      action: "journal.delete",
      req,
      res,
      userId,
      role: req.user?.role,
      target: { type: "journal", id: journalId.toString() },
      description: "Người dùng xoá nhật ký",
      payload: {
        journalId: journalId.toString(),
        hadMedia: Array.isArray(journalDelete.media)
          ? journalDelete.media.length > 0
          : false,
      },
    });

    return res.json(responsePayload);
  } catch (error) {
    console.error("Error getting journal by ID:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xoá nhật kí: " + error.message,
    });
  }
};
