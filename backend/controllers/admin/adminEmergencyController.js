const EmergencyRequest = require("../../models/EmergencyRequest");
const User = require("../../models/User");

const adminEmergencyController = {
  // Lấy danh sách yêu cầu khẩn cấp với phân trang và filter
  async getEmergencies(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search = "",
        type = "",
        status = "",
        priority = "",
        dateFrom = "",
        dateTo = "",
        sortBy = "createdAt",
        sortOrder = "desc",
        hasLocation = "",
        isSilent = "",
        emergencyId = "",
      } = req.query;

      // Build filter query
      let filter = {};

      const searchConditions = [];
      if (emergencyId) {
        searchConditions.push({
          $expr: {
            $regexMatch: {
              input: { $toString: "$_id" },
              regex: emergencyId,
              options: "i",
            },
          },
        });
      }

      if (searchConditions.length > 0) {
        filter.$or = searchConditions;
      }

      // Filter theo type
      if (type) {
        filter.type = type;
      }

      // Filter theo status
      if (status) {
        filter.status = status;
      }

      // Filter theo priority
      if (priority) {
        filter.priority = priority;
      }

      // Filter theo date range
      if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
        if (dateTo) filter.createdAt.$lte = new Date(dateTo + "T23:59:59.999Z");
      }

      // Search filter
      if (search) {
        const searchRegex = new RegExp(search, "i");
        filter.$or = [
          { phoneNumber: searchRegex },
          { message: searchRegex },
          { address: searchRegex },
          { notes: searchRegex },
          { "userId.fullName": searchRegex },
          { "userId.email": searchRegex },
          { "userId.username": searchRegex },
        ];
      }

      // Filter có location hay không
      if (hasLocation === "true") {
        filter.$and = [
          { latitude: { $exists: true, $ne: null } },
          { longitude: { $exists: true, $ne: null } },
        ];
      } else if (hasLocation === "false") {
        filter.$or = [
          { latitude: { $exists: false } },
          { latitude: null },
          { longitude: { $exists: false } },
          { longitude: null },
        ];
      }

      // Filter theo chế độ im lặng
      if (isSilent === "true") {
        filter.isSilent = true;
      } else if (isSilent === "false") {
        filter.isSilent = false;
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { [sortBy]: sortOrder === "desc" ? -1 : 1 },
        populate: [
          {
            path: "userId",
            select: "username fullName email profile.avatar isOnline lastSeen",
          },
          {
            path: "respondedBy",
            select: "username fullName role",
          },
        ],
      };

      const emergencies = await EmergencyRequest.find(filter)
        .populate(options.populate)
        .sort(options.sort)
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .lean();

      // Đếm tổng số yêu cầu
      const total = await EmergencyRequest.countDocuments(filter);

      // Thêm thông tin bổ sung
      const enhancedEmergencies = emergencies.map((emergency) => {
        const now = new Date();
        const createdAt = new Date(emergency.createdAt);
        const hoursDiff = Math.floor((now - createdAt) / (1000 * 60 * 60));
        const minutesDiff = Math.floor((now - createdAt) / (1000 * 60));

        let priority = emergency.priority || "medium";
        if (emergency.type === "panic") priority = "critical";
        if (minutesDiff < 60 && emergency.status === "pending")
          priority = "high";
        if (!emergency.latitude || !emergency.longitude) priority = "low";

        // Format dates
        const formattedCreatedAt = formatDateTime(emergency.createdAt);
        const formattedUpdatedAt = formatDateTime(emergency.updatedAt);
        const age = calculateEmergencyAge(emergency.createdAt);

        return {
          ...emergency,
          priority,
          age,
          formattedCreatedAt,
          formattedUpdatedAt,
          ageHours: hoursDiff,
          responseTime: calculateResponseTime(emergency),
          typeLabel: getEmergencyTypeLabel(emergency.type),
          priorityLabel: getPriorityLabel(priority),
          statusLabel: getStatusLabel(emergency.status),
        };
      });

      res.json({
        success: true,
        data: {
          emergencies: enhancedEmergencies,
          pagination: {
            page: options.page,
            limit: options.limit,
            total,
            pages: Math.ceil(total / options.limit),
          },
        },
      });
    } catch (error) {
      console.error("Get emergencies error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách yêu cầu khẩn cấp",
      });
    }
  },

  // Lấy chi tiết yêu cầu khẩn cấp
  async getEmergencyDetail(req, res) {
    try {
      const { emergencyId } = req.params;

      console.log("Emergency detail fetched:", emergencyId);

      const emergency = await EmergencyRequest.findById(emergencyId)
        .populate(
          "userId",
          "username fullName email profile.avatar isOnline lastSeen"
        )
        .populate("respondedBy", "username fullName role")
        .lean();

      if (!emergency) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy yêu cầu khẩn cấp",
        });
      }

      // Format thông tin
      const formattedEmergency = {
        ...emergency,
        formattedCreatedAt: formatDateTime(emergency.createdAt),
        formattedUpdatedAt: formatDateTime(emergency.updatedAt),
        formattedRespondedAt: formatDateTime(emergency.respondedAt),
        formattedResolvedAt: formatDateTime(emergency.resolvedAt),
        age: calculateEmergencyAge(emergency.createdAt),
        responseTime: calculateResponseTime(emergency),
        typeLabel: getEmergencyTypeLabel(emergency.type),
        priorityLabel: getPriorityLabel(emergency.priority),
        statusLabel: getStatusLabel(emergency.status),
        mapUrl: `https://www.google.com/maps?q=${emergency.latitude},${emergency.longitude}`,
        deviceInfo: emergency.deviceInfo || {},
        notes: emergency.notes || emergency.responseNotes || "",
      };

      res.json({
        success: true,
        data: {
          emergency: formattedEmergency,
        },
      });
    } catch (error) {
      console.error("Get emergency detail error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy chi tiết yêu cầu khẩn cấp",
      });
    }
  },

  // Cập nhật trạng thái
  async updateStatus(req, res) {
    try {
      const { emergencyId } = req.params;
      const { status, notes } = req.body;

      const updateData = { status, updatedAt: new Date() };

      if (status === "responded") {
        updateData.respondedAt = new Date();
        updateData.respondedBy = req.user?.userId;
        if (notes) updateData.responseNotes = notes;
      } else if (status === "resolved") {
        updateData.resolvedAt = new Date();
        if (notes) updateData.resolutionNotes = notes;
      } else if (status === "cancelled" && notes) {
        updateData.resolutionNotes = notes;
      }

      const emergency = await EmergencyRequest.findByIdAndUpdate(
        emergencyId,
        updateData,
        { new: true }
      )
        .populate("respondedBy", "username fullName")
        .populate("userId", "fullName email");

      if (!emergency) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy yêu cầu khẩn cấp",
        });
      }
      res.json({
        success: true,
        data: { emergency },
        message: "Cập nhật trạng thái thành công",
      });
    } catch (error) {
      console.error("Update status error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật trạng thái",
      });
    }
  },

  // Phản hồi yêu cầu
  async respondToEmergency(req, res) {
    try {
      const { emergencyId } = req.params;
      const { responderId, notes, estimatedTime, priority, assignedTeam } =
        req.body;

      const updateData = {
        status: "responded",
        respondedAt: new Date(),
        respondedBy: responderId,
        responseNotes: notes,
        estimatedResponseTime: estimatedTime,
        priority: priority || "medium",
        assignedTeam,
        updatedAt: new Date(),
      };

      const emergency = await EmergencyRequest.findByIdAndUpdate(
        emergencyId,
        updateData,
        { new: true }
      )
        .populate("respondedBy", "username fullName role")
        .populate("userId", "fullName email");

      if (!emergency) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy yêu cầu khẩn cấp",
        });
      }

      res.json({
        success: true,
        data: { emergency },
        message: "Đã gửi phản hồi thành công",
      });
    } catch (error) {
      console.error("Respond to emergency error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi phản hồi yêu cầu",
      });
    }
  },

  // Xoá yêu cầu
  async deleteEmergency(req, res) {
    try {
      const { emergencyId } = req.params;

      const emergency = await EmergencyRequest.findByIdAndDelete(emergencyId);

      if (!emergency) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy yêu cầu khẩn cấp",
        });
      }

      res.json({
        success: true,
        message: "Đã xoá yêu cầu khẩn cấp thành công",
      });
    } catch (error) {
      console.error("Delete emergency error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xoá yêu cầu khẩn cấp",
      });
    }
  },

  // Lấy thống kê
  async getEmergencyStats(req, res) {
    try {
      // Thống kê cơ bản
      const totalEmergencies = await EmergencyRequest.countDocuments();

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const todayEmergencies = await EmergencyRequest.countDocuments({
        createdAt: {
          $gte: todayStart,
          $lte: todayEnd,
        },
      });

      // Phân bố theo loại
      const typeDistribution = await EmergencyRequest.aggregate([
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);

      // Phân bố theo trạng thái
      const statusDistribution = await EmergencyRequest.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);

      // Tính thời gian phản hồi trung bình
      const responseTimeStats = await EmergencyRequest.aggregate([
        {
          $match: {
            respondedAt: { $exists: true, $ne: null },
            createdAt: { $exists: true, $ne: null },
          },
        },
        {
          $project: {
            responseTime: {
              $divide: [
                { $subtract: ["$respondedAt", "$createdAt"] },
                60000, // Chuyển sang phút
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgResponseTime: { $avg: "$responseTime" },
            minResponseTime: { $min: "$responseTime" },
            maxResponseTime: { $max: "$responseTime" },
          },
        },
      ]);

      // Tỷ lệ giải quyết
      const resolvedCount = await EmergencyRequest.countDocuments({
        status: "resolved",
      });
      const resolutionRate =
        totalEmergencies > 0
          ? Math.round((resolvedCount / totalEmergencies) * 100)
          : 0;

      // Tỷ lệ khẩn cấp
      const criticalCount = await EmergencyRequest.countDocuments({
        type: "panic",
      });
      const criticalRate =
        totalEmergencies > 0
          ? Math.round((criticalCount / totalEmergencies) * 100)
          : 0;

      // Thống kê theo ưu tiên
      const priorityDistribution = await EmergencyRequest.aggregate([
        {
          $group: {
            _id: "$priority",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);

      res.json({
        success: true,
        data: {
          totalEmergencies,
          todayEmergencies,
          typeDistribution,
          statusDistribution,
          priorityDistribution,
          avgResponseTime: responseTimeStats[0]?.avgResponseTime
            ? Math.round(responseTimeStats[0].avgResponseTime)
            : 0,
          minResponseTime: responseTimeStats[0]?.minResponseTime
            ? Math.round(responseTimeStats[0].minResponseTime)
            : 0,
          maxResponseTime: responseTimeStats[0]?.maxResponseTime
            ? Math.round(responseTimeStats[0].maxResponseTime)
            : 0,
          resolutionRate,
          criticalRate,
        },
      });
    } catch (error) {
      console.error("Get emergency stats error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê",
      });
    }
  },

  // Lấy thống kê nâng cao
  async getAdvancedStats(req, res) {
    try {
      // Phân bố theo giờ
      const hourlyActivity = await EmergencyRequest.aggregate([
        {
          $group: {
            _id: { $hour: "$createdAt" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Người dùng tích cực nhất
      const mostActiveUser = await EmergencyRequest.aggregate([
        {
          $match: {
            userId: { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: "$userId",
            emergencyCount: { $sum: 1 },
            lastEmergency: { $max: "$createdAt" },
          },
        },
        { $sort: { emergencyCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            _id: 1,
            fullName: "$user.fullName",
            email: "$user.email",
            phoneNumber: "$user.phoneNumber",
            emergencyCount: 1,
            lastEmergency: 1,
          },
        },
      ]);

      // Giờ cao điểm
      const peakHourData = hourlyActivity.reduce(
        (max, hour) => (hour.count > max.count ? hour : max),
        { count: 0 }
      );
      const peakHour =
        peakHourData._id !== undefined
          ? `${peakHourData._id.toString().padStart(2, "0")}:00`
          : "N/A";

      // Thời gian giải quyết trung bình
      const resolutionTimeStats = await EmergencyRequest.aggregate([
        {
          $match: {
            resolvedAt: { $exists: true, $ne: null },
            createdAt: { $exists: true, $ne: null },
          },
        },
        {
          $project: {
            resolutionTime: {
              $divide: [
                { $subtract: ["$resolvedAt", "$createdAt"] },
                60000, // Chuyển sang phút
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgResolutionTime: { $avg: "$resolutionTime" },
            medianResolutionTime: { $avg: "$resolutionTime" }, // Simplified median
          },
        },
      ]);

      // Yêu cầu có vị trí vs không có vị trí
      const withLocation = await EmergencyRequest.countDocuments({
        latitude: { $exists: true, $ne: null },
        longitude: { $exists: true, $ne: null },
      });
      const withoutLocation = await EmergencyRequest.countDocuments({
        $or: [
          { latitude: { $exists: false } },
          { latitude: null },
          { longitude: { $exists: false } },
          { longitude: null },
        ],
      });

      // Phân bố theo tháng
      const monthlyActivity = await EmergencyRequest.aggregate([
        {
          $group: {
            _id: {
              month: { $month: "$createdAt" },
              year: { $year: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      // Top responders
      const topResponders = await EmergencyRequest.aggregate([
        {
          $match: {
            respondedBy: { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: "$respondedBy",
            responseCount: { $sum: 1 },
            avgResponseTime: {
              $avg: {
                $divide: [{ $subtract: ["$respondedAt", "$createdAt"] }, 60000],
              },
            },
          },
        },
        { $sort: { responseCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            _id: 1,
            fullName: "$user.fullName",
            role: "$user.role",
            responseCount: 1,
            avgResponseTime: { $round: ["$avgResponseTime", 2] },
          },
        },
      ]);

      res.json({
        success: true,
        data: {
          hourlyActivity,
          mostActiveUser,
          topResponders,
          peakHour,
          avgResolutionTime: resolutionTimeStats[0]?.avgResolutionTime
            ? Math.round(resolutionTimeStats[0].avgResolutionTime)
            : 0,
          medianResolutionTime: resolutionTimeStats[0]?.medianResolutionTime
            ? Math.round(resolutionTimeStats[0].medianResolutionTime)
            : 0,
          locationStats: {
            withLocation,
            withoutLocation,
            percentage:
              withLocation + withoutLocation > 0
                ? Math.round(
                    (withLocation / (withLocation + withoutLocation)) * 100
                  )
                : 0,
          },
          monthlyActivity,
        },
      });
    } catch (error) {
      console.error("Get advanced stats error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê nâng cao",
      });
    }
  },

  // Lấy danh sách người phản hồi
  async getResponders(req, res) {
    try {
      const responders = await User.find({
        role: { $in: ["admin", "supporter", "doctor"] },
        active: true,
      }).select(
        "username fullName email role isOnline lastSeen profile.avatar"
      );

      res.json({
        success: true,
        data: responders,
      });
    } catch (error) {
      console.error("Get responders error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách người phản hồi",
      });
    }
  },

  // Xuất dữ liệu
  async exportData(req, res) {
    try {
      const { format = "csv", ...filters } = req.query;

      // Build filter (tương tự getEmergencies)
      let filter = {};

      if (filters.type) filter.type = filters.type;
      if (filters.status) filter.status = filters.status;
      if (filters.priority) filter.priority = filters.priority;

      if (filters.dateFrom || filters.dateTo) {
        filter.createdAt = {};
        if (filters.dateFrom)
          filter.createdAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo)
          filter.createdAt.$lte = new Date(filters.dateTo + "T23:59:59.999Z");
      }

      const emergencies = await EmergencyRequest.find(filter)
        .populate("userId", "username fullName email phoneNumber")
        .populate("respondedBy", "username fullName role")
        .lean();

      // Format data based on export type
      let data, contentType, filename;

      switch (format) {
        case "json":
          contentType = "application/json";
          filename = `emergencies_${formatDateForFilename(new Date())}.json`;
          data = JSON.stringify(emergencies, null, 2);
          break;

        case "csv":
          contentType = "text/csv";
          filename = `emergencies_${formatDateForFilename(new Date())}.csv`;

          // Convert to CSV
          const headers = [
            "ID",
            "Thời gian tạo",
            "Loại",
            "Trạng thái",
            "Độ ưu tiên",
            "Số điện thoại",
            "Tin nhắn",
            "Địa chỉ",
            "Tọa độ",
            "Người dùng",
            "Email người dùng",
            "Người phản hồi",
            "Vai trò người phản hồi",
            "Ghi chú phản hồi",
            "Thời gian phản hồi",
            "Thời gian giải quyết",
            "Thiết bị (pin %)",
            "Thiết bị (mạng)",
            "Chế độ im lặng",
          ];

          const rows = emergencies.map((emergency) => [
            emergency._id,
            formatDateTimeForExport(emergency.createdAt),
            getEmergencyTypeLabel(emergency.type),
            getStatusLabel(emergency.status),
            getPriorityLabel(emergency.priority),
            emergency.phoneNumber || "",
            emergency.message || "",
            emergency.address || "",
            emergency.latitude && emergency.longitude
              ? `${emergency.latitude},${emergency.longitude}`
              : "",
            emergency.userId?.fullName || "",
            emergency.userId?.email || "",
            emergency.respondedBy?.fullName || "",
            emergency.respondedBy?.role || "",
            emergency.responseNotes || "",
            formatDateTimeForExport(emergency.respondedAt),
            formatDateTimeForExport(emergency.resolvedAt),
            emergency.deviceInfo?.battery
              ? `${emergency.deviceInfo.battery}%`
              : "",
            emergency.deviceInfo?.network || "",
            emergency.isSilent ? "Có" : "Không",
          ]);

          const csvContent = [
            headers.join(","),
            ...rows.map((row) =>
              row
                .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
                .join(",")
            ),
          ].join("\n");

          data = csvContent;
          break;

        default:
          return res.status(400).json({
            success: false,
            message: "Định dạng xuất không hợp lệ",
          });
      }

      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.send(data);
    } catch (error) {
      console.error("Export data error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xuất dữ liệu",
      });
    }
  },
};

// Helper functions (không cần moment)

function formatDateTime(date) {
  if (!date) return null;
  const d = new Date(date);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatDateTimeForExport(date) {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function formatDateForFilename(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calculateEmergencyAge(createdAt) {
  if (!createdAt) return "Không xác định";

  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now - created;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return `${diffDays} ngày trước`;
}

function calculateResponseTime(emergency) {
  if (!emergency.respondedAt || !emergency.createdAt) return null;

  const responded = new Date(emergency.respondedAt);
  const created = new Date(emergency.createdAt);
  const diffMs = responded - created;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  return `${diffMinutes} phút ${diffSeconds} giây`;
}

function getEmergencyTypeLabel(type) {
  const types = {
    panic: "Khẩn cấp",
    medical: "Y tế",
    fire: "Hỏa hoạn",
    police: "Cảnh sát",
    other: "Khác",
  };
  return types[type] || type;
}

function getPriorityLabel(priority) {
  const priorities = {
    critical: "Khẩn cấp",
    high: "Cao",
    medium: "Trung bình",
    low: "Thấp",
  };
  return priorities[priority] || priority;
}

function getStatusLabel(status) {
  const statuses = {
    pending: "Đang chờ",
    responded: "Đã tiếp nhận",
    in_progress: "Đang xử lý",
    resolved: "Đã giải quyết",
    cancelled: "Đã hủy",
    expired: "Hết hạn",
  };
  return statuses[status] || status;
}

module.exports = adminEmergencyController;
