const corsOptions = {
  origin: function (origin, callback) {
    // Cho phép các domain truy cập
    const allowedOrigins = [
      process.env.FRONTEND_URL || "http://localhost:3000",
    ];

    // Cho phép requests không có origin (như mobile apps, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
};

module.exports = corsOptions;
