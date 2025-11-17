// // services/restoreService.js
// const fs = require("fs-extra");
// const path = require("path");
// const unzipper = require("unzipper");
// const { exec } = require("child_process");
// const util = require("util");
// const { MongoClient } = require("mongodb");
// const execPromise = util.promisify(exec);
// const { spawn } = require("child_process");
// const fs = require("fs-extra");

// class RestoreService {
//   constructor() {
//     this.tempDir = path.join(process.env.BACKUP_PATH || "./backups", "temp");
//     this.mongodbUri = process.env.MONGODB_URI;
//   }

//   // Khôi phục từ file backup
//   async restoreFromFile(backupFilePath, logId, onProgress = null) {
//     try {
//       await fs.ensureDir(this.tempDir);

//       // Xóa thư mục temp cũ nếu tồn tại
//       await fs.emptyDir(this.tempDir);

//       const fileExt = path.extname(backupFilePath).toLowerCase();

//       if (fileExt === ".zip") {
//         await this._restoreFromZip(backupFilePath, logId, onProgress);
//       } else if (fileExt === ".gz") {
//         await this._restoreMongoDB(backupFilePath, logId, onProgress);
//       } else if (fileExt === ".json") {
//         await this._restoreFromJson(backupFilePath, logId, onProgress);
//       } else {
//         throw new Error("Unsupported backup file format");
//       }

//       // Dọn dẹp temp directory
//       await fs.remove(this.tempDir);

//       return { success: true, message: "Restore completed successfully" };
//     } catch (error) {
//       console.error("Restore failed:", error);

//       // Dọn dẹp temp directory ngay cả khi có lỗi
//       try {
//         await fs.remove(this.tempDir);
//       } catch (cleanupError) {
//         console.error("Cleanup error:", cleanupError);
//       }

//       throw error;
//     }
//   }

//   // Khôi phục từ file ZIP
//   async _restoreFromZip(zipFilePath, logId, onProgress) {
//     try {
//       console.log("Extracting ZIP file...");
//       if (onProgress) onProgress(10, "Extracting backup file...");

//       // Giải nén file ZIP
//       await fs
//         .createReadStream(zipFilePath)
//         .pipe(unzipper.Extract({ path: this.tempDir }))
//         .promise();

//       // Kiểm tra cấu trúc thư mục sau khi giải nén
//       const extractedFiles = await fs.readdir(this.tempDir);
//       console.log("Extracted files:", extractedFiles);

//       // Khôi phục database nếu có
//       const dbBackupPath = path.join(
//         this.tempDir,
//         "database/mongodb-backup.gz"
//       );
//       if (await fs.pathExists(dbBackupPath)) {
//         if (onProgress) onProgress(30, "Restoring database...");
//         await this._restoreMongoDB(dbBackupPath, logId);
//       }

//       // Khôi phục system files nếu có
//       const uploadsBackupPath = path.join(this.tempDir, "system/uploads");
//       if (await fs.pathExists(uploadsBackupPath)) {
//         if (onProgress) onProgress(70, "Restoring system files...");
//         await this._restoreSystemFiles(uploadsBackupPath);
//       }

//       if (onProgress) onProgress(100, "Restore completed!");
//     } catch (error) {
//       throw new Error(`ZIP restore failed: ${error.message}`);
//     }
//   }

//   // Khôi phục MongoDB từ file .gz (sử dụng mongorestore)
//   //   async _restoreMongoDB(backupFilePath, logId, onProgress = null) {
//   //     try {
//   //       console.log("Restoring MongoDB from backup...");

//   //       // Sử dụng mongorestore để khôi phục

//   //       // cần chỉnh lại nha $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
//   //       // c1
//   //       //   const command = `mongorestore --uri="${this.mongodbUri}" --archive="${backupFilePath}" --gzip --drop`; // đây

//   //       // c2
//   //       const mongorestorePath = `"C:\\mongodb-tools\\bin\\mongorestore.exe"`;
//   //       const command = `${mongorestorePath} --uri="${this.mongodbUri}" --archive="${backupFilePath}" --gzip --drop`;

//   //       // end c2

//   //       if (onProgress) onProgress(50, "Restoring database collections...");

//   //       await execPromise(command);

//   //       console.log("MongoDB restore completed");
//   //     } catch (error) {
//   //       throw new Error(`MongoDB restore failed: ${error.message}`);
//   //     }
//   //   }

//   async _restoreMongoDB(
//     backupFilePath,
//     logId,
//     onProgress = null,
//     targetDb = null
//   ) {
//     try {
//       if (onProgress) onProgress(40, "Preparing to restore database...");

