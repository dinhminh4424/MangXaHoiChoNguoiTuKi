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

// =============================================== 2
// middleware/upload.js
// const multer = require("multer");
// const path = require("path");
// const fs = require("fs-extra");

// // Đảm bảo thư mục upload tồn tại
// const uploadDirectories = [
//   "uploads/images",
//   "uploads/videos",
//   "uploads/audio",
//   "uploads/documents",
//   "uploads/others",
// ];

// uploadDirectories.forEach((dir) => {
//   fs.ensureDirSync(dir);
// });

// // Cấu hình storage
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     let uploadPath = "uploads/others/";

//     if (file.mimetype.startsWith("image/")) {
//       uploadPath = "uploads/images/";
//     } else if (file.mimetype.startsWith("video/")) {
//       uploadPath = "uploads/videos/";
//     } else if (file.mimetype.startsWith("audio/")) {
//       uploadPath = "uploads/audio/";
//     } else if (
//       file.mimetype.startsWith("application/") ||
//       file.mimetype.startsWith("text/")
//     ) {
//       uploadPath = "uploads/documents/";
//     }

//     cb(null, uploadPath);
//   },
//   filename: function (req, file, cb) {
//     // Tạo tên file unique nhưng vẫn giữ tên gốc
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     const ext = path.extname(file.originalname);
//     const originalName = path.parse(file.originalname).name;

//     // Loại bỏ ký tự đặc biệt và giới hạn độ dài
//     const safeName = originalName
//       .normalize("NFD")
//       .replace(/[\u0300-\u036f]/g, "") // Remove accents
//       .replace(/[^a-zA-Z0-9\s_-]/g, "") // Remove special chars
//       .replace(/\s+/g, "-") // Replace spaces with dashes
//       .substring(0, 100); // Limit length

//     cb(null, `${safeName}-${uniqueSuffix}${ext}`);
//   },
// });

// // Filter file type
// const fileFilter = (req, file, cb) => {
//   // Cho phép các loại file an toàn
//   const allowedTypes = [
//     // Images
//     "image/jpeg",
//     "image/jpg",
//     "image/png",
//     "image/gif",
//     "image/webp",
//     "image/svg+xml",
//     "image/bmp",
//     "image/tiff",

//     // Videos
//     "video/mp4",
//     "video/mpeg",
//     "video/quicktime",
//     "video/x-msvideo",
//     "video/x-ms-wmv",
//     "video/x-flv",
//     "video/3gpp",
//     "video/webm",

//     // Audio
//     "audio/mpeg",
//     "audio/wav",
//     "audio/ogg",
//     "audio/mp4",
//     "audio/aac",
//     "audio/x-m4a",
//     "audio/webm",

//     // Documents
//     "application/pdf",
//     "application/msword",
//     "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//     "application/vnd.ms-excel",
//     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//     "application/vnd.ms-powerpoint",
//     "application/vnd.openxmlformats-officedocument.presentationml.presentation",
//     "application/zip",
//     "application/x-rar-compressed",
//     "application/x-7z-compressed",
//     "text/plain",
//     "text/csv",
//     "application/json",
//     "application/xml",

//     // Others
//     "application/octet-stream",
//   ];

//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error(`Loại file ${file.mimetype} không được hỗ trợ`), false);
//   }
// };

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 50 * 1024 * 1024, // 50MB - tăng lên để phù hợp với nhu cầu thực tế
//     files: 10, // max 10 files
//   },
//   fileFilter: fileFilter,
// });

// // Error handler cho upload thông thường
// upload.errorHandler = (err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     if (err.code === "LIMIT_FILE_SIZE") {
//       return res.status(400).json({
//         success: false,
//         message: "File quá lớn. Kích thước tối đa là 50MB",
//       });
//     }
//     if (err.code === "LIMIT_FILE_COUNT") {
//       return res.status(400).json({
//         success: false,
//         message: "Quá nhiều file. Tối đa 10 file",
//       });
//     }
//     if (err.code === "LIMIT_UNEXPECTED_FILE") {
//       return res.status(400).json({
//         success: false,
//         message: "Field name không đúng",
//       });
//     }
//   }

//   if (err.message.includes("Loại file")) {
//     return res.status(400).json({
//       success: false,
//       message: err.message,
//     });
//   }

//   next(err);
// };

// // Utility function để xóa file
// upload.deleteFile = async (filePath) => {
//   try {
//     await fs.remove(filePath);
//     return true;
//   } catch (error) {
//     console.error("Error deleting file:", error);
//     return false;
//   }
// };

// // Utility function để lấy thông tin file
// upload.getFileInfo = async (filePath) => {
//   try {
//     const stats = await fs.stat(filePath);
//     return {
//       exists: true,
//       size: stats.size,
//       createdAt: stats.birthtime,
//       modifiedAt: stats.mtime,
//     };
//   } catch (error) {
//     return { exists: false };
//   }
// };

