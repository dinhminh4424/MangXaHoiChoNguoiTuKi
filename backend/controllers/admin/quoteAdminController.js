const Quote = require("../../models/Quote");
const AuditLog = require("../../models/AuditLog");

/**
 * Lấy tất cả quotes với phân trang và lọc
 */
const getAllQuotes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      author = "",
      status = "",
      fromDate = "",
      toDate = "",
    } = req.query;

    const skip = (page - 1) * limit;

    const filter = {};

    // Tìm kiếm theo nội dung
    if (search) {
      filter.content = { $regex: search, $options: "i" };
    }

    // Tìm kiếm theo tác giả
    if (author) {
      filter.author = { $regex: author, $options: "i" };
    }

    // Lọc theo trạng thái
    if (status === "active") {
      filter.active = true;
    } else if (status === "inactive") {
      filter.active = false;
    }

    // Lọc theo thời gian
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) {
        const fromDateObj = new Date(fromDate);
        fromDateObj.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = fromDateObj;
      }
      if (toDate) {
        const toDateObj = new Date(toDate);
        toDateObj.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = toDateObj;
      }
    }

    // Tạo aggregation pipeline để lấy dữ liệu
    const pipeline = [
      { $match: filter },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          metadata: [
            { $count: "total" },
            { $addFields: { page: parseInt(page), limit: parseInt(limit) } },
          ],
          data: [
            { $skip: skip },
            { $limit: parseInt(limit) },
            {
              $addFields: {
                id: "$_id",
                statusText: {
                  $cond: {
                    if: "$active",
                    then: "Đang hoạt động",
                    else: "Đã tắt",
                  },
                },
              },
            },
          ],
        },
      },
      {
        $project: {
          quotes: "$data",
          pagination: {
            $arrayElemAt: [
              {
                $map: {
                  input: "$metadata",
                  as: "meta",
                  in: {
                    current: "$$meta.page",
                    total: "$$meta.total",
                    pages: {
                      $ceil: {
                        $divide: ["$$meta.total", parseInt(limit)],
                      },
                    },
                    limit: parseInt(limit),
                  },
                },
              },
              0,
            ],
          },
        },
      },
    ];

    const result = await Quote.aggregate(pipeline);

    const response = result[0] || {
      quotes: [],
      pagination: {
        current: parseInt(page),
        total: 0,
        pages: 0,
        limit: parseInt(limit),
      },
    };

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Get all quotes error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách quotes",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Lấy quote theo ID
 */
