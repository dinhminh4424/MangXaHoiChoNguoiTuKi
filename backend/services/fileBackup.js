// // services/fileBackup.js
// const fs = require("fs-extra");
// const path = require("path");
// const archiver = require("archiver");

// class FileBackupService {
//   constructor() {
//     this.backupDir = path.join(
//       process.env.BACKUP_PATH || "./backups",
//       "system"
//     );
//     this.uploadDir = process.env.UPLOAD_PATH || "./uploads";
//     this.configDir = process.env.CONFIG_PATH || "./config";
//   }

//   // Backup thư mục uploads và file cấu hình
//   async backupSystemFiles() {
//     let output;
//     try {
//       await fs.ensureDir(this.backupDir);

//       const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
//       const fileName = `system-backup-${timestamp}.zip`;
//       const filePath = path.join(this.backupDir, fileName);

//       // Tạo file ZIP
//       output = fs.createWriteStream(filePath);
//       const archive = archiver("zip", {
//         zlib: { level: 9 }, // Mức độ nén cao nhất
//       });

//       return new Promise(async (resolve, reject) => {
//         output.on("close", async () => {
//           console.log(
//             `System backup completed: ${archive.pointer()} total bytes`
//           );

//           const stats = await fs.stat(filePath);
//           resolve({
//             filePath,
//             fileName,
//             size: stats.size,
//             timestamp: new Date(),
//           });
//         });

//         archive.on("error", (err) => {
//           reject(err);
//         });

//         archive.pipe(output);

//         // Backup thư mục uploads nếu tồn tại
//         if (await fs.pathExists(this.uploadDir)) {
//           archive.directory(this.uploadDir, "uploads");
//         }

//         // Backup file cấu hình nếu tồn tại
//         if (await fs.pathExists(this.configDir)) {
//           archive.directory(this.configDir, "config");
//         } else {
//           // Backup các file cấu hình riêng lẻ
//           const configFiles = ["setting.json", "config.json", ".env"];
//           for (const configFile of configFiles) {
//             const configPath = path.join(process.cwd(), configFile);
//             if (await fs.pathExists(configPath)) {
//               archive.file(configPath, { name: `config/${configFile}` });
//             }
//           }
//         }

//         archive.finalize();
//       });
//     } catch (error) {
//       console.error("System files backup failed:", error);
//       throw new Error(`System files backup failed: ${error.message}`);
//     }
//   }

//   // Backup toàn bộ (full backup - database + files)
//   async backupFullSystem() {
//     try {
//       await fs.ensureDir(this.backupDir);

//       const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
//       const fileName = `full-backup-${timestamp}.zip`;
//       const filePath = path.join(this.backupDir, fileName);

//       // Tạo file ZIP
//       const output = fs.createWriteStream(filePath);
//       const archive = archiver("zip", {
//         zlib: { level: 9 },
//       });

//       return new Promise((resolve, reject) => {
//         output.on("close", async () => {
//           console.log(
//             `Full backup completed: ${archive.pointer()} total bytes`
//           );

//           const stats = await fs.stat(filePath);
//           resolve({
//             filePath,
//             fileName,
//             size: stats.size,
//             timestamp: new Date(),
//           });
//         });

//         archive.on("error", (err) => {
//           reject(err);
//         });

//         archive.pipe(output);

//         // Thêm database backup vào ZIP
//         const databaseBackup = require("./databaseBackup");
//         databaseBackup
//           .backupWithMongodump()
//           .then((dbBackup) => {
//             archive.file(dbBackup.filePath, {
//               name: "database/mongodb-backup.gz",
//             });

//             // Thêm system files
//             if (fs.pathExistsSync(this.uploadDir)) {
//               archive.directory(this.uploadDir, "system/uploads");
//             }

//             // Thêm metadata
//             const metadata = {
//               type: "full",
//               timestamp: new Date(),
//               version: "1.0",
//               database: "mongodb",
//             };