// module.exports = upload;
// ============================================ 3
// backend/middleware/upload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// --- Cấu hình thư mục upload ---
const UPLOAD_ROOT = path.resolve(__dirname, "..", "uploads"); // đặt ở backend/uploads
const uploadDirectories = {
  images: path.join(UPLOAD_ROOT, "images"),
  videos: path.join(UPLOAD_ROOT, "videos"),
  audio: path.join(UPLOAD_ROOT, "audio"),
  documents: path.join(UPLOAD_ROOT, "documents"),
};

// Tạo các thư mục nếu chưa tồn tại
if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}
Object.values(uploadDirectories).forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// --- Helper ---
const normalizeName = (name) =>
  name
    .replace(/\s+/g, "_")
    .replace(/[^\w\-_.()]/g, "") // loại ký tự lạ
    .toLowerCase();

// Kiểm tra extension chính xác cho trường hợp .tar.gz
const getExtension = (originalName) => {
  const lower = originalName.toLowerCase();
  if (lower.endsWith(".tar.gz")) return ".tar.gz";
  if (lower.endsWith(".tar")) return ".tar";
  if (lower.endsWith(".tgz")) return ".tgz";
  return path.extname(originalName).toLowerCase();
};

// --- Storage config ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Mặc định documents
    let uploadPath = uploadDirectories.documents;

    // Phân loại bằng mimetype nếu có
    const mime = file.mimetype || "";
    if (mime.startsWith("image/")) {
      uploadPath = uploadDirectories.images;
    } else if (mime.startsWith("video/")) {
      uploadPath = uploadDirectories.videos;
    } else if (mime.startsWith("audio/")) {
      uploadPath = uploadDirectories.audio;
    } else {
      // Nếu mimetype không rõ (ví dụ application/octet-stream), dùng extension
      const ext = getExtension(file.originalname);
      const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
      const videoExts = [".mp4", ".mpeg", ".mov", ".avi", ".mkv"];
      const audioExts = [".mp3", ".wav", ".ogg", ".m4a"];
      if (imageExts.includes(ext)) uploadPath = uploadDirectories.images;
      else if (videoExts.includes(ext)) uploadPath = uploadDirectories.videos;
      else if (audioExts.includes(ext)) uploadPath = uploadDirectories.audio;
      else uploadPath = uploadDirectories.documents;
    }

    // debug log (bật biến môi trường DEBUG_UPLOAD=1 để xem)
    if (process.env.DEBUG_UPLOAD) {
      console.log(
        "[upload] dest:",
        uploadPath,
        "mimetype:",
        file.mimetype,
        "orig:",
        file.originalname
      );
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext =
      getExtension(file.originalname) || path.extname(file.originalname);
    const originalName = normalizeName(path.parse(file.originalname).name);
    cb(null, `${originalName}-${uniqueSuffix}${ext}`);
  },
});

// --- File filter (mimetype + extension fallback) ---
const allowedMimetypes = new Set([
  // images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // videos
  "video/mp4",
  "video/mpeg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  // audio
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/mp4",
  // documents / office / pdf / text / json
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "application/json",
  // archives / compressed
  "application/zip",
  "application/x-zip-compressed",
  "application/x-gzip",
  "application/gzip",
  // optionally allow generic stream (handled by extension fallback)
  // "application/octet-stream",
]);

const allowedExtensions = new Set([
  // images
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  // videos
  ".mp4",
  ".mpeg",
  ".mov",
  ".avi",
  ".mkv",
  // audio
  ".mp3",
  ".wav",
  ".ogg",
  ".m4a",
  // documents
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".txt",
  ".json",
  // archives & compressed (backup)
  ".zip",
  ".gz",
  ".tar",
  ".tar.gz",
  ".tgz",
  ".7z",
  ".rar",
]);

const fileFilter = (req, file, cb) => {
  const mime = (file.mimetype || "").toLowerCase();
  const ext = getExtension(file.originalname);

  // Debug: nếu muốn xem mimetype + ext
  if (process.env.DEBUG_UPLOAD) {
    console.log("[upload] filter: mimetype=", mime, "ext=", ext);
  }

  if (allowedMimetypes.has(mime)) {
    return cb(null, true);
  }

  // Nếu mimetype là generic hoặc không có trong list -> fallback kiểm tra extension
  if (allowedExtensions.has(ext)) {
    return cb(null, true);
  }

  // Không chấp nhận
  return cb(
    new Error(`Loại file ${file.mimetype || "unknown"} không được hỗ trợ`),
    false
  );
};

// --- Multer instance (KHÔNG giới hạn kích thước) ---
const upload = multer({
  storage,
  // ** LƯU Ý: không đặt limits để cho phép upload file rất lớn (backup) **
  fileFilter,
  // Bạn có thể thêm `preservePath: true` (multer v2+) nếu cần cấu trúc folder từ client.
});

// --- Middleware handler cho lỗi multer (sử dụng trong route) ---
upload.errorHandler = (err, req, res, next) => {
  // Nếu multer trả lỗi nội bộ
  if (err instanceof multer.MulterError) {
    // Các code của Multer: https://github.com/expressjs/multer/blob/master/lib/multer.js
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File quá lớn.",
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message || "Lỗi Multer khi upload file",
    });
  }

  // Lỗi do fileFilter hoặc lỗi khác
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "Lỗi khi upload file",
    });
  }

  next();
};

module.exports = upload;
