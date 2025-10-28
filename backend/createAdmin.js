const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
require("dotenv").config();

/**
 * Script tạo user admin mặc định
 * Chạy: node createAdmin.js
 */

const createAdminUser = async () => {
  try {
    // Kết nối database
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/autism_support"
    );
    console.log("✅ Đã kết nối database");

    // Kiểm tra xem đã có admin chưa
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("⚠️  Đã có admin user:", existingAdmin.username);
      return;
    }

    // Tạo admin user
    const adminData = {
      username: "admin",
      email: "admin@mindspace.com",
      password: "admin123", // Sẽ được hash tự động
      fullName: "Administrator",
      role: "admin",
      profile: {
        bio: "Quản trị viên hệ thống MindSpace",
        interests: ["Quản trị", "Công nghệ", "Tâm lý học"],
        location: "Việt Nam",
        skills: ["Quản lý hệ thống", "Phân tích dữ liệu", "Hỗ trợ người dùng"],
      },
    };

    const admin = new User(adminData);
    await admin.save();

    console.log("✅ Đã tạo admin user thành công!");
    console.log("📧 Email:", admin.email);
    console.log("👤 Username:", admin.username);
    console.log("🔑 Password: admin123");
    console.log("🔐 Role:", admin.role);
  } catch (error) {
    console.error("❌ Lỗi khi tạo admin user:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Đã ngắt kết nối database");
  }
};

// Chạy script
createAdminUser();