//             archive.append(JSON.stringify(metadata, null, 2), {
//               name: "backup-info.json",
//             });
//             archive.finalize();
//           })
//           .catch(reject);
//       });
//     } catch (error) {
//       console.error("Full system backup failed:", error);
//       throw new Error(`Full system backup failed: ${error.message}`);
//     }
//   }

//   // Lấy danh sách system backup
//   async getSystemBackupList() {
//     try {
//       if (!(await fs.pathExists(this.backupDir))) {
//         return [];
//       }

//       const files = await fs.readdir(this.backupDir);
//       const backupList = [];

//       for (const file of files) {
//         if (file.endsWith(".zip")) {
//           const filePath = path.join(this.backupDir, file);
//           const stats = await fs.stat(filePath);

//           backupList.push({
//             name: file,
//             path: filePath,
//             size: stats.size,
//             createdAt: stats.birthtime,
//             type: file.startsWith("full-") ? "full" : "system",
//           });
//         }
//       }

//       return backupList.sort(
//         (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
//       );
//     } catch (error) {
//       console.error("Error getting system backup list:", error);
//       throw error;
//     }
//   }
// }

// module.exports = new FileBackupService();

// services/fileBackup.js
const fs = require("fs-extra");
const path = require("path");
const archiver = require("archiver");

class FileBackupService {
  constructor() {
    this.backupDir = path.join(
      process.env.BACKUP_PATH || "./backups",
      "system"
    );
    this.uploadDir = process.env.UPLOAD_PATH || "./uploads";
    this.configDir = process.env.CONFIG_PATH || "./config";
    this.logDir = path.join(process.cwd(), "logs");
    this.tempDir = path.join(process.cwd(), "temp");
  }

