const express = require("express");
const router = express.Router();
const adminController = require("../../controllers/admin/groupAdminController");
const auth = require("../../middleware/auth");
const adminAuth = require("../../middleware/adminAuth");
const upload = require("../../middleware/upload");

// Quản lý nhóm

// Middleware kiểm tra đăng nhập trước, sau đó kiểm tra quyền admin
router.use(auth);
router.use(adminAuth);

router.get("/", adminController.getAllGroups);
router.get("/stats", adminController.getGroupStats);
router.post(
  "/",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverPhoto", maxCount: 1 },
  ]),
  adminController.createGroup
);
router.get("/:groupId", adminController.getGroupById);
router.put(
  "/:groupId",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverPhoto", maxCount: 1 },
  ]),
  adminController.updateGroup
);
router.delete("/:groupId", adminController.deleteGroup);

module.exports = router;