//       // Lấy path từ env hoặc fallback 'mongorestore'
//       let mongorestorePath = process.env.MONGORESTORE_PATH || "mongorestore";
//       // nếu là đường dẫn tuyệt đối, remove quotes for exists check
//       const plainPath = mongorestorePath.replace(/^"+|"+$/g, "");
//       if (
//         mongorestorePath !== "mongorestore" &&
//         !(await fs.pathExists(plainPath))
//       ) {
//         // fallback
//         mongorestorePath = "mongorestore";
//       }

//       // Build args
//       const args = [`--archive=${backupFilePath}`, "--gzip", "--drop"];

//       // Nếu user muốn map DB (ví dụ autism_support -> autism_support_v2)
//       if (targetDb) {
//         // IMPORTANT: bạn cần cung cấp sourceDb (tên DB trong archive) hoặc client phải biết sourceDb.
//         // Nếu bạn biết sourceDb, truyền targetMapping e.g. { from: 'autism_support', to: 'autism_support_v2' }
//         // Trong controller ta sẽ truyền một string "sourceDb:targetDb", hoặc truyền object từ controller.
//         if (typeof targetDb === "object" && targetDb.from && targetDb.to) {
//           const nsFrom = `${targetDb.from}.*`;
//           const nsTo = `${targetDb.to}.*`;
//           args.push(`--nsFrom=${nsFrom}`, `--nsTo=${nsTo}`);
//         } else if (typeof targetDb === "string") {
//           // Nếu chỉ truyền tên target, không có source => không làm mapping tự động
//         }
//       }

//       // Optionally include --uri if you want mongorestore to authenticate (keep as env)
//       if (this.mongodbUri) {
//         args.unshift(`--uri=${this.mongodbUri}`);
//       }

//       if (onProgress) onProgress(45, "Starting mongorestore...");

//       const child = spawn(mongorestorePath, args, { windowsHide: true });

//       let stderr = "";
//       child.stdout.on("data", (d) => {
//         // parse or forward output
//         const text = d.toString();
//         console.log("mongorestore stdout:", text);
//       });
//       child.stderr.on("data", (d) => {
//         const text = d.toString();
//         stderr += text;
//         console.error("mongorestore stderr:", text);
//       });

//       await new Promise((resolve, reject) => {
//         child.on("error", (err) => reject(err));
//         child.on("close", (code) => {
//           if (code === 0) resolve();
//           else
//             reject(
//               new Error(
//                 `mongorestore exited with code ${code}. stderr: ${stderr}`
//               )
//             );
//         });
//       });

//       if (onProgress) onProgress(80, "Database restore finished");
//       console.log("MongoDB restore completed");
//     } catch (error) {
//       throw new Error(`MongoDB restore failed: ${error.message}`);
//     }
//   }

//   // Khôi phục từ file JSON (backup thủ công)
//   async _restoreFromJson(jsonFilePath, logId, onProgress = null) {
//     let client;
//     try {
//       console.log("Restoring from JSON backup...");

//       const backupData = await fs.readJson(jsonFilePath);
//       client = new MongoClient(this.mongodbUri);
//       await client.connect();

//       const database = client.db();
//       const totalCollections = Object.keys(backupData.data).length;
//       let processedCollections = 0;

//       // Khôi phục từng collection
//       for (const [collectionName, documents] of Object.entries(
//         backupData.data
//       )) {
//         const collection = database.collection(collectionName);

//         // Xóa collection cũ
//         await collection.deleteMany({});

//         // Chèn dữ liệu mới nếu có documents
//         if (documents && documents.length > 0) {
//           await collection.insertMany(documents);
//         }

//         processedCollections++;
//         if (onProgress) {
//           const progress =
//             50 + Math.floor((processedCollections / totalCollections) * 50);
//           onProgress(progress, `Restoring collection: ${collectionName}`);
//         }
//       }

//       console.log("JSON restore completed");
//     } catch (error) {
//       throw new Error(`JSON restore failed: ${error.message}`);
//     } finally {
//       if (client) {
//         await client.close();
//       }
//     }
//   }

//   // Khôi phục system files
//   async _restoreSystemFiles(uploadsBackupPath) {
//     try {
//       console.log("Restoring system files...");

//       const targetUploadsDir = process.env.UPLOAD_PATH || "./uploads";

//       // Đảm bảo thư mục đích tồn tại
//       await fs.ensureDir(targetUploadsDir);

