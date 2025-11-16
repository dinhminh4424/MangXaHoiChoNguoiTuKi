// controllers/backupRestoreController.js
const backupService = require("../services/databaseBackup");
const fileService = require("../services/fileBackup");
const restoreService = require("../services/restoreService");
const BackupLog = require("../models/BackupLog");
const fs = require("fs-extra");
const path = require("path");

exports.backupDatabase = async (req, res) => {
  let log;
  try {
    const userId = req.user.userId;
    log = await BackupLog.create({
      fileName: `db-backup-${Date.now()}`,
      type: "database",
      action: "backup",
      performedBy: userId,
      status: "in_progress",
    });

    const result = await backupService.backupWithMongodump();

    await BackupLog.findByIdAndUpdate(log._id, {
      status: "success",
      fileSize: result.size,
      fileName: result.fileName,
    });

    res.json({
      success: true,
      message: "Backup database thành công!",
      file: result.fileName,
      filePath: result.filePath,
      size: result.size,
    });
  } catch (error) {
    if (log) {
      await BackupLog.findByIdAndUpdate(log._id, {
        status: "failed",
        errorMessage: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "Backup thất bại: " + error.message,
    });
  }
};

exports.backupSystemFiles = async (req, res) => {
  let log;
  try {
    const { userId } = req.user;
    log = await BackupLog.create({
      fileName: `system-backup-${Date.now()}`,
      type: "system",
      action: "backup",
      performedBy: userId,
      status: "in_progress",
    });

    const result = await fileService.backupSystemFiles();

    await BackupLog.findByIdAndUpdate(log._id, {
      status: "success",
      fileSize: result.size,
      fileName: result.fileName,
    });

    res.json({
      success: true,
      message: "Backup system files thành công!",
      file: result.fileName,
      filePath: result.filePath,
      size: result.size,
    });
  } catch (error) {
    if (log) {
      await BackupLog.findByIdAndUpdate(log._id, {
        status: "failed",
        errorMessage: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "Backup system files thất bại: " + error.message,
    });
  }
};

exports.backupFull = async (req, res) => {
  let log;
  try {
    const { userId } = req.user;
    log = await BackupLog.create({
      fileName: `full-backup-${Date.now()}`,
      type: "full",
      action: "backup",
      performedBy: userId,
      status: "in_progress",
    });

    const result = await fileService.backupFullSystem();

    await BackupLog.findByIdAndUpdate(log._id, {
      status: "success",
      fileSize: result.size,
      fileName: result.fileName,
    });

    res.json({
      success: true,
      message: "Full backup thành công!",
      file: result.fileName,
      filePath: result.filePath,
      size: result.size,
    });
  } catch (error) {
    if (log) {
      await BackupLog.findByIdAndUpdate(log._id, {
        status: "failed",
        errorMessage: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "Full backup thất bại: " + error.message,
    });
  }
};

exports.getBackupList = async (req, res) => {
  try {
    // Lấy danh sách từ cả database backup và system backup
    const [dbBackups, systemBackups] = await Promise.all([
      backupService.getBackupList(),
      fileService.getSystemBackupList(),
    ]);

    const allBackups = [...dbBackups, ...systemBackups];

    // Sắp xếp theo ngày tạo mới nhất
    allBackups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Lấy thêm thông tin từ BackupLog
    const backupLogs = await BackupLog.find({
      action: "backup",
      status: "success",
    }).sort({ createdAt: -1 });

    // Kết hợp thông tin
    const backupList = allBackups.map((backup) => {
      const logInfo = backupLogs.find(
        (log) =>
          log.fileName === backup.name ||
          log.fileName.includes(backup.name.replace(/\.[^/.]+$/, "")) // So khớp không có extension
      );

      return {
        name: backup.name,
        size: backup.size,
        createdAt: backup.createdAt,
        type: backup.type,
        path: backup.path,
        performedBy: logInfo?.performedBy || null,
        logId: logInfo?._id || null,
      };
    });

    res.json({
      success: true,
      backups: backupList,
      total: backupList.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.downloadBackup = async (req, res) => {
  try {
    const fileName = req.params.filename;

    // Tìm file trong cả database và system backups
    const [dbBackups, systemBackups] = await Promise.all([
      backupService.getBackupList(),
      fileService.getSystemBackupList(),
    ]);

    const allBackups = [...dbBackups, ...systemBackups];
    const backupFile = allBackups.find((backup) => backup.name === fileName);

    if (!backupFile) {
      return res.status(404).json({
        success: false,
        message: "File không tồn tại",
      });
    }

    // Kiểm tra file có tồn tại không
    if (await fs.pathExists(backupFile.path)) {
      // Ghi log download
      await BackupLog.create({
        fileName: fileName,
        type: backupFile.type,
        action: "download",
        performedBy: req.user.userId,
        status: "success",
      });

      res.download(backupFile.path);
    } else {
      res.status(404).json({
        success: false,
        message: "File không tồn tại trên server",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteBackup = async (req, res) => {
  try {
    const fileName = req.params.filename;
    const { userId } = req.user;

    // Tìm file trong cả database và system backups
    const [dbBackups, systemBackups] = await Promise.all([
      backupService.getBackupList(),
      fileService.getSystemBackupList(),
    ]);

    const allBackups = [...dbBackups, ...systemBackups];
    const backupFile = allBackups.find((backup) => backup.name === fileName);

    if (!backupFile) {
      return res.status(404).json({
        success: false,
        message: "File backup không tồn tại",
      });
    }

    // Xóa file vật lý
    await fs.remove(backupFile.path);

    // Ghi log xóa
    await BackupLog.create({
      fileName: fileName,
      type: backupFile.type,
      action: "delete",
      performedBy: userId,
      status: "success",
    });

    res.json({
      success: true,
      message: "Xóa file backup thành công!",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Xóa file backup thất bại: " + error.message,
    });
  }
};

exports.getRestoreProgress = async (req, res) => {
  try {
    const { logId } = req.params;
    const log = await BackupLog.findById(logId);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Log không tồn tại",
      });
    }

    res.json({
      success: true,
      progress: log.progress || 0,
      status: log.status,
      message: log.errorMessage || "",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Trong controllers/backupRestoreController.js - hàm restoreSystem

// exports.restoreSystem = async (req, res) => {
//   let log;
//   try {
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "Vui lòng chọn file backup",
//       });
//     }

//     const { userId } = req.user;

//     console.log(
//       `Received backup file: ${req.file.originalname}, size: ${req.file.size} bytes, path: ${req.file.path}`
//     );

//     // Validate file backup
//     const validation = await restoreService.validateBackupFile(
//       req.file.path,
//       log._id
//     );
//     if (!validation.valid) {
//       return res.status(400).json({
//         success: false,
//         message: validation.error,
//       });
//     }

//     log = await BackupLog.create({
//       fileName: req.file.originalname,
//       type: validation.type,
//       action: "restore",
//       performedBy: userId,
//       status: "in_progress",
//       progress: 0,
//     });

//     // Gửi phản hồi ngay để client biết request đã được nhận
//     res.json({
//       success: true,
//       message: "Quá trình khôi phục đã bắt đầu. Vui lòng theo dõi tiến trình.",
//       logId: log._id,
//       fileInfo: {
//         originalName: req.file.originalname,
//         size: req.file.size,
//         type: validation.type,
//       },
//     });

//     // Thực hiện restore trong background với progress callback
//     const progressCallback = async (progress, message) => {
//       try {
//         await BackupLog.findByIdAndUpdate(log._id, {
//           progress,
//           status: progress === 100 ? "success" : "in_progress",
//         });
//         console.log(`Restore progress: ${progress}% - ${message}`);
//       } catch (updateError) {
//         console.error("Error updating progress:", updateError);
//       }
//     };

//     await restoreService.restoreFromFile(
//       req.file.path,
//       log._id,
//       progressCallback
//     );

//     // Cập nhật thành công hoàn toàn
//     await BackupLog.findByIdAndUpdate(log._id, {
//       status: "success",
//       progress: 100,
//     });

//     console.log(`Restore completed successfully for log: ${log._id}`);
//   } catch (error) {
//     console.error("Restore error in controller:", error);

//     if (log) {
//       await BackupLog.findByIdAndUpdate(log._id, {
//         status: "failed",
//         errorMessage: error.message,
//         progress: 0,
//       });
//     }

//     // Không gửi response lại vì đã gửi response trước đó
//   }
// };

exports.restoreSystem = async (req, res) => {
  let log;
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn file backup",
      });
    }

    const { userId } = req.user;
    const { targetDatabase, sourceDatabase, dropExisting = true } = req.body;

    console.log(`Received backup file: ${req.file.originalname}`);
    console.log(`Restore options:`, {
      targetDatabase,
      sourceDatabase,
      dropExisting,
    });

    // Validate file backup
    const validation = await restoreService.validateBackupFile(req.file.path);
    if (!validation.valid) {
      await fs.remove(req.file.path).catch(console.error);
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    // Kiểm tra target database nếu được chỉ định
    if (targetDatabase) {
      const dbExists = await restoreService.checkDatabaseExists(targetDatabase);
      console.log(`Target database '${targetDatabase}' exists: ${dbExists}`);

      if (!dbExists && dropExisting === false) {
        await fs.remove(req.file.path).catch(console.error);
        return res.status(400).json({
          success: false,
          message: `Target database '${targetDatabase}' không tồn tại và dropExisting là false`,
        });
      }
    }

    // Tạo log
    log = await BackupLog.create({
      fileName: req.file.originalname,
      filePath: req.file.path,
      type: validation.type,
      action: "restore",
      performedBy: userId,
      status: "in_progress",
      progress: 0,
      startedAt: new Date(),
      restoreOptions: {
        targetDatabase,
        sourceDatabase,
        dropExisting,
      },
    });

    // Gửi phản hồi ngay
    res.json({
      success: true,
      message: "Quá trình khôi phục đã bắt đầu. Vui lòng theo dõi tiến trình.",
      logId: log._id,
      fileInfo: {
        originalName: req.file.originalname,
        size: req.file.size,
        type: validation.type,
      },
      restoreOptions: {
        targetDatabase,
        dropExisting,
      },
    });

    // Thực hiện restore trong background với options
    const progressCallback = async (progress, message) => {
      try {
        const updateData = {
          progress,
          status: progress === 100 ? "success" : "in_progress",
          ...(message && { latestMessage: message }),
        };

        if (progress === 100) {
          updateData.completedAt = new Date();
        }

        await BackupLog.findByIdAndUpdate(log._id, updateData);
        console.log(`Restore progress: ${progress}% - ${message}`);
      } catch (updateError) {
        console.error("Error updating progress:", updateError);
      }
    };

    const restoreOptions = {
      targetDatabase,
      sourceDatabase,
      dropExisting: dropExisting !== false, // Mặc định là true
    };

    const result = await restoreService.restoreFromFile(
      req.file.path,
      log._id,
      progressCallback,
      restoreOptions
    );

    // Final success update với thông tin kết quả
    await BackupLog.findByIdAndUpdate(log._id, {
      status: "success",
      progress: 100,
      completedAt: new Date(),
      result: {
        targetDatabase: result.targetDatabase,
        collectionsRestored: result.collectionsRestored,
        action: result.action,
      },
    });

    console.log(`Restore completed successfully for log: ${log._id}`);
  } catch (error) {
    console.error("Restore error in controller:", error);

    if (log) {
      await BackupLog.findByIdAndUpdate(log._id, {
        status: "failed",
        errorMessage: error.message,
        progress: 0,
        completedAt: new Date(),
      }).catch(console.error);
    }

    // Xóa file tạm nếu có lỗi
    if (req.file && req.file.path) {
      await fs.remove(req.file.path).catch(console.error);
    }
  }
};

// API để kiểm tra databases
exports.getDatabases = async (req, res) => {
  try {
    const databases = await restoreService.listDatabases();
    res.json({
      success: true,
      databases,
    });
  } catch (error) {
    console.error("Error listing databases:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách databases",
    });
  }
};

// Lấy lịch sử backup/restore
exports.getBackupLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, action } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (action) {
      filter.action = action;
    }

    const logs = await BackupLog.find(filter)
      .populate("performedBy", "username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BackupLog.countDocuments(filter);

    res.json({
      success: true,
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
