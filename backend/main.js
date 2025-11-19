// 1) Load environment variables (dotenv + dotenv-expand để hỗ trợ biến có reference)
const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");
const myEnv = dotenv.config();
dotenvExpand.expand(myEnv);

// 2) Thư viện cơ bản
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const path = require("path");
const passport = require("passport");
const jwt = require("jsonwebtoken");

// 3) Các module config / connect / socket (giữ tên file như project của bạn)
const config = require("./config");
const connectDB = require("./config/database");
const { configureSocket } = require("./config/socket");
const corsOptions = require("./config/cors");
require("./config/passport"); // passport strategies

// 4) Optional: import User model nếu bạn cần cập nhật trạng thái online (bạn đã dùng trong Google login)
const User = require("./models/User");

const seedRateLimitConfigs = require("./seeds/rateLimitSeeds");

const {
  initializeRateLimiters,
} = require("./middleware/dynamicRateLimitMiddleware");

seedRateLimitConfigs();

// 5) --- IMPORTS CHO LOGGING ---
// middleware ghi access logs (ghi batch vào Mongo)
const mongoLogger = require("./logging/mongoLogger");
// helper ghi audit (ghi trực tiếp)
const { createAudit } = require("./logging/audit");
const attachUserFromToken = require("./middleware/attachUserFromToken");

// 6) Routes độc lập bạn đã định nghĩa
const emergencyRoutes = require("./routes/emergency");
const guidelineRoutes = require("./routes/guideline");

// 7) Tạo app + server
const app = express();
const server = http.createServer(app);

const checkLostStreaks = require("./cron/streak-checker");

// --------------------------------------- [MIDDLEWARE CHUNG] ------------------------------------
// CORS, body parser, passport
app.use(cors(corsOptions));
app.use(express.json({ limit: "2mb" })); // tăng/giảm tùy payload của bạn
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// --------------------------------------- [LOGGING MIDDLEWARE] ------------------------------------
app.use(attachUserFromToken); // <-- thêm dòng này
app.use(mongoLogger);

// --------------------------------------- [STATIC FILES] ------------------------------------
// Serve uploads (nếu bạn có thư mục uploads)
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

// Mount guideline route (ví dụ static/dedicated route)
app.use("/api/emergency/guideline", guidelineRoutes);

// --------------------------------------- [MONGODB CONNECT] ------------------------------------
// Kết nối MongoDB (connectDB phải được export từ ./config/database)
connectDB();

// --------------------------------------- [SOCIAL LOGIN: GOOGLE / FACEBOOK] ------------------------------------
// Những route này phải đặt trước mount router chính nếu cần
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  // Google OAuth
  app.get(
    "/api/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
      session: false,
    })
  );

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: `${config.cors.origin}/login?error=true`,
      session: false,
    }),
    async (req, res) => {
      // Khi user đăng nhập bằng Google, cập nhật trạng thái online (nếu bạn muốn)
      try {
        if (req.user && req.user._id) {
          await User.findByIdAndUpdate(
            req.user._id,
            { $set: { isOnline: true, lastSeen: new Date() } },
            { new: true }
          );
        }
      } catch (e) {
        // Không block luồng nếu cập nhật trạng thái thất bại
        console.warn("[auth] could not update user online status:", e.message);
      }

      // Tạo JWT
      const token = jwt.sign(
        {
          userId: req.user._id,
          username: req.user.username,
          role: req.user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
      );

      // ✅ Lấy thông tin milestone từ req.user (được passport gắn vào)
      const milestone = req.user.milestone;
      let redirectUrl = `${config.cors.origin}/auth/callback?token=${token}`;

      // ✅ Nếu có milestone, thêm vào URL
      if (milestone) {
        redirectUrl += `&milestone=${encodeURIComponent(
          JSON.stringify(milestone)
        )}`;
      }
      // Redirect về frontend, gắn token trong query
      res.redirect(redirectUrl);
    }
  );
} else {
  console.warn(
    "[auth] GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET thiếu. Bỏ qua route Google."
  );
}

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  // Facebook OAuth
  app.get(
    "/api/auth/facebook",
    passport.authenticate("facebook", {
      scope: ["email", "public_profile"],
      session: false,
    })
  );

  app.get(
    "/api/auth/facebook/callback",
    passport.authenticate("facebook", {
      failureRedirect: `${config.cors.origin}/login?error=true`,
      session: false,
    }),
    (req, res) => {
      // Tạo JWT giống Google flow
      const token = jwt.sign(
        {
          userId: req.user._id,
          username: req.user.username,
          role: req.user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
      );

      // ✅ Lấy thông tin milestone từ req.user
      const milestone = req.user.milestone;
      let redirectUrl = `${config.cors.origin}/auth/callback?token=${token}`;

      // ✅ Nếu có milestone, thêm vào URL
      if (milestone) {
        redirectUrl += `&milestone=${encodeURIComponent(
          JSON.stringify(milestone)
        )}`;
      }
      res.redirect(redirectUrl);
    }
  );
} else {
  console.warn(
    "[auth] FACEBOOK_APP_ID/FACEBOOK_APP_SECRET thiếu. Bỏ qua route Facebook."
  );
}

