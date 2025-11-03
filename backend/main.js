const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");

const myEnv = dotenv.config();
dotenvExpand.expand(myEnv);

// Khai Báo các thư viện cần thiết
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const path = require("path");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
// Config
const config = require("./config");
const connectDB = require("./config/database");
const { configureSocket } = require("./config/socket"); // ← SỬA Ở ĐÂY
const corsOptions = require("./config/cors");
require("./config/passport");
const emergencyRoutes = require("./routes/emergency");
const guidelineRoutes = require("./routes/guideline");


const app = express();
const server = http.createServer(app);

// --------------------------------------- [Middleware]--------------------------------------------
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());

// Static files (cho file uploads) - BAO GỒM CẢ THƯ MỤC CON
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/emergency/guideline", guidelineRoutes);

// --------------------------------------- [end Middleware]--------------------------------------------

// --------------------------------------- [MongoDB]--------------------------------------------
// Kết nối MongoDB
connectDB();

// --------------------------------------- [end MongoDB]--------------------------------------------

// --------------------------------------- [Routes]--------------------------------------------

// --- NEW: Social Login Routes (Đặt TRƯỚC các route API chính) ---
// Google
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
    // Dùng URL từ config của bạn
    failureRedirect: `${config.cors.origin}/login?error=true`,
    session: false,
  }),
  async (req, res) => {
    // Cập nhật trạng thái online khi đăng nhập bằng Google
    try {
      await User.findByIdAndUpdate(
        req.user._id,
        { $set: { isOnline: true, lastSeen: new Date() } },
        { new: true }
      );
    } catch (e) {
      // Không chặn luồng nếu cập nhật trạng thái thất bại
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

    // Redirect về frontend, gửi kèm token
    res.redirect(`${config.cors.origin}/auth/callback?token=${token}`);
  }
);
//facebook
app.get(
  "/api/auth/facebook",
  passport.authenticate("facebook", {
    scope: ["email", "public_profile"], // Scope của Facebook
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
    // Logic này Y HỆT như Google
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
    // Redirect về frontend, gửi kèm token
    res.redirect(`${config.cors.origin}/auth/callback?token=${token}`);
  }
);

const routes = require("./routes");
app.use("/api", routes);
app.use("/api/emergency", emergencyRoutes);


// Route mặc định
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Autism Support Network API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Error:", error);

  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Dữ liệu không hợp lệ",
      errors: error.errors,
    });
  }

  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Token không hợp lệ",
    });
  }

  res.status(500).json({
    success: false,
    message: "Lỗi server",
    error:
      config.nodeEnv === "development"
        ? error.message
        : "Internal server error",
  });
});

// --------------------------------------- [ Socket.io]---------------------------------------
configureSocket(server);

// --------------------------------------- [ End Socket.io]---------------------------------------

// Khởi động server
const PORT = config.port;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend: ${config.cors.origin}`);
  console.log(`🔗 Backend API: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
});
