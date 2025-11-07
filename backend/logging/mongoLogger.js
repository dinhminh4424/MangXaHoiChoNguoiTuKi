// logging/mongoLogger.js
const AccessLog = require("../models/AccessLog");
const { maskPIIInObject } = require("./mask");
const { v4: uuidv4 } = require("uuid");

const FULL_LOG = process.env.FULL_LOGGING === "true";
const MASK = process.env.MASK_SENSITIVE !== "false";
const BATCH_SIZE = parseInt(process.env.LOG_BATCH_SIZE || "50", 10);
const FLUSH_INTERVAL_MS = parseInt(
  process.env.LOG_FLUSH_INTERVAL_MS || "2000",
  10
);

let buffer = [];
let flushing = false;

async function flushBuffer() {
  if (flushing) return;
  if (buffer.length === 0) return;
  flushing = true;
  const toWrite = buffer;
  buffer = [];
  try {
    await AccessLog.insertMany(toWrite, { ordered: false });
  } catch (err) {
    // fallback: in production bạn nên log lỗi này ở file hoặc Sentry
    console.error("Failed to write access logs to Mongo:", err.message);
  } finally {
    flushing = false;
  }
}

// Periodic flush
setInterval(() => {
  if (buffer.length > 0) flushBuffer().catch(() => {});
}, FLUSH_INTERVAL_MS);

// flush on shutdown to reduce loss
async function gracefulShutdown() {
  if (buffer.length > 0) {
    console.log("Flushing log buffer before exit...");
    await flushBuffer();
  }
  process.exit(0);
}
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

module.exports = function mongoLogger(req, res, next) {
  const start = Date.now();
  const correlationId =
    req.headers["x-correlation-id"] || req.correlationId || uuidv4();
  req.correlationId = correlationId;
  res.setHeader("x-correlation-id", correlationId);

  const reqSnapshot = {
    method: req.method,
    path: req.originalUrl || req.url,
    query: req.query,
    params: req.params,
    userId: req.user?.id || null,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers["user-agent"],
  };

  if (FULL_LOG && req.body) {
    reqSnapshot.body = MASK ? maskPIIInObject(req.body) : req.body;
  }

  // capture response body by hijacking write/end
  const oldWrite = res.write;
  const oldEnd = res.end;
  const chunks = [];
  res.write = function (chunk, ...args) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    return oldWrite.apply(res, [chunk, ...args]);
  };
  res.end = function (chunk, ...args) {
    if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    const body = Buffer.concat(chunks).toString("utf8");

    const latencyMs = Date.now() - start;
    const entry = {
      timestamp: new Date(),
      level:
        res.statusCode >= 500
          ? "error"
          : res.statusCode >= 400
          ? "warn"
          : "info",
      service: process.env.SERVICE_NAME || "social-api",
      env: process.env.NODE_ENV || "development",
      correlationId,
      request: reqSnapshot,
      response: {
        status: res.statusCode,
        latencyMs,
      },
    };

    if (FULL_LOG) {
      try {
        const parsed = JSON.parse(body || "{}");
        entry.response.body = MASK ? maskPIIInObject(parsed) : parsed;
      } catch (e) {
        entry.response.body = MASK ? maskPIIInObject({ text: body }) : body;
      }
    }

    // push to in-memory buffer
    buffer.push(entry);
    if (buffer.length >= BATCH_SIZE) {
      flushBuffer().catch(() => {});
    }

    return oldEnd.apply(res, [chunk, ...args]);
  };

  next();
};
