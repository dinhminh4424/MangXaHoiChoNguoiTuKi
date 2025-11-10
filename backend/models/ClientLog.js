// models/ClientLog.js
const mongoose = require("mongoose");

const ClientLogSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now, index: true },
    event: String,
    payload: Object,
    url: String,
    userAgent: String,
    userId: { type: String, index: true },
    correlationId: { type: String, index: true },
    ip: String,
    meta: Object,
  },
  { collection: "client_logs" },
  { timestamps: true }
);

module.exports = mongoose.model("ClientLog", ClientLogSchema);
