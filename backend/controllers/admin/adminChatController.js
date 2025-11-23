const Chat = require("../../models/Chat");
const Message = require("../../models/Message");
const User = require("../../models/User");

const adminChatController = {
  // Lấy danh sách hộp thoại với phân trang và filter
  async getConversations(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search = "",
        type = "", // 'direct' hoặc 'group'
        hasMessages = "",
        dateFrom = "",
        dateTo = "",
        sortBy = "updatedAt",
        sortOrder = "desc",
      } = req.query;

      // Build filter query
      let filter = {};

      // Filter theo type
      if (type === "direct") {
        filter.isGroup = false;
      } else if (type === "group") {
        filter.isGroup = true;
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
          { name: searchRegex },
          { "members.fullName": searchRegex },
          { "members.email": searchRegex },
          { "members.username": searchRegex },
        ];
      }

      // Filter có tin nhắn hay không
      if (hasMessages === "true") {
        filter.lastMessage = { $exists: true, $ne: null };
      } else if (hasMessages === "false") {
        filter.lastMessage = { $exists: false };
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { [sortBy]: sortOrder === "desc" ? -1 : 1 },
        populate: [
          {
            path: "members",
            select: "username fullName email profile.avatar isOnline lastSeen",
          },
          {
            path: "lastMessage",
            select:
              "content messageType fileUrl fileName createdAt sender recalled",
          },
          {
            path: "createdBy",
            select: "username fullName",
          },
          {
            path: "admins",
            select: "username fullName",
          },
        ],
      };

      const conversations = await Chat.find(filter)
        .populate(options.populate)
        .sort(options.sort)
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .lean();

      // Đếm tổng số hộp thoại
      const total = await Chat.countDocuments(filter);

      // Thêm thông tin bổ sung
      const enhancedConversations = await Promise.all(
        conversations.map(async (conv) => {
          // Đếm số tin nhắn
          const messageCount = await Message.countDocuments({
            chatId: conv._id,
            deletedFor: { $ne: conv._id }, // Không tính tin nhắn đã xoá
          });

          // Lấy số thành viên online
          const onlineMembers = conv.members.filter(
            (member) => member.isOnline
          ).length;

          return {
            ...conv,
            messageCount,
            onlineMembers,
            totalMembers: conv.members.length,
          };
        })
      );

      res.json({
        success: true,
        data: {
          conversations: enhancedConversations,
          pagination: {
            page: options.page,
            limit: options.limit,
            total,
            pages: Math.ceil(total / options.limit),
          },
        },
      });
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách hộp thoại",
      });
    }
  },

  // Lấy chi tiết hộp thoại
  async getConversationDetail(req, res) {
    try {
      const { conversationId } = req.params;

      const conversation = await Chat.findById(conversationId)
        .populate(
          "members",
          "username fullName email profile.avatar isOnline lastSeen role"
        )
        .populate("createdBy", "username fullName")
        .populate("admins", "username fullName")
        .populate("lastMessage")
        .lean();

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy hộp thoại",
        });
      }

      // Thêm thống kê
      const totalMessages = await Message.countDocuments({
        chatId: conversationId,
      });
      const todayMessages = await Message.countDocuments({
        chatId: conversationId,
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      });

      res.json({
        success: true,
        data: {
          conversation: {
            ...conversation,
            stats: {
              totalMessages,
              todayMessages,
            },
          },
        },
      });
    } catch (error) {
      console.error("Get conversation detail error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy chi tiết hộp thoại",
      });
    }
  },

  // Lấy tin nhắn của hộp thoại
  async getMessages(req, res) {
    try {
      const { conversationId } = req.params;
      const {
        page = 1,
        limit = 50,
        before = "",
        after = "",
        messageType = "",
        hasFile = "",
        recalled = "",
        deleted = "",
      } = req.query;

      let filter = { chatId: conversationId };

      // Filter theo loại tin nhắn
      if (messageType) {
        filter.messageType = messageType;
      }

      // Filter có file hay không
      if (hasFile === "true") {
        filter.fileUrl = { $exists: true, $ne: null };
      } else if (hasFile === "false") {
        filter.fileUrl = { $exists: false };
      }

      // Filter tin nhắn đã thu hồi
      if (recalled === "true") {
        filter.recalled = true;
      } else if (recalled === "false") {
        filter.recalled = false;
      }

      // Filter theo timestamp
      if (before) {
        filter.createdAt = { ...filter.createdAt, $lt: new Date(before) };
      }
      if (after) {
        filter.createdAt = { ...filter.createdAt, $gt: new Date(after) };
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        populate: [
          {
            path: "sender",
            select: "username fullName profile.avatar role",
          },
          {
            path: "repliedTo",
            select: "content messageType fileUrl fileName sender recalled",
            populate: {
              path: "sender",
              select: "username fullName",
            },
          },
          {
            path: "isReadBy",
            select: "username fullName",
          },
          {
            path: "deletedFor",
            select: "username fullName",
          },
        ],
      };

      const messages = await Message.find(filter)
        .populate(options.populate)
        .sort(options.sort)
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .lean();

      // Đảo ngược thứ tự để hiển thị từ cũ đến mới
      const sortedMessages = messages.reverse();

      const total = await Message.countDocuments(filter);

      res.json({
        success: true,
        data: {
          messages: sortedMessages,
          pagination: {
            page: options.page,
            limit: options.limit,
            total,
            pages: Math.ceil(total / options.limit),
            hasMore: options.page * options.limit < total,
          },
        },
      });
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy tin nhắn",
      });
    }
  },

  // Xoá hộp thoại
  async deleteConversation(req, res) {
    try {
      const { conversationId } = req.params;

      // Xoá tất cả tin nhắn trong hộp thoại
      await Message.deleteMany({ chatId: conversationId });

      // Xoá hộp thoại
      await Chat.findByIdAndDelete(conversationId);

      res.json({
        success: true,
        message: "Đã xoá hộp thoại và tất cả tin nhắn thành công",
      });
    } catch (error) {
      console.error("Delete conversation error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xoá hộp thoại",
      });
    }
  },

  // Lấy thống kê
  async getChatStats(req, res) {
    try {
      const totalConversations = await Chat.countDocuments();
      const groupConversations = await Chat.countDocuments({ isGroup: true });
      const directConversations = await Chat.countDocuments({ isGroup: false });

      const totalMessages = await Message.countDocuments();
      const todayMessages = await Message.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      });

      const messagesWithFiles = await Message.countDocuments({
        fileUrl: { $exists: true, $ne: null },
      });

      const recalledMessages = await Message.countDocuments({ recalled: true });

      // Top hộp thoại có nhiều tin nhắn nhất
      const topConversations = await Message.aggregate([
        {
          $group: {
            _id: "$chatId",
            messageCount: { $sum: 1 },
            lastMessage: { $max: "$createdAt" },
          },
        },
        { $sort: { messageCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "chats",
            localField: "_id",
            foreignField: "_id",
            as: "conversation",
          },
        },
        { $unwind: "$conversation" },
        {
          $project: {
            _id: 1,
            name: "$conversation.name",
            isGroup: "$conversation.isGroup",
            messageCount: 1,
            lastMessage: 1,
            members: "$conversation.members",
          },
        },
      ]);

      // Phân bố loại tin nhắn
      const messageTypeDistribution = await Message.aggregate([
        {
          $group: {
            _id: "$messageType",
            count: { $sum: 1 },
          },
        },
      ]);

      res.json({
        success: true,
        data: {
          totalConversations,
          groupConversations,
          directConversations,
          totalMessages,
          todayMessages,
          messagesWithFiles,
          recalledMessages,
          topConversations,
          messageTypeDistribution,
        },
      });
    } catch (error) {
      console.error("Get chat stats error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê",
      });
    }
  },

  // controllers/adminChatController.js

  // controllers/adminChatController.js
  async getAdvancedStats(req, res) {
    try {
      // Phân bố tin nhắn theo giờ
      const hourlyActivity = await Message.aggregate([
        {
          $group: {
            _id: { $hour: "$createdAt" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Top người dùng tích cực
      const topUsers = await Message.aggregate([
        {
          $group: {
            _id: "$sender",
            messageCount: { $sum: 1 },
          },
        },
        { $sort: { messageCount: -1 } },
        { $limit: 10 },
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
            username: "$user.username",
            fullName: "$user.fullName",
            avatar: "$user.profile.avatar",
            messageCount: 1,
          },
        },
      ]);

      // Phân bố theo ngày trong tuần
      const weeklyActivity = await Message.aggregate([
        {
          $group: {
            _id: { $dayOfWeek: "$createdAt" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Thống kê loại tin nhắn
      const messageTypeStats = await Message.aggregate([
        {
          $group: {
            _id: "$messageType",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);

      // Tổng số người dùng
      const totalUsers = await User.countDocuments({ active: true });

      // Tính trung bình tin nhắn mỗi người
      const totalMessages = await Message.countDocuments();
      const avgMessagesPerUser =
        totalUsers > 0 ? Math.round(totalMessages / totalUsers) : 0;

      // Tìm giờ cao điểm
      const peakHourData = hourlyActivity.reduce(
        (max, hour) => (hour.count > max.count ? hour : max),
        { count: 0 }
      );
      const peakHour =
        peakHourData._id !== undefined
          ? `${peakHourData._id.toString().padStart(2, "0")}:00`
          : "N/A";

      // Tính thời gian phản hồi trung bình (đơn giản)
      const responseTimes = await Message.aggregate([
        {
          $match: {
            repliedTo: { $exists: true, $ne: null },
          },
        },
        {
          $lookup: {
            from: "messages",
            localField: "repliedTo",
            foreignField: "_id",
            as: "originalMessage",
          },
        },
        {
          $unwind: "$originalMessage",
        },
        {
          $project: {
            responseTime: {
              $divide: [
                { $subtract: ["$createdAt", "$originalMessage.createdAt"] },
                60000, // Chuyển sang phút
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgResponseTime: { $avg: "$responseTime" },
            medianResponseTime: { $avg: "$responseTime" }, // Simplified median
          },
        },
      ]);

      const avgResponseTime =
        responseTimes.length > 0
          ? Math.round(responseTimes[0].avgResponseTime)
          : 0;
      const medianResponseTime =
        responseTimes.length > 0
          ? Math.round(responseTimes[0].medianResponseTime)
          : 0;

      // Hộp thoại tích cực nhất
      const mostActiveConversation = await Message.aggregate([
        {
          $group: {
            _id: "$chatId",
            messageCount: { $sum: 1 },
          },
        },
        { $sort: { messageCount: -1 } },
        { $limit: 1 },
        {
          $lookup: {
            from: "chats",
            localField: "_id",
            foreignField: "_id",
            as: "conversation",
          },
        },
        { $unwind: "$conversation" },
        {
          $project: {
            _id: 1,
            name: "$conversation.name",
            isGroup: "$conversation.isGroup",
            messageCount: 1,
          },
        },
      ]);

      // Trung bình tin nhắn mỗi hộp thoại
      const conversationStats = await Message.aggregate([
        {
          $group: {
            _id: "$chatId",
            messageCount: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: null,
            avgConversationLength: { $avg: "$messageCount" },
          },
        },
      ]);

      const avgConversationLength =
        conversationStats.length > 0
          ? Math.round(conversationStats[0].avgConversationLength)
          : 0;

      res.json({
        success: true,
        data: {
          hourlyActivity,
          topUsers,
          weeklyActivity,
          messageTypeStats,
          totalUsers,
          avgMessagesPerUser,
          peakHour,
          avgResponseTime,
          medianResponseTime,
          mostActiveConversation: mostActiveConversation[0] || null,
          avgConversationLength,
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
};

module.exports = adminChatController;
