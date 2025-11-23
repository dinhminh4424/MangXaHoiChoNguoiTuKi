const express = require("express");
const router = express.Router();
const adminController = require("../../controllers/admin/userAdminController");
const auth = require("../../middleware/auth");
const adminAuth = require("../../middleware/adminAuth");

// Middleware kiểm tra đăng nhập trước, sau đó kiểm tra quyền admin
router.use(auth);
router.use(adminAuth);

// Quản lý người dùng
router.get("/", adminController.getAllUsers);
router.get("/:userId", adminController.getUserById);

router.delete("/:userId", adminController.deleteUser);
router.put("/:id/active", adminController.updateActiveUser);
router.put("/:userId/role", adminController.updateUserRole);
router.put("/:id", adminController.updateUser);
router.post("/", adminController.createUser);

module.exports = router;
