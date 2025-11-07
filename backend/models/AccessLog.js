// models/AccessLog.js
const mongoose = require("mongoose");

const AccessLogSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now, index: true },
    level: { type: String, index: true }, // info|warn|error
    service: String,
    env: String,
    correlationId: { type: String, index: true },

    // request snapshot
    request: {
      method: String,
      path: { type: String, index: true },
      query: Object,
      params: Object,
      headers: Object,
      body: Object,
      userId: { type: String, index: true },
      ip: String,
      userAgent: String,
    },

    // response snapshot
    response: {
      status: Number,
      latencyMs: Number,
      body: Object,
    },

    error: Object,
    meta: Object,
  },
  { collection: "access_logs" }
);

module.exports = mongoose.model("AccessLog", AccessLogSchema);
