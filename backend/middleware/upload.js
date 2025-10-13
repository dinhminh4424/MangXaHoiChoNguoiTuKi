const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Đảm bảo thư mục upload tồn tại
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Đảm bảo thư mục upload tồn tại
const uploadDirectories = [
  "uploads/images",
  "uploads/videos",
  "uploads/audio",
  "uploads/documents",
];

uploadDirectories.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Cấu hình storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = "uploads/documents/";

    if (file.mimetype.startsWith("image/")) {
      uploadPath = "uploads/images/";
    } else if (file.mimetype.startsWith("video/")) {
      uploadPath = "uploads/videos/";
    } else if (file.mimetype.startsWith("audio/")) {
      uploadPath = "uploads/audio/";
    } else if (file.mimetype.startsWith("documents/")) {
      uploadPath = "uploads/documents/";
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Tạo tên file unique
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    // Sử dụng originalname để giữ tên gốc nhưng thêm unique suffix
    const originalName = path.parse(file.originalname).name;
    cb(null, originalName + "-" + uniqueSuffix + ext);
  },
});

// Filter file type
const fileFilter = (req, file, cb) => {
  // Cho phép các loại file an toàn
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/x-msvideo",
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/mp4",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
    "text/plain",
    "application/json",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Loại file  ${file.mimetype} không được hỗ trợ`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    // files: 5, // max 5 files
  },
  fileFilter: fileFilter,
});

upload.errorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File quá lớn. Kích thước tối đa là 10MB",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Quá nhiều file. Tối đa 5 file",
      });
    }
  }
  next(err);
};

module.exports = upload;
