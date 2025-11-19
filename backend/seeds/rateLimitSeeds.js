// seeds/rateLimitSeeds.js
const RateLimitConfig = require("../models/RateLimitConfig");

const defaultConfigs = [
  {
    key: "postCreation", // tạo bài viết
    name: "Tạo bài viết",
    description: "Giới hạn số lần tạo bài viết",
    windowMs: 5 * 60 * 1000, // 5 phút
    max: 10,
    enabled: true,
    skipRoles: ["admin", "supporter"],
    customMessage:
      "Bạn đã đăng quá nhiều bài viết trong thời gian ngắn. Vui lòng thử lại sau một khoảng thời gian.",
  },
  {
    key: "search", // tiềm kiếm
    name: "Tìm kiếm",
    description: "Giới hạn số lần tìm kiếm",
    windowMs: 1 * 60 * 1000, // 1 phút
    max: 10,
    enabled: true,
    skipRoles: ["admin", "supporter"],
    customMessage: "Bạn tìm kiếm quá nhanh. Vui lòng thử lại sau 1 phút.",
  },
  {
    key: "report", // báo cáo 
    name: "Báo cáo",
    description: "Giới hạn số lần gửi báo cáo",
    windowMs: 10 * 60 * 1000, // 10 phút
    max: 5,
    enabled: true,
    skipRoles: ["admin", "supporter"],
    customMessage:
      "Bạn đã gửi quá nhiều báo cáo. Vui lòng thử lại sau 10 phút.",
  },
  {
    key: "login", // đăng nhập
    name: "Đăng nhập",
    description: "Giới hạn số lần đăng nhập",
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 5,
    enabled: true,
    skipRoles: [],
    customMessage:
      "Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau 15 phút.",
  },
  {
    key: "comment", // bình luận
    name: "Bình luận",
    description: "Giới hạn số lần bình luận",
    windowMs: 5 * 60 * 1000, // 5 phút
    max: 20,
    enabled: true,
    skipRoles: ["admin", "supporter"],
    customMessage: "Bạn đã bình luận quá nhiều. Vui lòng thử lại sau 5 phút.",
  },
];

const seedRateLimitConfigs = async () => {
  try {
    for (const config of defaultConfigs) {
      await RateLimitConfig.findOneAndUpdate({ key: config.key }, config, {
        upsert: true,
        new: true,
      });
    }
    console.log("Rate limit configs seeded successfully");
  } catch (error) {
    console.error("Error seeding rate limit configs:", error);
  }
};

module.exports = seedRateLimitConfigs;