const getQuoteById = async (req, res) => {
  try {
    const { quoteId } = req.params;

    const quote = await Quote.findById(quoteId);
    if (!quote) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy quote",
      });
    }

    res.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    console.error("Get quote by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin quote",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Tạo quote mới
 */
const createQuote = async (req, res) => {
  try {
    const { content, author, active = true } = req.body;

    // Validate
    if (!content || content.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Nội dung quote là bắt buộc",
      });
    }

    const quote = new Quote({
      content: content.trim(),
      author: author?.trim() || "Khuyết Danh",
      active: active !== undefined ? active : true,
    });

    await quote.save();

    // Ghi log (nếu có hệ thống log)
    try {
      await AuditLog.create({
        timestamp: new Date(),
        actorId: req.user?.userId,
        actorRole: req.user?.role,
        action: "create_quote",
        target: {
          type: "Quote",
          id: quote._id,
        },
        details: {
          content: quote.content.substring(0, 100) + "...",
          author: quote.author,
        },
        ip: req.ip,
        correlationId: req.correlationId,
      });
    } catch (logError) {
      console.error("Audit log error:", logError);
    }

    res.status(201).json({
      success: true,
      message: "Tạo quote thành công",
      data: quote,
    });
  } catch (error) {
    console.error("Create quote error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo quote",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Cập nhật quote
 */
const updateQuote = async (req, res) => {
  try {
    const { quoteId } = req.params;
    const { content, author, active } = req.body;

    const quote = await Quote.findById(quoteId);
    if (!quote) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy quote",
      });
    }

    // Lưu lại dữ liệu cũ để log
    const oldData = {
      content: quote.content,
      author: quote.author,
      active: quote.active,
    };

    // Cập nhật các trường nếu có
    if (content !== undefined) {
      quote.content = content.trim();
    }
    if (author !== undefined) {
      quote.author = author.trim() || "Khuyết Danh";
    }
    if (active !== undefined) {
      quote.active = active;
    }

    await quote.save();

    // Ghi log
    try {
      await AuditLog.create({
        timestamp: new Date(),
        actorId: req.user?.userId,
        actorRole: req.user?.role,
        action: "update_quote",
        target: {
          type: "Quote",
          id: quote._id,
        },
        details: {
          old: oldData,
          new: {
            content: quote.content.substring(0, 100) + "...",
            author: quote.author,
            active: quote.active,
          },
        },
        ip: req.ip,
        correlationId: req.correlationId,
      });
    } catch (logError) {
      console.error("Audit log error:", logError);
    }

    res.json({
      success: true,
      message: "Cập nhật quote thành công",
      data: quote,
    });
  } catch (error) {
    console.error("Update quote error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật quote",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Xóa quote (soft delete hoặc hard delete)
 */
const deleteQuote = async (req, res) => {
  try {
    const { quoteId } = req.params;
    const { hardDelete = false } = req.query;

    const quote = await Quote.findById(quoteId);
    if (!quote) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy quote",
      });
    }

    if (hardDelete === "true") {
      // Hard delete
      await Quote.findByIdAndDelete(quoteId);

      // Ghi log
      await AuditLog.create({
        timestamp: new Date(),
        actorId: req.user?.userId,
        actorRole: req.user?.role,
        action: "hard_delete_quote",
        target: {
          type: "Quote",
          id: quoteId,
        },
        details: {
          content: quote.content.substring(0, 100) + "...",
          author: quote.author,
        },
        ip: req.ip,
        correlationId: req.correlationId,
      });

      return res.json({
        success: true,
        message: "Đã xóa vĩnh viễn quote",
      });
    } else {
      // Soft delete (chuyển thành inactive)
      quote.active = false;
      await quote.save();

      // Ghi log
      await AuditLog.create({
        timestamp: new Date(),
        actorId: req.user?.userId,
        actorRole: req.user?.role,
        action: "deactivate_quote",
        target: {
          type: "Quote",
          id: quote._id,
        },
        details: {
          content: quote.content.substring(0, 100) + "...",
          author: quote.author,
        },
        ip: req.ip,
        correlationId: req.correlationId,
      });

      return res.json({
        success: true,
        message: "Đã tắt quote",
        data: quote,
      });
    }
  } catch (error) {
    console.error("Delete quote error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa quote",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Kích hoạt/Deactivate quote
 */
const toggleQuoteStatus = async (req, res) => {
  try {
    const { quoteId } = req.params;

    const quote = await Quote.findById(quoteId);
    if (!quote) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy quote",
      });
    }

    const newStatus = !quote.active;
    quote.active = newStatus;
    await quote.save();

    // Ghi log
    await AuditLog.create({
      timestamp: new Date(),
      actorId: req.user?.userId,
      actorRole: req.user?.role,
      action: newStatus ? "activate_quote" : "deactivate_quote",
      target: {
        type: "Quote",
        id: quote._id,
      },
      details: {
        content: quote.content.substring(0, 100) + "...",
        author: quote.author,
      },
      ip: req.ip,
      correlationId: req.correlationId,
    });

    res.json({
      success: true,
      message: newStatus ? "Đã kích hoạt quote" : "Đã tắt quote",
      data: quote,
    });
  } catch (error) {
    console.error("Toggle quote status error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi thay đổi trạng thái quote",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Lấy quote ngẫu nhiên (cho frontend)
 */
const getRandomQuote = async (req, res) => {
  try {
    const count = await Quote.countDocuments({ active: true });

    if (count === 0) {
      return res.json({
        success: true,
        data: {
          content: "Hãy sống một cuộc đời đáng nhớ!",
          author: "Khuyết Danh",
          totalQuotes: 0,
        },
      });
    }

    const randomIndex = Math.floor(Math.random() * count);
    const quote = await Quote.findOne({ active: true }).skip(randomIndex);

    res.json({
      success: true,
      data: {
        ...quote.toObject(),
        totalQuotes: count,
      },
    });
  } catch (error) {
    console.error("Get random quote error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy quote ngẫu nhiên",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getAllQuotes,
  getQuoteById,
  createQuote,
  updateQuote,
  deleteQuote,
  toggleQuoteStatus,
  getRandomQuote,
};