// --------------------------------------- [MOUNT MAIN ROUTES] ------------------------------------
// Mount file routes/index.js tại /api (routes/index.js nên mount client-logs route ở đó)
const routes = require("./routes");
app.use("/api", routes); // => tất cả endpoint /api/*

// Nếu bạn có route emergency riêng (đặt sau), giữ như cũ
app.use("/api/emergency", emergencyRoutes);

// --------------------------------------- [HEALTH & ROOT] ------------------------------------
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Autism Support Network API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler (đặt sau tất cả route)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// --------------------------------------- [ERROR HANDLER] ------------------------------------
// Middleware xử lý lỗi toàn cục; đặt ở cuối
app.use((error, req, res, next) => {
  // 1) Log ra console (dev)
  console.error("Error:", error);

  // 2) Nếu là ValidationError (mongoose)
  if (error && error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Dữ liệu không hợp lệ",
      errors: error.errors,
    });
  }

  // 3) JWT error
  if (error && error.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Token không hợp lệ",
    });
  }

  // 4) Default 500
  res.status(500).json({
    success: false,
    message: "Lỗi server",
    error:
      config.nodeEnv === "development"
        ? error && error.message
        : "Internal server error",
  });
});

// --------------------------------------- [SOCKET.IO] ------------------------------------
configureSocket(server); // hàm do bạn tự định nghĩa trong ./config/socket

// --------------------------------------- [GRACEFUL SHUTDOWN] ------------------------------------
// Khi container/VM tắt hoặc bạn ctrl+c, mình sẽ đóng server và mongoose nối an toàn.
async function shutdown(signal) {
  try {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    // 1. Stop accepting new connections
    server.close((err) => {
      if (err) {
        console.error("Error closing server:", err);
      } else {
        console.log("HTTP server closed.");
      }
    });

    // 2. Close mongoose connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("MongoDB disconnected.");
    }

    // 3. Give a short delay trước khi process exit (để buffer logs flush nếu cần)
    setTimeout(() => {
      console.log("Exiting process.");
      process.exit(0);
    }, 500);
  } catch (err) {
    console.error("Error during shutdown:", err);
    process.exit(1);
  }
}

// remit

app.use(async (req, res, next) => {
  // Đảm bảo rate limiters được khởi tạo trước khi xử lý request
  if (!isRateLimitersInitialized) {
    await initializeRateLimiters();
    isRateLimitersInitialized = true;
  }
  next();
});

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// --------------------------------------- [START SERVER] ------------------------------------
const PORT = config.port || process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend: ${config.cors.origin}`);
  console.log(`🔗 Backend API: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
});

// Khởi chạy cron job
checkLostStreaks();
