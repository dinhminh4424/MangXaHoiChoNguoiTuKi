// Khai Báo các thư viện cần thiết
const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");

// Config
const config = require("./config");
const connectDB = require("./config/database");
const configureSocket = require("./config/socket");
const corsOptions = require("./config/cors");

const app = express();
const server = http.createServer(app);

// --------------------------------------- [Middleware]--------------------------------------------
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (cho file uploads) - BAO GỒM CẢ THƯ MỤC CON
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

// --------------------------------------- [end Middleware]--------------------------------------------

// --------------------------------------- [MongoDB]--------------------------------------------
// Kết nối MongoDB
connectDB();

// --------------------------------------- [end MongoDB]--------------------------------------------

// --------------------------------------- [Routes]--------------------------------------------
const routes = require("./routes");
app.use("/api", routes);

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