  /**
   * Backup system files với progress tracking và tùy chọn
   */
  async backupSystemFiles(backupOptions = {}) {
    let output;
    let archive;

    const options = {
      includeUploads: true,
      includeConfig: true,
      includeLogs: false,
      includeTemp: false,
      compressionLevel: 9,
      onProgress: null,
      ...backupOptions,
    };

    try {
      await fs.ensureDir(this.backupDir);

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `system-backup-${timestamp}.zip`;
      const filePath = path.join(this.backupDir, fileName);

      console.log("Starting system files backup with options:", options);

      output = fs.createWriteStream(filePath);
      archive = archiver("zip", {
        zlib: { level: options.compressionLevel },
        statConcurrency: 4,
      });

      let totalFiles = 0;
      let processedFiles = 0;
      let currentStep = "";

      return new Promise(async (resolve, reject) => {
        output.on("close", async () => {
          console.log(
            `System backup completed: ${archive.pointer()} total bytes`
          );

          const stats = await fs.stat(filePath);

          if (options.onProgress) {
            options.onProgress(100, "Backup completed successfully");
          }

          resolve({
            filePath,
            fileName,
            size: stats.size,
            timestamp: new Date(),
            totalFiles,
            compressedSize: archive.pointer(),
            type: "system",
          });
        });

        archive.on("error", (err) => {
          console.error("Archive error:", err);
          if (options.onProgress) {
            options.onProgress(0, `Backup failed: ${err.message}`);
          }
          reject(err);
        });

        archive.on("progress", (progress) => {
          if (options.onProgress && totalFiles > 0) {
            const percent = Math.floor(
              (progress.fs.processedBytes / progress.fs.totalBytes) * 100
            );
            options.onProgress(
              Math.min(percent, 99),
              `${currentStep} (${processedFiles}/${totalFiles} files)`
            );
          }
        });

        archive.on("entry", (entry) => {
          processedFiles++;
          if (
            options.onProgress &&
            processedFiles % 10 === 0 &&
            totalFiles > 0
          ) {
            const percent = Math.floor((processedFiles / totalFiles) * 100);
            options.onProgress(
              Math.min(percent, 99),
              `${currentStep} (${processedFiles}/${totalFiles} files)`
            );
          }
        });

        archive.pipe(output);

        const backupItems = [];

        // 1. Backup uploads directory
        if (options.includeUploads && (await fs.pathExists(this.uploadDir))) {
          currentStep = "Backing up upload files";
          console.log(currentStep);

          const uploadFiles = await this._countFilesInDirectory(this.uploadDir);
          totalFiles += uploadFiles;

          archive.directory(this.uploadDir, "uploads");
          backupItems.push("uploads");
        }

        // 2. Backup config directory
        if (options.includeConfig) {
          currentStep = "Backing up configuration files";
          console.log(currentStep);

          if (await fs.pathExists(this.configDir)) {
            const configFiles = await this._countFilesInDirectory(
              this.configDir
            );
            totalFiles += configFiles;
            archive.directory(this.configDir, "config");
            backupItems.push("config");
          } else {
            const configFiles = [
              "setting.json",
              "config.json",
              ".env",
              "package.json",
              "package-lock.json",
              ".env.example",
              "README.md",
            ];
            for (const configFile of configFiles) {
              const configPath = path.join(process.cwd(), configFile);
              if (await fs.pathExists(configPath)) {
                totalFiles++;
                archive.file(configPath, { name: `config/${configFile}` });
                console.log(`Added config file: ${configFile}`);
              }
            }
            if (configFiles.length > 0) backupItems.push("config");
          }
        }

        // 3. Backup logs directory
        if (options.includeLogs && (await fs.pathExists(this.logDir))) {
          currentStep = "Backing up log files";
          console.log(currentStep);

          const logFiles = await this._countFilesInDirectory(this.logDir);
          totalFiles += logFiles;
          archive.directory(this.logDir, "logs");
          backupItems.push("logs");
        }

        // 4. Backup temp directory
        if (options.includeTemp && (await fs.pathExists(this.tempDir))) {
          currentStep = "Backing up temporary files";
          console.log(currentStep);

          const tempFiles = await this._countFilesInDirectory(this.tempDir);
          totalFiles += tempFiles;
          archive.directory(this.tempDir, "temp");
          backupItems.push("temp");
        }

        // 5. Add backup metadata
        currentStep = "Adding backup metadata";
        console.log(currentStep);

        const metadata = {
          backupType: "system",
          timestamp: new Date().toISOString(),
          version: "2.0",
          includedItems: backupItems,
          options: options,
          systemInfo: {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            cwd: process.cwd(),
            totalFiles: totalFiles,
          },
          backupInfo: {
            fileName: fileName,
            estimatedSize: archive.pointer(),
            compressionLevel: options.compressionLevel,
          },
        };

        archive.append(JSON.stringify(metadata, null, 2), {
          name: "backup-metadata.json",
        });
        totalFiles++;

        console.log(`Total files to backup: ${totalFiles}`);
        console.log(`Backup items: ${backupItems.join(", ")}`);

        if (options.onProgress) {
          options.onProgress(0, `Starting backup of ${totalFiles} files...`);
        }

        archive.finalize();
      });
    } catch (error) {
      console.error("System files backup failed:", error);

      if (archive) {
        archive.abort();
      }

      throw new Error(`System files backup failed: ${error.message}`);
    }
  }

