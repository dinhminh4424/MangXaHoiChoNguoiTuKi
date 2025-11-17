// routes/backupRestore.js
const express = require("express");
const router = express.Router();
const backupRestoreController = require("../controllers/backupRestoreController");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");

// Tất cả routes đều yêu cầu xác thực
router.use(auth);

// Backup Routes
router.post("/backup/database", backupRestoreController.backupDatabase);

router.post("/backup/files", backupRestoreController.backupSystemFiles);

router.post("/backup/full", backupRestoreController.backupFull);

// Get backup list
router.get("/backups", backupRestoreController.getBackupList);

// Download backup
router.get(
  "/backups/download/:filename",
  backupRestoreController.downloadBackup
);

// Delete backup
router.delete("/backups/:filename", backupRestoreController.deleteBackup);

// Restore - CHỈ Super Admin
router.post(
  "/restore",
  upload.single("backupFile"),
  backupRestoreController.restoreSystem
);

// Restore với tuỳ chọn target database
// router.post(
//   "/restore",
//   upload.single("backupFile"),
//   backupController.restoreSystem
// );

// Lấy danh sách databases
router.get("/databases", backupRestoreController.getDatabases);

// Get restore progress
router.get(
  "/restore/progress/:logId",
  backupRestoreController.getRestoreProgress
);

// Get backup logs
router.get("/backup-logs", backupRestoreController.getBackupLogs);

module.exports = router;
