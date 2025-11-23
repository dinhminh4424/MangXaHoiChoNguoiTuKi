// controllers/journalController.js
const mongoose = require("mongoose"); // ✅ THÊM: Cần mongoose để xử lý ObjectId
const Journal = require("../models/Journal");
const User = require("../models/User"); // ✅ THÊM: Import User model
const Notification = require("../models/Notification");
const FileManager = require("../utils/FileManager");
const { logUserActivity } = require("../logging/userActivityLogger");

/**
 * Kiểm tra xem một chuỗi ngày có đạt mốc quan trọng không.
 * @param {number} streak - Số ngày trong chuỗi.
 * @returns {boolean} - True nếu là cột mốc, ngược lại là false.
 */
const isMilestone = (streak) => {
  const milestones = [1, 3, 7, 10, 30, 50, 100, 200, 365, 500, 1000];
  return milestones.includes(streak);
};

// Hàm tiện ích để lấy ngày bắt đầu của tuần (Thứ 2)
const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 (CN) đến 6 (T7)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(d.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
};

// Tạo nhật ký mới và gửi thông báo
exports.createJournal = async (req, res) => {
  try {
    const {
      title,
      content,
      emotions,
      tags,
      isPrivate,
      moodRating,
      moodTriggers,
    } = req.body;
    const userId = req.user.userId; // ✅ Lấy userId từ auth middleware, an toàn hơn

    // Kiểm tra xem hôm nay đã có nhật ký chưa
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [user, existingJournal] = await Promise.all([
      User.findById(userId),
      Journal.findOne({ userId, date: { $gte: startOfDay, $lte: endOfDay } }),
    ]);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng." });
    }

    if (existingJournal) {
      return res.status(400).json({
        success: false,
        message: "Hôm nay bạn đã ghi nhật ký rồi! Bạn có muốn cập nhật không?",
      });
    }

    // --- LOGIC XỬ LÝ CHUỖI (STREAK) ĐÃ CẢI TIẾN ---
    const now = new Date();
    const todayMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const yesterdayMidnight = new Date(todayMidnight);
    yesterdayMidnight.setDate(yesterdayMidnight.getDate() - 1);

    const lastJournalDay = user.lastJournalDate
      ? new Date(new Date(user.lastJournalDate).setHours(0, 0, 0, 0))
      : null;

    // 1. Kiểm tra và reset lượt bỏ lỡ hàng tuần
    const currentWeekStart = getStartOfWeek(now);
    const lastMissWeekStart = user.last_journal_miss_week_start || new Date(0);
    if (lastMissWeekStart.getTime() < currentWeekStart.getTime()) {
      user.weekly_journal_miss_uses = 0;
      user.last_journal_miss_week_start = currentWeekStart;
      user.has_lost_journal_streak = false; // Reset cờ khi sang tuần mới
    }

    // 2. Xử lý chuỗi
    if (user.has_lost_journal_streak) {
      // Nếu chuỗi đã bị mất trong tuần, reset về 1
      user.journalStreak = 1;
      user.has_lost_journal_streak = false; // Reset cờ sau khi bắt đầu chuỗi mới
    } else if (lastJournalDay) {
      if (lastJournalDay.getTime() === yesterdayMidnight.getTime()) {
        // Viết liên tiếp -> tăng chuỗi
        user.journalStreak = (user.journalStreak || 0) + 1;
      } else if (lastJournalDay.getTime() < yesterdayMidnight.getTime()) {
        // Bỏ lỡ ngày, kiểm tra lượt bỏ lỡ
        if (user.weekly_journal_miss_uses < 2) {
          // Còn lượt bỏ lỡ -> dùng 1 lượt, chuỗi tiếp tục
          user.weekly_journal_miss_uses += 1;
          user.journalStreak = (user.journalStreak || 0) + 1; // Tiếp tục chuỗi
        } else {
          // Hết lượt bỏ lỡ -> reset chuỗi
          user.journalStreak = 1;
        }
      }
      // Nếu viết lại trong ngày (lastJournalDay.getTime() === todayMidnight.getTime()), không làm gì cả
    } else {
      // Lần đầu tiên viết nhật ký
      user.journalStreak = 1;
    }

    user.lastJournalDate = now;
    // --- KẾT THÚC LOGIC XỬ LÝ CHUỖI ---

    // Xử lý media files nếu có
    const mediaFiles = req.files
      ? req.files.map((file) => {
          let fileFolder = "documents";
          if (file.mimetype.startsWith("image/")) fileFolder = "images";
          else if (file.mimetype.startsWith("video/")) fileFolder = "videos";
          else if (file.mimetype.startsWith("audio/")) fileFolder = "audio";
          return `/api/uploads/${fileFolder}/${file.filename}`;
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
      date: now,
    });

    // Lưu cả hai vào DB cùng lúc
    await Promise.all([newJournal.save(), user.save()]);

    // Kiểm tra cột mốc
    let milestoneReached = null;
    if (isMilestone(user.journalStreak)) {
      milestoneReached = { type: "journal", days: user.journalStreak };
    }

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
        journalStreak: user.journalStreak,
        journal: newJournal,
        milestone: milestoneReached,
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

// lấy danh sách Nhật kí
exports.getJournal = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      emotions,
      tags,
      sortBy = "createdAt",
      search = "",
      isPrivate,
    } = req.query;

    page = Math.max(1, parseInt(page, 10) || 1);
    limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10)); // giới hạn max 100
    const skip = (page - 1) * limit;

    const currentUserId = req.user?.userId;

    // Normalize filters
    const query = {};

    if (typeof isPrivate !== "undefined") {
      // hỗ trợ "true"/"false" string từ query
      query.isPrivate = String(isPrivate) === "true";
    }

    if (emotions) {
      // nếu truyền chuỗi csv -> chuyển thành mảng
      const emArr = Array.isArray(emotions)
        ? emotions
        : String(emotions).split(",");
      query.emotions = { $in: emArr.map((e) => e.trim()).filter(Boolean) };
    }

    if (tags) {
      const tagArr = Array.isArray(tags) ? tags : String(tags).split(",");
      query.tags = { $in: tagArr.map((t) => t.trim()).filter(Boolean) };
    }

    // Search: tìm trong title, emotions, tags cùng lúc
    if (search && String(search).trim().length > 0) {
      const re = new RegExp(escapeRegex(String(search).trim()), "i");
      // Với emotions/tags là mảng string, dùng $in với RegExp để match phần tử mảng
      query.$or = [
        { title: { $regex: re } },
        { emotions: { $in: [re] } },
        { tags: { $in: [re] } },
      ];
    }

    // Sorting: bạn có thể thêm các option khác nếu muốn
    let sortOption = { createdAt: -1 };
    if (sortBy === "createdAt") sortOption = { createdAt: -1 };
    else if (sortBy === "title") sortOption = { title: 1 };
    // thêm sortBy khác nếu cần

    const journals = await Journal.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate("userId", "username _id profile.avatar fullName")
      .lean();

    const total = await Journal.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const responsePayload = {
      success: true,
      page,
      totalPages,
      totalJournal: total,
      journals,
    };

    // log (giữ nguyên logic log của bạn)
    logUserActivity({
      action: "journal.fetch",
      req,
      res,
      userId: req.user?.userId,
      role: req.user?.role,
      target: { type: "feed", owner: req.user?.userId },
      description: "Người dùng lấy danh sách nhật kí",
      payload: {
        page,
        limit,
        filters: {
          currentUserId: currentUserId || null,
          emotions: emotions || null,
          tags: tags || null,
          search,
          success: true,
        },
        resultCount: journals.length,
        total,
      },
      meta: {
        totalPages,
      },
    });

    return res.status(200).json(responsePayload);
  } catch (err) {
    console.error("getJournal error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }

  // helper: escape regex special chars
  function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  }
};
