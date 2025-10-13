const fs = require("fs").promises;
const path = require("path");

/**
 * FILE MANAGER UTILITY
 *
 * Quản lý toàn bộ các thao tác với file vật lý trên server
 * Bao gồm: thêm file từ form, xoá file, kiểm tra tồn tại, dọn dẹp file orphan
 *
 */

class FileManager {
  // ================================
  // FILE ADDITION METHODS (FROM FORM UPLOAD)
  // ================================

  /**
   * THÊM MỘT FILE TỪ FORM UPLOAD
   *
   * Phương thức này xử lý một file duy nhất từ form upload (multer).
   * File đã được multer lưu tạm, phương thức này xác thực và trả về thông tin file.
   *
   * @param {Object} file - File object từ multer
   * @param {string} file.path - Đường dẫn tạm của file
   * @param {string} file.originalname - Tên gốc của file
   * @param {string} file.mimetype - MIME type của file
   * @param {number} file.size - Kích thước file (bytes)
   * @param {string} file.filename - Tên file đã được multer đổi
   * @returns {Promise<Object>} - Thông tin file đã được xử lý
   *
   * @example
   * // Thêm một file từ form
   * const fileInfo = await FileManager.addFileFromForm(req.file);
   * console.log('File đã được thêm:', fileInfo.fileUrl);
   * 
   * 
   * 
    // 1. Thêm một file từ form (single file upload)
        const fileInfo = await FileManager.addFileFromForm(req.file);

    // Kết quả: { type: 'image', fileUrl: '/api/uploads/images/photo-123.jpg', ... }

    // 2. Thêm nhiều file từ form (multiple files upload)
        const results = await FileManager.addMultipleFilesFromForm(req.files);

    // Kết quả: { successful: [file1Info, file2Info], failed: [], total: 2 }

    // 3. Xoá một file
        const success = await FileManager.deleteSingleFile('/api/uploads/images/photo-123.jpg');

    // 4. Xoá nhiều file
            const deleteResults = await FileManager.deleteMultipleFiles([
            '/api/uploads/images/photo1.jpg',
            '/api/uploads/videos/video1.mp4'
            ]);
            
    // Kết quả: { successful: 2, failed: 0, total: 2 }
   * 
   * 
   */
  static async addFileFromForm(file) {
    try {
      // Validate input parameters
      if (!file || !file.path || !file.originalname) {
        throw new Error("File object không hợp lệ: thiếu thông tin cần thiết");
      }

      console.log(`📤 Đang thêm file từ form: "${file.originalname}"`);

      // Kiểm tra file tạm có tồn tại không
      try {
        await fs.access(file.path);
      } catch (err) {
        throw new Error(`File tạm không tồn tại: ${file.path}`);
      }

      // Xác định loại file và thư mục đích
      const { fileFolder, messageType } = this._getFileTypeInfo(file.mimetype);

      // Tạo đường dẫn đích (file đã có tên unique từ multer)
      const destPath = path.join(
        __dirname,
        "..",
        "uploads",
        fileFolder,
        file.filename
      );

      // Đảm bảo thư mục đích tồn tại
      await this._ensureDirectoryExists(path.dirname(destPath));

      // Di chuyển file từ thư mục tạm đến thư mục vĩnh viễn
      // Multer đã lưu file, nên chúng ta chỉ cần xác thực và trả về thông tin
      try {
        await fs.access(destPath);
        // File đã tồn tại trong thư mục đích (multer đã lưu)
        console.log(`✅ File đã được multer lưu: ${destPath}`);
      } catch (err) {
        // Nếu multer chưa lưu, chúng ta di chuyển file
        await fs.rename(file.path, destPath);
        console.log(`✅ Đã di chuyển file đến: ${destPath}`);
      }

      // Tạo URL để truy cập file
      const fileUrl = `/api/uploads/${fileFolder}/${file.filename}`;

      console.log(
        `✅ Đã thêm file thành công từ form: ${file.originalname} → ${fileUrl}`
      );

      return {
        type: messageType,
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        storedFilename: file.filename,
        filePath: destPath,
        uploadedAt: new Date(),
      };
    } catch (error) {
      console.error(
        `❌ Lỗi khi thêm file từ form ${file?.originalname}:`,
        error.message
      );

      // Cleanup: xoá file tạm nếu có lỗi
      if (file?.path) {
        try {
          await fs.unlink(file.path);
        } catch (cleanupError) {
          console.error("❌ Lỗi khi cleanup file tạm:", cleanupError.message);
        }
      }

      throw error;
    }
  }