  /**
   * Backup toàn bộ hệ thống (database + files)
   */
  async backupFullSystem(backupOptions = {}) {
    const options = {
      onProgress: null,
      compressionLevel: 9,
      ...backupOptions,
    };

    try {
      await fs.ensureDir(this.backupDir);

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `full-backup-${timestamp}.zip`;
      const filePath = path.join(this.backupDir, fileName);

      console.log("Starting full system backup...");

      const output = fs.createWriteStream(filePath);
      const archive = archiver("zip", {
        zlib: { level: options.compressionLevel },
      });

      return new Promise(async (resolve, reject) => {
        output.on("close", async () => {
          console.log(
            `Full backup completed: ${archive.pointer()} total bytes`
          );

          const stats = await fs.stat(filePath);

          if (options.onProgress) {
            options.onProgress(100, "Full backup completed successfully");
          }

          resolve({
            filePath,
            fileName,
            size: stats.size,
            timestamp: new Date(),
            compressedSize: archive.pointer(),
            type: "full",
          });
        });

        archive.on("error", (err) => {
          console.error("Full backup archive error:", err);
          if (options.onProgress) {
            options.onProgress(0, `Full backup failed: ${err.message}`);
          }
          reject(err);
        });

        let currentProgress = 0;

        archive.pipe(output);

        // Step 1: Backup database
        if (options.onProgress) {
          options.onProgress(10, "Starting database backup...");
        }

        try {
          const databaseBackup = require("./databaseBackup");
          const dbBackup = await databaseBackup.backupWithMongodump();

          archive.file(dbBackup.filePath, {
            name: "database/mongodb-backup.json",
          });

          if (options.onProgress) {
            options.onProgress(40, "Database backup completed");
          }

          // Step 2: Backup system files
          if (options.onProgress) {
            options.onProgress(45, "Starting system files backup...");
          }

          // Backup uploads
          if (await fs.pathExists(this.uploadDir)) {
            archive.directory(this.uploadDir, "system/uploads");
          }

          // Backup config
          if (await fs.pathExists(this.configDir)) {
            archive.directory(this.configDir, "system/config");
          } else {
            const configFiles = [
              "setting.json",
              "config.json",
              ".env",
              "package.json",
            ];
            for (const configFile of configFiles) {
              const configPath = path.join(process.cwd(), configFile);
              if (await fs.pathExists(configPath)) {
                archive.file(configPath, {
                  name: `system/config/${configFile}`,
                });
              }
            }
          }

          if (options.onProgress) {
            options.onProgress(80, "System files backup completed");
          }

          // Step 3: Add metadata
          const metadata = {
            type: "full",
            timestamp: new Date().toISOString(),
            version: "2.0",
            database: "mongodb",
            backupInfo: {
              databaseFile: dbBackup.fileName,
              databaseSize: dbBackup.size,
              collections: dbBackup.collections,
              documents: dbBackup.documents,
            },
            systemInfo: {
              nodeVersion: process.version,
              platform: process.platform,
            },
          };

          archive.append(JSON.stringify(metadata, null, 2), {
            name: "backup-info.json",
          });

          if (options.onProgress) {
            options.onProgress(90, "Finalizing backup...");
          }

          archive.finalize();
        } catch (dbError) {
          reject(new Error(`Database backup failed: ${dbError.message}`));
        }
      });
    } catch (error) {
      console.error("Full system backup failed:", error);
      throw new Error(`Full system backup failed: ${error.message}`);
    }
  }

