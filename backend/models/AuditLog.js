// models/AuditLog.js
const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now, index: true },
    actorId: { type: String, index: true }, // ai đã thực hiện hành động
    actorRole: String,
    action: { type: String, index: true }, // create_post, ban_user, view_sensitive ...
    target: Object, // { type: 'post', id: 'post_123' }
    requestSnapshot: Object,
    responseSnapshot: Object,
    correlationId: { type: String, index: true },
    ip: String,
    meta: Object,
  },
  { collection: "audit_logs" }
);

module.exports = mongoose.model("AuditLog", AuditLogSchema);
