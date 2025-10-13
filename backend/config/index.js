require("dotenv").config();

const config = {
  // Server
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",

  // Database
  database: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/autism_support",
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  // JWT
  jwt: {
    secret:
      process.env.JWT_SECRET ||
      "autism_support_secret_key_2023_change_this_in_production",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  // CORS
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },

  // Upload
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimes: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ],
  },

  // Socket.io
  socket: {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  },
};

module.exports = config;
