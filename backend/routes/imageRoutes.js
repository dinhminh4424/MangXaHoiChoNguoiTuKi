const express = require("express");
const router = express.Router();
const imageController = require("../controllers/imageController");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const upload = require("../middleware/upload");

// Public routes
router.get("/public/category/:category", imageController.getImagesByCategory);
router.get(
  "/public/category/:category/active",
  imageController.getImagesByCategoryActive
);

// Protected routes (require authentication)
router.use(auth);

// Admin routes
router.use(adminAuth);

// Quản lý hình ảnh
router.get("/", imageController.getAllImages);
router.get("/stats", imageController.getImageStats);
router.get("/:id", imageController.getImageById);
router.post("/", upload.single("image"), imageController.createImage);
router.put("/:id", upload.single("image"), imageController.updateImage);
router.delete("/:id", imageController.deleteImage);

module.exports = router;
