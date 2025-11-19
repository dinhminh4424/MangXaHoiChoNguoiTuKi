const ImageBackground = require("../models/ImageBackground");
const Image = require("../models/ImageBackground");

/**
 * IMAGE CONTROLLER
 * Quản lý hình ảnh mặc định cho trang web
 */

// Lấy tất cả hình ảnh với filter
const getAllImages = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category = "",
      search = "",
      active = true,
    } = req.query;

    const skip = (page - 1) * limit;

    // Tạo filter
    const filter = {};

    // Lọc theo category
    if (category && category !== "all") {
      filter.category = category;
    }

    // Tìm kiếm
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const [images, total] = await Promise.all([
      Image.find(filter)
        .populate("uploadedBy", "username email profile.avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Image.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        images,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Get all images error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách hình ảnh",
    });
  }
};

// Lấy hình ảnh theo ID
const getImageById = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await Image.findById(id).populate(
      "uploadedBy",
      "username email profile.avatar"
    );

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hình ảnh",
      });
    }

    res.json({
      success: true,
      data: image,
    });
  } catch (error) {
    console.error("Get image by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin hình ảnh",
    });
  }
};

// Tạo hình ảnh mới
const createImage = async (req, res) => {
  try {
    const { title, description, category, tags, active } = req.body;

    // Kiểm tra file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn file hình ảnh",
      });
    }

    if (active == true) {
      await ImageBackground.updateMany(
        { category: category, active: true },
        { $set: { active: false } }
      );
    }

    // Tạo image data
    const imageData = {
      title,
      description: description || "",
      category: category || "Other",
      tags: tags
        ? Array.isArray(tags)
          ? tags
          : tags.split(",").map((tag) => tag.trim())
        : [],
      uploadedBy: req.user.userId,
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: `/api/uploads/images/${req.file.filename}`,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
      active: active,
    };

    const image = new Image(imageData);
    await image.save();

    // Populate để trả về thông tin đầy đủ
    await image.populate("uploadedBy", "username email profile.avatar");

    res.status(201).json({
      success: true,
      data: image,
      message: "Tạo hình ảnh thành công",
    });
  } catch (error) {
    console.error("Create image error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo hình ảnh",
    });
  }
};

// Cập nhật hình ảnh
const updateImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, tags, active } = req.body;

    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hình ảnh",
      });
    }

    // Cập nhật thông tin
    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category) updateData.category = category;
    if (active !== undefined)
      updateData.active = active === "true" || active === true;
    if (tags) {
      updateData.tags = Array.isArray(tags)
        ? tags
        : tags.split(",").map((tag) => tag.trim());
    }

    // Cập nhật file nếu có upload mới
    if (req.file) {
      updateData.file = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: `/api/uploads/images/${req.file.filename}`,
        size: req.file.size,
        mimetype: req.file.mimetype,
      };
    }

    // Nếu đang set active = true, thì set tất cả hình cùng category thành false
    if (updateData.active === true) {
      await Image.updateMany(
        {
          category: category || image.category,
          _id: { $ne: id },
          active: true,
        },
        { $set: { active: false } }
      );
    }

    const updatedImage = await Image.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("uploadedBy", "username email profile.avatar");

    res.json({
      success: true,
      data: updatedImage,
      message: "Cập nhật hình ảnh thành công",
    });
  } catch (error) {
    console.error("Update image error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật hình ảnh",
    });
  }
};

// Xóa hình ảnh
const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await Image.findByIdAndDelete(id);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hình ảnh",
      });
    }

    res.json({
      success: true,
      message: "Xóa hình ảnh thành công",
    });
  } catch (error) {
    console.error("Delete image error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa hình ảnh",
    });
  }
};

// Lấy hình ảnh theo category (public)
const getImagesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 20 } = req.query;

    const images = await Image.find({
      category,
      // active: true,
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select("title description category file tags");

    res.json({
      success: true,
      data: images,
    });
  } catch (error) {
    console.error("Get images by category error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy hình ảnh theo danh mục",
    });
  }
};

// Lấy hình ảnh theo category (public)
const getImagesByCategoryActive = async (req, res) => {
  try {
    const { category } = req.params;
    const imagesCategory = await Image.findOne({
      category: category,
      active: true,
    });

    // console.log("imagesCategory: ", imagesCategory);
    res.json({
      success: true,
      image: imagesCategory,
    });
  } catch (error) {
    console.error("Get images by category active error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy hình ảnh theo danh mục active",
    });
  }
};

// Lấy thống kê hình ảnh
const getImageStats = async (req, res) => {
  try {
    const [totalImages, categoryStats, recentUploads] = await Promise.all([
      Image.countDocuments({ active: true }),
      Image.aggregate([
        { $match: { active: true } },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      Image.find({ active: true })
        .populate("uploadedBy", "username")
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title category file createdAt"),
    ]);

    res.json({
      success: true,
      data: {
        totalImages,
        categoryStats,
        recentUploads,
      },
    });
  } catch (error) {
    console.error("Get image stats error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê hình ảnh",
    });
  }
};

module.exports = {
  getAllImages,
  getImageById,
  createImage,
  updateImage,
  deleteImage,
  getImagesByCategory,
  getImageStats,
  getImagesByCategoryActive,
};