//       // Xóa thư mục uploads cũ
//       await fs.emptyDir(targetUploadsDir);

//       // Copy files từ backup
//       await fs.copy(uploadsBackupPath, targetUploadsDir);

//       console.log("System files restore completed");
//     } catch (error) {
//       throw new Error(`System files restore failed: ${error.message}`);
//     }
//   }

//   // Validate file backup trước khi restore
//   async validateBackupFile(filePath) {
//     try {
//       const stats = await fs.stat(filePath);

//       if (stats.size === 0) {
//         return { valid: false, error: "Backup file is empty" };
//       }

//       const fileExt = path.extname(filePath).toLowerCase();
//       const validExtensions = [".zip", ".gz", ".json"];

//       if (!validExtensions.includes(fileExt)) {
//         return { valid: false, error: "Invalid backup file format" };
//       }

//       return { valid: true, type: fileExt === ".zip" ? "full" : "database" };
//     } catch (error) {
//       return { valid: false, error: error.message };
//     }
//   }
// }

// module.exports = new RestoreService();

const fs = require("fs-extra");
const path = require("path");
const unzipper = require("unzipper");
const { exec } = require("child_process");
const util = require("util");
const { MongoClient } = require("mongodb");
const execPromise = util.promisify(exec);
const { spawn } = require("child_process");

class RestoreService {
  constructor() {
    this.tempDir = path.join(process.env.BACKUP_PATH || "./backups", "temp");
    this.mongodbUri = process.env.MONGODB_URI;
    // this.mongodbUri = process.env.MONGODB_DEAULT;
  }