  /**
   * THÊM NHIỀU FILE TỪ FORM UPLOAD
   *
   * Phương thức này xử lý nhiều file từ form upload (multer).
   * Sử dụng Promise.allSettled để xử lý song song.
   *
   * @param {Array} files - Mảng các file objects từ multer
   * @returns {Promise<Object>} - Kết quả xử lý
   *
   * @example
   * // Thêm nhiều file từ form
   * const results = await FileManager.addMultipleFilesFromForm(req.files);
   * console.log('Thêm thành công:', results.successful.length);
   * console.log('Thất bại:', results.failed.length);
   */
  static async addMultipleFilesFromForm(files) {
    try {
      // Validate input
      if (!files || !Array.isArray(files) || files.length === 0) {
        console.log("📝 Không có file nào từ form để xử lý");
        return { successful: [], failed: [], total: 0 };
      }

      console.log(`📤 Đang thêm ${files.length} file từ form upload...`);

      // Xử lý song song tất cả files
      const results = await Promise.allSettled(
        files.map((file) => this.addFileFromForm(file))
      );

      // Phân loại kết quả
      const successful = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);

      const failed = results
        .filter((result) => result.status === "rejected")
        .map((result, index) => ({
          file: files[index],
          error: result.reason.message,
        }));

      console.log(
        `📊 Kết quả thêm file từ form: ${successful.length} thành công, ${failed.length} thất bại`
      );

      return {
        successful,
        failed,
        total: files.length,
      };
    } catch (error) {
      console.error(
        "❌ Lỗi hệ thống khi thêm nhiều file từ form:",
        error.message
      );
      return { successful: [], failed: [], total: 0 };
    }
  }

  /**
   * XỬ LÝ FILES TỪ MULTER (ALIAS)
   *
   * Phương thức alias cho addMultipleFilesFromForm để tương thích ngược.
   * Đây là phương thức chính để xử lý file upload từ client.
   *
   * @param {Array} files - Mảng files từ req.files (multer)
   * @returns {Array} - Mảng chứa thông tin file đã được xử lý
   *
   * @example
   * // Xử lý files từ multer
   * const processedFiles = FileManager.processMulterFiles(req.files);
   */
  static async processMulterFiles(files) {
    const result = await this.addMultipleFilesFromForm(files);
    return result.successful; // Chỉ trả về các file thành công
  }

  // ================================
  // FILE DELETION METHODS
  // ================================

  /**
   * XOÁ MỘT FILE VẬT LÝ TỪ SERVER
   *
   * Phương thức này tìm và xoá file vật lý dựa trên URL được cung cấp.
   *
   * @param {string} fileUrl - Đường dẫn URL của file cần xoá
   * @returns {Promise<boolean>} - Trả về true nếu xoá thành công
   *
   * @example
   * // Xoá một file
   * const success = await FileManager.deleteSingleFile('/api/uploads/images/photo.jpg');
   */
  static async deleteSingleFile(fileUrl) {
    try {
      // Validate input parameter
      if (!fileUrl || typeof fileUrl !== "string") {
        console.log("❌ URL file không hợp lệ:", fileUrl);
        return false;
      }

      // Extract tên file từ URL
      const fileName = fileUrl.split("/").pop();

      if (!fileName) {
        console.log("❌ Không thể extract tên file từ URL:", fileUrl);
        return false;
      }

      console.log(`🔍 Đang tìm kiếm file để xoá: "${fileName}"`);

      // Danh sách các thư mục upload cần kiểm tra
      const uploadDirs = [
        "uploads/images",
        "uploads/videos",
        "uploads/audio",
        "uploads/documents",
      ];

      let deleted = false;

      // Duyệt qua tất cả các thư mục có thể chứa file
      for (const dir of uploadDirs) {
        const filePath = path.join(__dirname, "..", dir, fileName);

        try {
          // Kiểm tra xem file có tồn tại trong thư mục này không
          await fs.access(filePath);

          // File tồn tại, tiến hành xoá
          await fs.unlink(filePath);
          console.log(`✅ Đã xoá file thành công: ${filePath}`);
          deleted = true;
          break;
        } catch (err) {
          if (err.code === "ENOENT") {
            // File không tồn tại trong thư mục này, tiếp tục kiểm tra thư mục khác
            continue;
          } else {
            console.error(`❌ Lỗi khi truy cập file ${filePath}:`, err.message);
          }
        }
      }

      if (!deleted) {
        console.log(
          `❌ Không tìm thấy file trong bất kỳ thư mục nào: ${fileName}`
        );
      }

      return deleted;
    } catch (error) {
      console.error(`❌ Lỗi hệ thống khi xoá file ${fileUrl}:`, error.message);
      return false;
    }
  }

  /**
   * XOÁ NHIỀU FILE VẬT LÝ CÙNG LÚC
   *
   * Phương thức này xử lý xoá hàng loạt nhiều file cùng lúc.
   *
   * @param {string[]} fileUrls - Mảng chứa các URLs của files cần xoá
   * @returns {Promise<Object>} - Kết quả xoá
   *
   * @example
   * // Xoá nhiều file cùng lúc
   * const results = await FileManager.deleteMultipleFiles([
   *   '/api/uploads/images/photo1.jpg',
   *   '/api/uploads/videos/video1.mp4'
   * ]);
   */
  static async deleteMultipleFiles(fileUrls) {
    // Validate input parameters
    if (!fileUrls || !Array.isArray(fileUrls) || fileUrls.length === 0) {
      console.log("📝 Không có file nào để xoá");
      return { successful: 0, failed: 0, total: 0 };
    }

    console.log(`🗑️ Bắt đầu xoá ${fileUrls.length} file...`);

    // Sử dụng Promise.allSettled để xử lý song song
    const results = await Promise.allSettled(
      fileUrls.map((url) => this.deleteSingleFile(url))
    );

    // Thống kê kết quả
    const successful = results.filter(
      (result) => result.status === "fulfilled" && result.value
    ).length;

    const failed = results.filter(
      (result) => result.status === "rejected" || !result.value
    ).length;

    console.log(
      `📊 Kết quả xoá file: ${successful} thành công, ${failed} thất bại`
    );

    return {
      successful,
      failed,
      total: fileUrls.length,
    };
  }

  // ================================
  // PRIVATE HELPER METHODS
  // ================================

  /**
   * XÁC ĐỊNH LOẠI FILE VÀ THƯ MỤC
   *
   * @param {string} mimeType - MIME type của file
   * @returns {Object} - Thông tin loại file và thư mục
   * @private
   */
  static _getFileTypeInfo(mimeType) {
    let fileFolder = "documents";
    let messageType = "file";

    if (mimeType.startsWith("image/")) {
      fileFolder = "images";
      messageType = "image";
    } else if (mimeType.startsWith("video/")) {
      fileFolder = "videos";
      messageType = "video";
    } else if (mimeType.startsWith("audio/")) {
      fileFolder = "audio";
      messageType = "audio";
    }

    return { fileFolder, messageType };
  }

  /**
   * ĐẢM BẢO THƯ MỤC TỒN TẠI
   *
   * @param {string} dirPath - Đường dẫn thư mục
   * @returns {Promise<void>}
   * @private
   */
  static async _ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (err) {
      // Thư mục không tồn tại, tạo mới
      await fs.mkdir(dirPath, { recursive: true });
      console.log(`📁 Đã tạo thư mục: ${dirPath}`);
    }
  }

  /**
   * TẠO TÊN FILE DUY NHẤT
   *
   * @param {string} originalName - Tên file gốc
   * @returns {string} - Tên file duy nhất
   * @private
   */
  static _generateUniqueFileName(originalName) {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = path.extname(originalName);
    const name = path.parse(originalName).name;

    return `${name}-${timestamp}-${random}${ext}`;
  }
}

// Export class để sử dụng trong các modules khác
module.exports = FileManager;
