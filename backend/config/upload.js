// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// // Đảm bảo thư mục uploads tồn tại
// const uploadsDir = path.join(__dirname, "../uploads");
// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir, { recursive: true });
// }

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     let folder = "general";

//     if (file.mimetype.startsWith("image/")) {
//       folder = "images";
//     } else if (file.mimetype.startsWith("video/")) {
//       folder = "videos";
//     } else if (file.mimetype.startsWith("audio/")) {
//       folder = "audios";
//     } else {
//       folder = "files";
//     }

//     const dir = path.join(uploadsDir, folder);
//     if (!fs.existsSync(dir)) {
//       fs.mkdirSync(dir, { recursive: true });
//     }

//     cb(null, dir);
//   },
//   filename: function (req, file, cb) {
//     // Tạo tên file unique
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     const ext = path.extname(file.originalname);
//     cb(null, file.fieldname + "-" + uniqueSuffix + ext);
//   },
// });

// const fileFilter = (req, file, cb) => {
//   // Chấp nhận các loại file
//   const allowedMimes = [
//     "image/jpeg",
//     "image/png",
//     "image/gif",
//     "image/webp",
//     "application/pdf",
//     "text/plain",
//     "application/msword",
//     "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//   ];

//   if (allowedMimes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error("File type not allowed"), false);
//   }
// };

// const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10MB max
//     files: 5, // max 5 files
//   },
// });

// module.exports = upload;

// middleware/upload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs-extra");

// Đảm bảo thư mục upload tồn tại
const uploadDirectories = [
  "uploads/images",
  "uploads/videos",
  "uploads/audio",
  "uploads/documents",
  "uploads/others",
];

uploadDirectories.forEach((dir) => {
  fs.ensureDirSync(dir);
});

// Cấu hình storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = "uploads/others/";

    if (file.mimetype.startsWith("image/")) {
      uploadPath = "uploads/images/";
    } else if (file.mimetype.startsWith("video/")) {
      uploadPath = "uploads/videos/";
    } else if (file.mimetype.startsWith("audio/")) {
      uploadPath = "uploads/audio/";
    } else if (
      file.mimetype.startsWith("application/") ||
      file.mimetype.startsWith("text/")
    ) {
      uploadPath = "uploads/documents/";
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Tạo tên file unique nhưng vẫn giữ tên gốc
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const originalName = path.parse(file.originalname).name;

    // Loại bỏ ký tự đặc biệt và giới hạn độ dài
    const safeName = originalName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-zA-Z0-9\s_-]/g, "") // Remove special chars
      .replace(/\s+/g, "-") // Replace spaces with dashes
      .substring(0, 100); // Limit length

    cb(null, `${safeName}-${uniqueSuffix}${ext}`);
  },
});

// Filter file type
const fileFilter = (req, file, cb) => {
  // Cho phép các loại file an toàn
  const allowedTypes = [
    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/bmp",
    "image/tiff",

    // Videos
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-ms-wmv",
    "video/x-flv",
    "video/3gpp",
    "video/webm",

    // Audio
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/mp4",
    "audio/aac",
    "audio/x-m4a",
    "audio/webm",

    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/zip",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "text/plain",
    "text/csv",
    "application/json",
    "application/xml",

    // Others
    "application/octet-stream",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Loại file ${file.mimetype} không được hỗ trợ`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB - tăng lên để phù hợp với nhu cầu thực tế
    files: 10, // max 10 files
  },
  fileFilter: fileFilter,
});

// Error handler cho upload thông thường
upload.errorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File quá lớn. Kích thước tối đa là 50MB",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Quá nhiều file. Tối đa 10 file",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Field name không đúng",
      });
    }
  }

  if (err.message.includes("Loại file")) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next(err);
};

// Utility function để xóa file
upload.deleteFile = async (filePath) => {
  try {
    await fs.remove(filePath);
    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
};

// Utility function để lấy thông tin file
upload.getFileInfo = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return {
      exists: true,
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
    };
  } catch (error) {
    return { exists: false };
  }
};

module.exports = upload;
