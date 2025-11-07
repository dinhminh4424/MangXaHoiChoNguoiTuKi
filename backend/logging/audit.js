// logging/audit.js
const AuditLog = require("../models/AuditLog");

async function createAudit({
  actorId,
  actorRole,
  action,
  target = {},
  req = {},
  res = {},
  meta = {},
}) {
  const doc = {
    timestamp: new Date(),
    actorId,
    actorRole,
    action,
    target,
    requestSnapshot: {
      method: req.method,
      path: req.originalUrl,
      params: req.params,
      query: req.query,
      headers: { "user-agent": req.headers?.["user-agent"] },
    },
    responseSnapshot: { status: res?.statusCode || null },
    correlationId: req.correlationId || null,
    ip: req.ip || null,
    meta,
  };
  try {
    await AuditLog.create(doc);
  } catch (err) {
    console.error("Failed to write audit log:", err.message);
    // nếu thất bại, bạn có thể retry hoặc gửi cảnh báo
  }
}

module.exports = { createAudit };