  // Khôi phục từ file backup với tuỳ chọn target database
  async restoreFromFile(
    backupFilePath,
    logId,
    onProgress = null,
    options = {}
  ) {
    try {
      await fs.ensureDir(this.tempDir);
      await fs.emptyDir(this.tempDir);

      const fileExt = path.extname(backupFilePath).toLowerCase();

      if (onProgress) onProgress(5, "Validating backup file...");

      let result;
      if (fileExt === ".zip") {
        result = await this._restoreFromZip(
          backupFilePath,
          logId,
          onProgress,
          options
        );
      } else if (fileExt === ".gz") {
        result = await this._restoreMongoDB(
          backupFilePath,
          logId,
          onProgress,
          options
        );
      } else if (fileExt === ".json") {
        result = await this._restoreFromJson(
          backupFilePath,
          logId,
          onProgress,
          options
        );
      } else {
        throw new Error("Unsupported backup file format");
      }

      await fs.remove(this.tempDir);
      return {
        success: true,
        message: "Restore completed successfully",
        ...result,
      };
    } catch (error) {
      console.error("Restore failed:", error);
      try {
        await fs.remove(this.tempDir);
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError);
      }
      throw error;
    }
  }

  // Khôi phục từ file ZIP với tuỳ chọn target database
  async _restoreFromZip(zipFilePath, logId, onProgress, options = {}) {
    try {
      console.log("Extracting ZIP file...");
      if (onProgress) onProgress(10, "Extracting backup file...");

      await new Promise((resolve, reject) => {
        fs.createReadStream(zipFilePath)
          .pipe(unzipper.Extract({ path: this.tempDir }))
          .on("close", resolve)
          .on("error", reject);
      });

      const extractedFiles = await fs.readdir(this.tempDir);
      console.log("Extracted files:", extractedFiles);

      let dbRestoreResult = null;

      // Khôi phục database nếu có
      const dbBackupPath = path.join(
        this.tempDir,
        "database/mongodb-backup.gz"
      );
      if (await fs.pathExists(dbBackupPath)) {
        if (onProgress) onProgress(30, "Restoring database...");
        dbRestoreResult = await this._restoreMongoDB(
          dbBackupPath,
          logId,
          (progress, message) => {
            const mappedProgress = 30 + (progress * 40) / 100;
            if (onProgress) onProgress(mappedProgress, message);
          },
          options
        );
      }

      // Khôi phục system files nếu có
      const uploadsBackupPath = path.join(this.tempDir, "system/uploads");
      if (await fs.pathExists(uploadsBackupPath)) {
        if (onProgress) onProgress(70, "Restoring system files...");
        await this._restoreSystemFiles(uploadsBackupPath);
      }

      if (onProgress) onProgress(100, "Restore completed!");

      return {
        databaseRestored: !!dbRestoreResult,
        targetDatabase: dbRestoreResult?.targetDatabase,
        collectionsRestored: dbRestoreResult?.collectionsRestored,
      };
    } catch (error) {
      throw new Error(`ZIP restore failed: ${error.message}`);
    }
  }

  // Khôi phục MongoDB từ file .gz với tuỳ chọn target database
  async _restoreMongoDB(
    backupFilePath,
    logId,
    onProgress = null,
    options = {}
  ) {
    let client;
    try {
      if (onProgress) onProgress(0, "Preparing to restore database...");

      const {
        targetDatabase = null, // Tên database mục tiêu (ví dụ: autism_support_v2)
        sourceDatabase = null, // Tên database trong backup (mặc định sẽ tự detect)
        dropExisting = true, // Có xoá database đích trước khi restore không
      } = options;

      client = new MongoClient(this.mongodbUri);
      await client.connect();

      // Nếu có target database, kiểm tra xem database có tồn tại không
      let targetDbExists = false;
      if (targetDatabase) {
        const adminDb = client.db().admin();
        const dbList = await adminDb.listDatabases();
        targetDbExists = dbList.databases.some(
          (db) => db.name === targetDatabase
        );

        console.log(
          `Target database '${targetDatabase}' exists: ${targetDbExists}`
        );
      }

      // Nếu target database không tồn tại và không drop, báo lỗi
      if (!targetDbExists && !dropExisting) {
        throw new Error(
          `Target database '${targetDatabase}' does not exist and dropExisting is false`
        );
      }

      let mongorestorePath = process.env.MONGORESTORE_PATH || "mongorestore";
      const plainPath = mongorestorePath.replace(/^"+|"+$/g, "");

      if (
        mongorestorePath !== "mongorestore" &&
        !(await fs.pathExists(plainPath))
      ) {
        console.warn(
          `Mongorestore path not found: ${plainPath}, using default`
        );
        mongorestorePath = "mongorestore";
      }

      // Build args
      const args = [`--archive="${backupFilePath}"`, "--gzip"];

      // Tuỳ chọn drop
      if (dropExisting) {
        args.push("--drop");
      } else {
        args.push("--noDrop");
      }

      // Xử lý database mapping
      if (targetDatabase) {
        if (sourceDatabase) {
          // Map từ source database sang target database
          const nsFrom = `${sourceDatabase}.*`;
          const nsTo = `${targetDatabase}.*`;
          args.push(`--nsFrom=${nsFrom}`, `--nsTo=${nsTo}`);
        } else {
          // Nếu không có source database, giả sử source và target cùng tên
          // Hoặc chỉ định target database mà không đổi tên
          args.push(`--db=${targetDatabase}`);
        }
      }

      // Add URI
      if (this.mongodbUri) {
        args.unshift(`--uri=${this.mongodbUri}`);
      }

      if (onProgress) onProgress(20, "Starting mongorestore...");

      console.log(`Executing: ${mongorestorePath} ${args.join(" ")}`);

      const child = spawn(mongorestorePath, args, {
        windowsHide: true,
        shell: true,
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        const text = data.toString();
        stdout += text;
        console.log("mongorestore stdout:", text);

        if (onProgress) {
          if (text.includes("restoring")) {
            onProgress(50, "Restoring collections...");
          } else if (text.includes("done")) {
            onProgress(80, "Finalizing restore...");
          }
        }
      });

      child.stderr.on("data", (data) => {
        const text = data.toString();
        stderr += text;
        console.error("mongorestore stderr:", text);
      });

      await new Promise((resolve, reject) => {
        child.on("error", (err) => {
          console.error("Spawn error:", err);
          reject(new Error(`Failed to start mongorestore: ${err.message}`));
        });

        child.on("close", (code) => {
          if (code === 0) {
            if (onProgress) onProgress(100, "Database restore completed");
            resolve();
          } else {
            reject(
              new Error(
                `mongorestore exited with code ${code}. stderr: ${stderr}`
              )
            );
          }
        });
      });

      // Lấy thông tin collections đã restore
      let collectionsRestored = [];
      const finalDatabase =
        targetDatabase || (await this._detectSourceDatabase(backupFilePath));

      if (finalDatabase) {
        const db = client.db(finalDatabase);
        collectionsRestored = await db.listCollections().toArray();
        collectionsRestored = collectionsRestored.map((col) => col.name);
      }

      console.log("MongoDB restore completed successfully");

      return {
        targetDatabase: finalDatabase,
        collectionsRestored,
        action: dropExisting ? "overwritten" : "appended",
      };
    } catch (error) {
      throw new Error(`MongoDB restore failed: ${error.message}`);
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  // Phát hiện source database từ backup file (đơn giản)
  async _detectSourceDatabase(backupFilePath) {
    try {
      // Đọc metadata từ backup archive để detect database name
      // Đây là phương pháp đơn giản, có thể cần cải thiện
      const client = new MongoClient(this.mongodbUri);
      await client.connect();

      // Sử dụng mongodump --archive có chứa database name
      // Tạm thời return null, có thể enhance sau
      await client.close();
      return null;
    } catch (error) {
      console.warn("Could not detect source database:", error.message);
      return null;
    }
  }

  // Khôi phục từ file JSON với tuỳ chọn target database
  async _restoreFromJson(jsonFilePath, logId, onProgress = null, options = {}) {
    let client;
    try {
      console.log("Restoring from JSON backup...");
      if (onProgress) onProgress(10, "Reading JSON backup file...");

      const { targetDatabase = null, dropExisting = true } = options;

      const backupData = await fs.readJson(jsonFilePath);
      client = new MongoClient(this.mongodbUri);
      await client.connect();

      // Sử dụng target database hoặc database mặc định
      const database = targetDatabase ? client.db(targetDatabase) : client.db();

      // Kiểm tra và xoá database cũ nếu cần
      if (dropExisting && targetDatabase) {
        if (onProgress) onProgress(20, "Cleaning target database...");
        const adminDb = client.db().admin();
        const dbList = await adminDb.listDatabases();
        const dbExists = dbList.databases.some(
          (db) => db.name === targetDatabase
        );

        if (dbExists) {
          await database.dropDatabase();
          console.log(`Dropped existing database: ${targetDatabase}`);
        }
      }

      const totalCollections = Object.keys(backupData.data).length;
      let processedCollections = 0;
      const collectionsRestored = [];

      for (const [collectionName, documents] of Object.entries(
        backupData.data
      )) {
        if (onProgress) {
          const progress =
            30 + Math.floor((processedCollections / totalCollections) * 70);
          onProgress(progress, `Restoring collection: ${collectionName}`);
        }

        const collection = database.collection(collectionName);

        // Xoá collection cũ nếu dropExisting
        if (dropExisting) {
          await collection.deleteMany({});
        }

        if (documents && documents.length > 0) {
          await collection.insertMany(documents);
          collectionsRestored.push(collectionName);
        }

        processedCollections++;
      }

      if (onProgress) onProgress(100, "JSON restore completed");
      console.log("JSON restore completed");

      return {
        targetDatabase: targetDatabase || "default",
        collectionsRestored,
        action: dropExisting ? "overwritten" : "appended",
      };
    } catch (error) {
      throw new Error(`JSON restore failed: ${error.message}`);
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  // Khôi phục system files (giữ nguyên)
  async _restoreSystemFiles(uploadsBackupPath) {
    try {
      console.log("Restoring system files...");
      const targetUploadsDir = process.env.UPLOAD_PATH || "./uploads";
      await fs.ensureDir(targetUploadsDir);
      await fs.emptyDir(targetUploadsDir);
      await fs.copy(uploadsBackupPath, targetUploadsDir);
      console.log("System files restore completed");
    } catch (error) {
      throw new Error(`System files restore failed: ${error.message}`);
    }
  }

  // Validate file backup
  async validateBackupFile(filePath) {
    try {
      const stats = await fs.stat(filePath);
      if (stats.size === 0) {
        return { valid: false, error: "Backup file is empty" };
      }

      const fileExt = path.extname(filePath).toLowerCase();
      const validExtensions = [".zip", ".gz", ".json"];
      if (!validExtensions.includes(fileExt)) {
        return { valid: false, error: "Invalid backup file format" };
      }

      return { valid: true, type: fileExt === ".zip" ? "full" : "database" };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // Kiểm tra database tồn tại
  async checkDatabaseExists(dbName) {
    let client;
    try {
      client = new MongoClient(this.mongodbUri);
      await client.connect();
      const adminDb = client.db().admin();
      const dbList = await adminDb.listDatabases();
      return dbList.databases.some((db) => db.name === dbName);
    } finally {
      if (client) await client.close();
    }
  }

  // Lấy danh sách databases
  async listDatabases() {
    let client;
    try {
      client = new MongoClient(this.mongodbUri);
      await client.connect();
      const adminDb = client.db().admin();
      const dbList = await adminDb.listDatabases();
      return dbList.databases.map((db) => db.name);
    } finally {
      if (client) await client.close();
    }
  }
}

module.exports = new RestoreService();
