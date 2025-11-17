// services/databaseBackup.js
const { exec } = require("child_process");
const util = require("util");
const fs = require("fs-extra");
const path = require("path");
const archiver = require("archiver");
const { MongoClient } = require("mongodb");
const execPromise = util.promisify(exec);

class DatabaseBackupService {
  constructor() {
    this.backupDir = path.join(
      process.env.BACKUP_PATH || "./backups",
      "database"
    );
    this.mongodbUri = process.env.MONGODB_URI;
  }

  // Backup sử dụng mongodump (nhanh, hiệu quả)
  async backupWithMongodump() {
    try {
      await fs.ensureDir(this.backupDir);

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `mongodb-backup-${timestamp}.gz`;
      const filePath = path.join(this.backupDir, fileName);

      console.log("Starting MongoDB backup with mongodump...");

      // Sử dụng mongodump để backup

      // c1: cần chỉnh lại cho phù hợp
      // const command = `mongodump --uri="${this.mongodbUri}" --archive="${filePath}" --gzip`;

      // c2:

      const mongodumpPath = `"C:\\mongodb-tools\\bin\\mongodump.exe"`;
      const command = `${mongodumpPath} --uri="${this.mongodbUri}" --archive="${filePath}" --gzip`;

      // end c2

      await execPromise(command);

      // Kiểm tra file backup có được tạo không
      const stats = await fs.stat(filePath);
      if (stats.size === 0) {
        throw new Error("Backup file is empty");
      }

      console.log(`Backup completed: ${filePath} (${stats.size} bytes)`);
      return {
        filePath,
        fileName,
        size: stats.size,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("MongoDB backup failed:", error);
      throw new Error(`MongoDB backup failed: ${error.message}`);
    }
  }

  // Backup sử dụng Node.js driver (thủ công, không cần mongodump)
  async backupWithNodeDriver() {
    let client;
    try {
      await fs.ensureDir(this.backupDir);

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `mongodb-backup-${timestamp}.json`;
      const filePath = path.join(this.backupDir, fileName);

      client = new MongoClient(this.mongodbUri);
      await client.connect();

      const database = client.db();
      const collections = await database.listCollections().toArray();

      const backupData = {
        metadata: {
          version: "1.0",
          database: database.databaseName,
          timestamp: new Date(),
          collections: collections.map((col) => col.name),
        },
        data: {},
      };

      // Backup từng collection
      for (const collectionInfo of collections) {
        const collectionName = collectionInfo.name;
        const collection = database.collection(collectionName);
        const documents = await collection.find({}).toArray();

        backupData.data[collectionName] = documents;
      }

      // Ghi dữ liệu ra file
      await fs.writeJson(filePath, backupData, { spaces: 2 });

      const stats = await fs.stat(filePath);
      console.log(
        `Node driver backup completed: ${filePath} (${stats.size} bytes)`
      );

      return {
        filePath,
        fileName,
        size: stats.size,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Node driver backup failed:", error);
      throw new Error(`Node driver backup failed: ${error.message}`);
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  // Lấy danh sách các file backup database
  async getBackupList() {
    try {
      if (!(await fs.pathExists(this.backupDir))) {
        return [];
      }

      const files = await fs.readdir(this.backupDir);
      const backupList = [];

      for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);

        backupList.push({
          name: file,
          path: filePath,
          size: stats.size,
          createdAt: stats.birthtime,
          type: "database",
        });
      }

      // Sắp xếp mới nhất trước
      return backupList.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    } catch (error) {
      console.error("Error getting backup list:", error);
      throw error;
    }
  }

  // Xóa file backup database
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
}

module.exports = new DatabaseBackupService();