  /**
   * Backup với progress tracking cho frontend
   */
  async backupSystemFilesWithProgress(backupOptions = {}) {
    const progressCallback = backupOptions.onProgress;

    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.backupSystemFiles({
          ...backupOptions,
          onProgress: (percent, message) => {
            if (progressCallback) {
              progressCallback(percent, message);
            }
            console.log(`Backup Progress: ${percent}% - ${message}`);
          },
        });

        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Full backup với progress tracking
   */
  async backupFullSystemWithProgress(backupOptions = {}) {
    const progressCallback = backupOptions.onProgress;

    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.backupFullSystem({
          ...backupOptions,
          onProgress: (percent, message) => {
            if (progressCallback) {
              progressCallback(percent, message);
            }
            console.log(`Full Backup Progress: ${percent}% - ${message}`);
          },
        });

        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Ước tính kích thước backup
   */
  async estimateBackupSize(options = {}) {
    const estimate = {
      totalSize: 0,
      fileCount: 0,
      items: [],
      readableSize: "0 Bytes",
    };

    try {
      // Estimate uploads size
      if (
        options.includeUploads !== false &&
        (await fs.pathExists(this.uploadDir))
      ) {
        const uploadStats = await this._getDirectoryStats(this.uploadDir);
        estimate.totalSize += uploadStats.size;
        estimate.fileCount += uploadStats.fileCount;
        estimate.items.push({
          name: "uploads",
          size: uploadStats.size,
          fileCount: uploadStats.fileCount,
          readableSize: this._formatBytes(uploadStats.size),
        });
      }

      // Estimate config size
      if (options.includeConfig !== false) {
        let configStats = { size: 0, fileCount: 0 };

        if (await fs.pathExists(this.configDir)) {
          configStats = await this._getDirectoryStats(this.configDir);
        } else {
          const configFiles = [
            "setting.json",
            "config.json",
            ".env",
            "package.json",
            "package-lock.json",
            ".env.example",
            "README.md",
          ];
          for (const configFile of configFiles) {
            const configPath = path.join(process.cwd(), configFile);
            if (await fs.pathExists(configPath)) {
              const stats = await fs.stat(configPath);
              configStats.size += stats.size;
              configStats.fileCount++;
            }
          }
        }

        estimate.totalSize += configStats.size;
        estimate.fileCount += configStats.fileCount;
        estimate.items.push({
          name: "config",
          size: configStats.size,
          fileCount: configStats.fileCount,
          readableSize: this._formatBytes(configStats.size),
        });
      }

      // Estimate logs size
      if (options.includeLogs && (await fs.pathExists(this.logDir))) {
        const logStats = await this._getDirectoryStats(this.logDir);
        estimate.totalSize += logStats.size;
        estimate.fileCount += logStats.fileCount;
        estimate.items.push({
          name: "logs",
          size: logStats.size,
          fileCount: logStats.fileCount,
          readableSize: this._formatBytes(logStats.size),
        });
      }

      // Estimate temp size
      if (options.includeTemp && (await fs.pathExists(this.tempDir))) {
        const tempStats = await this._getDirectoryStats(this.tempDir);
        estimate.totalSize += tempStats.size;
        estimate.fileCount += tempStats.fileCount;
        estimate.items.push({
          name: "temp",
          size: tempStats.size,
          fileCount: tempStats.fileCount,
          readableSize: this._formatBytes(tempStats.size),
        });
      }

      estimate.readableSize = this._formatBytes(estimate.totalSize);

      // Estimate compressed size (approx 60% compression for text/files)
      estimate.estimatedCompressedSize = Math.floor(estimate.totalSize * 0.6);
      estimate.estimatedCompressedSizeReadable = this._formatBytes(
        estimate.estimatedCompressedSize
      );

      return estimate;
    } catch (error) {
      console.error("Error estimating backup size:", error);
      return estimate;
    }
  }

  /**
   * Lấy danh sách system backup
   */
  async getSystemBackupList() {
    try {
      if (!(await fs.pathExists(this.backupDir))) {
        return [];
      }

      const files = await fs.readdir(this.backupDir);
      const backupList = [];

      for (const file of files) {
        if (file.endsWith(".zip")) {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);

          backupList.push({
            name: file,
            path: filePath,
            size: stats.size,
            readableSize: this._formatBytes(stats.size),
            createdAt: stats.birthtime,
            type: file.startsWith("full-") ? "full" : "system",
          });
        }
      }

      return backupList.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    } catch (error) {
      console.error("Error getting system backup list:", error);
      throw error;
    }
  }

  /**
   * Xóa file backup
   */
  async deleteBackup(fileName) {
    try {
      const filePath = path.join(this.backupDir, fileName);

      if (!(await fs.pathExists(filePath))) {
        throw new Error("Backup file not found");
      }

      await fs.remove(filePath);
      return true;
    } catch (error) {
      console.error("Error deleting backup:", error);
      throw error;
    }
  }

  /**
   * Lấy thông tin chi tiết về backup
   */
  async getBackupInfo(fileName) {
    try {
      const filePath = path.join(this.backupDir, fileName);

      if (!(await fs.pathExists(filePath))) {
        throw new Error("Backup file not found");
      }

      const stats = await fs.stat(filePath);
      const backupInfo = {
        name: fileName,
        path: filePath,
        size: stats.size,
        readableSize: this._formatBytes(stats.size),
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        type: fileName.startsWith("full-") ? "full" : "system",
      };

      return backupInfo;
    } catch (error) {
      console.error("Error getting backup info:", error);
      throw error;
    }
  }

  /**
   * Helper: Đếm số file trong thư mục
   */
  async _countFilesInDirectory(dirPath) {
    try {
      let fileCount = 0;

      async function countFiles(currentPath) {
        const items = await fs.readdir(currentPath);

        for (const item of items) {
          const itemPath = path.join(currentPath, item);
          const stat = await fs.stat(itemPath);

          if (stat.isDirectory()) {
            await countFiles(itemPath);
          } else {
            fileCount++;
          }
        }
      }

      await countFiles(dirPath);
      return fileCount;
    } catch (error) {
      console.error(`Error counting files in ${dirPath}:`, error);
      return 0;
    }
  }

  /**
   * Helper: Lấy thống kê thư mục
   */
  async _getDirectoryStats(dirPath) {
    try {
      let totalSize = 0;
      let fileCount = 0;

      async function processDirectory(currentPath) {
        const items = await fs.readdir(currentPath);

        for (const item of items) {
          const itemPath = path.join(currentPath, item);
          const stat = await fs.stat(itemPath);

          if (stat.isDirectory()) {
            await processDirectory(itemPath);
          } else {
            totalSize += stat.size;
            fileCount++;
          }
        }
      }

      await processDirectory(dirPath);
      return { size: totalSize, fileCount };
    } catch (error) {
      console.error(`Error getting stats for ${dirPath}:`, error);
      return { size: 0, fileCount: 0 };
    }
  }

  /**
   * Helper: Format bytes
   */
  _formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  /**
   * Cleanup old backups (giữ lại số lượng nhất định)
   */
  async cleanupOldBackups(keepCount = 10) {
    try {
      const backups = await this.getSystemBackupList();

      if (backups.length <= keepCount) {
        return { deleted: 0, message: "No backups to delete" };
      }

      const backupsToDelete = backups.slice(keepCount);
      let deletedCount = 0;

      for (const backup of backupsToDelete) {
        try {
          await this.deleteBackup(backup.name);
          deletedCount++;
          console.log(`Deleted old backup: ${backup.name}`);
        } catch (error) {
          console.error(`Error deleting backup ${backup.name}:`, error);
        }
      }

      return {
        deleted: deletedCount,
        total: backups.length,
        kept: keepCount,
        message: `Deleted ${deletedCount} old backups, kept ${keepCount} most recent`,
      };
    } catch (error) {
      console.error("Error cleaning up old backups:", error);
      throw error;
    }
  }

  /**
   * Kiểm tra dung lượng ổ đĩa
   */
  async checkDiskSpace() {
    try {
      const checkDiskSpace = require("check-disk-space").default;
      const diskSpace = await checkDiskSpace(this.backupDir);

      return {
        free: diskSpace.free,
        freeReadable: this._formatBytes(diskSpace.free),
        size: diskSpace.size,
        sizeReadable: this._formatBytes(diskSpace.size),
        availablePercentage: ((diskSpace.free / diskSpace.size) * 100).toFixed(
          1
        ),
      };
    } catch (error) {
      console.error("Error checking disk space:", error);
      return {
        free: 0,
        freeReadable: "0 Bytes",
        size: 0,
        sizeReadable: "0 Bytes",
        availablePercentage: "0",
      };
    }
  }
}

module.exports = new FileBackupService();
