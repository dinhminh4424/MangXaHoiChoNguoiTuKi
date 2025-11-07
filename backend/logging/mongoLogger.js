// logging/mongoLogger.js
const AccessLog = require("../models/AccessLog");
const { maskPIIInObject } = require("./mask");
const { randomUUID } = require("crypto");

// Environment variables
const FULL_LOG = process.env.FULL_LOGGING === "true";
const MASK = process.env.MASK_SENSITIVE !== "false";
const BATCH_SIZE = parseInt(process.env.LOG_BATCH_SIZE || "50", 10);
const FLUSH_INTERVAL_MS = parseInt(
  process.env.LOG_FLUSH_INTERVAL_MS || "2000",
  10
);
const LOG_LEVEL = process.env.LOG_LEVEL || "warn";
const LOG_SOCKET_EVENTS = process.env.LOG_SOCKET_EVENTS || "none";
const LOG_SOCKET_CONNECT = process.env.LOG_SOCKET_CONNECT === "true";
const LOG_SOCKET_MESSAGES = process.env.LOG_SOCKET_MESSAGES === "true";

const LOG_API_REQUESTS = process.env.LOG_API_REQUESTS === "true";
// Configuration - CHỈ GIỮ SOCKET:MESSAGE, BỎ CÁC SOCKET KHÁC
const EXCLUDED_PATHS = [
  "/health",
  "/metrics",
  "/favicon.ico",
  "socket:connect", // BỎ connect
  "socket:disconnect", // BỎ disconnect
  "socket:join_chats", // BỎ join_chats
  "socket:join",
  "socket:typing",
  "/api/quote/random",
  "/api/notifications",
  "/api/upload",
  "/api/users/me",
  "/api/friends/requests?type=received",
  "/api/journals/today",
];

const EXCLUDED_USER_AGENTS = ["health-check", "kube-probe", "Googlebot"];

// Global variables
let buffer = [];
let flushing = false;
const requestCounts = new Map();
const MAX_REQUESTS_PER_MINUTE = 60;

/**
 * Check if socket event should be logged - CHỈ CHO PHÉP SOCKET:MESSAGE
 */
function shouldLogSocketEvent(path, statusCode) {
  // CHỈ log socket:message, bỏ tất cả socket events khác
  if (path !== "socket:message") {
    return false;
  }

  // Chỉ log socket:message nếu được enabled
  return LOG_SOCKET_MESSAGES === true;
}

/**
 * Check if request should be logged based on various conditions
 */
function shouldLogRequest(req, res) {
  const path = req.originalUrl || req.url || req.path || "";

  // Handle socket events first
  if (path.startsWith("socket:")) {
    const result = shouldLogSocketEvent(path, res.statusCode);

    return result;
  }

  // Skip excluded paths
  if (EXCLUDED_PATHS.some((excludedPath) => path.includes(excludedPath))) {
    return false;
  }

  const statusCode = res.statusCode || 200;

  // 🔥 QUAN TRỌNG: NẾU LÀ API VÀ ĐƯỢC BẬT -> LUÔN LOG
  if (LOG_API_REQUESTS && path.startsWith("/api/")) {
    return true;
  }

  // Với các route KHÔNG PHẢI API, áp dụng LOG_LEVEL
  if (LOG_LEVEL === "error" && statusCode < 500) {
    return false;
  }

  if (LOG_LEVEL === "warn" && statusCode < 400) {
    return false;
  }

  return true;
}

/**
 * Rate limiting for logging
 */
function isUnderRateLimit(req) {
  const clientIp = req.ip || req.connection?.remoteAddress || "unknown";
  const now = Date.now();
  const windowStart = now - 60000;

  if (!requestCounts.has(clientIp)) {
    requestCounts.set(clientIp, []);
  }

  const requests = requestCounts.get(clientIp);

  // Remove old requests outside the time window
  while (requests.length > 0 && requests[0] < windowStart) {
    requests.shift();
  }

  if (requests.length >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }

  requests.push(now);
  return true;
}

/**
 * Clean up rate limiting data periodically
 */
function cleanupRateLimitData() {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  for (const [ip, requests] of requestCounts.entries()) {
    const filtered = requests.filter((time) => time > oneMinuteAgo);
    if (filtered.length === 0) {
      requestCounts.delete(ip);
    } else {
      requestCounts.set(ip, filtered);
    }
  }
}

/**
 * Flush buffer to database
 */
async function flushBuffer() {
  if (flushing || buffer.length === 0) return;

  flushing = true;
  const toWrite = [...buffer];
  buffer = [];

  try {
    await AccessLog.insertMany(toWrite, {
      ordered: false,
      lean: true,
    });

    if (process.env.NODE_ENV === "development" && toWrite.length > 0) {
    }
  } catch (err) {
    console.error("❌ Failed to write access logs to Mongo:", err.message);

    // Fallback: Try to save critical errors individually
    if (err.writeErrors) {
      const criticalLogs = toWrite.filter(
        (log) => log.level === "error" || log.response?.status >= 500
      );

      if (criticalLogs.length > 0) {
        console.log(`🔄 Retrying ${criticalLogs.length} critical logs...`);
        for (const log of criticalLogs) {
          try {
            await AccessLog.create(log);
          } catch (singleErr) {
            console.error("❌ Failed to save critical log:", singleErr.message);
          }
        }
      }
    }
  } finally {
    flushing = false;
  }
}

/**
 * Create log entry from request/response
 */
function createLogEntry(req, res, startTime, body) {
  const latencyMs = Date.now() - startTime;
  const correlationId = req.correlationId;

  const statusCode = res.statusCode || 200;
  let level = "info";
  if (statusCode >= 500) {
    level = "error";
  } else if (statusCode >= 400) {
    level = "warn";
  }

  const reqSnapshot = {
    method: req.method,
    path: req.originalUrl || req.url || req.path || "",
    query: req.query,
    params: req.params,
    userId: req.user?.id || req.user?.userId || null,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers["user-agent"],
  };

  if (FULL_LOG && req.body && Object.keys(req.body).length > 0) {
    reqSnapshot.body = MASK ? maskPIIInObject(req.body) : req.body;
  }

  const entry = {
    timestamp: new Date(),
    level,
    service: process.env.SERVICE_NAME || "social-api",
    env: process.env.NODE_ENV || "development",
    correlationId,
    request: reqSnapshot,
    response: {
      status: statusCode,
      latencyMs,
    },
  };

  if (FULL_LOG && body) {
    try {
      const parsed = JSON.parse(body);
      entry.response.body = MASK ? maskPIIInObject(parsed) : parsed;
    } catch (e) {
      entry.response.body = MASK ? maskPIIInObject({ text: body }) : body;
    }
  }

  return entry;
}

/**
 * Main middleware function
 */
module.exports = function mongoLogger(req, res, next) {
  const start = Date.now();

  const correlationId =
    req.headers["x-correlation-id"] || req.correlationId || randomUUID();
  req.correlationId = correlationId;

  if (res.setHeader) {
    res.setHeader("x-correlation-id", correlationId);
  }

  const path = req.originalUrl || req.url || req.path || "";

  // For socket requests, log immediately without response capturing
  if (path.startsWith("socket:")) {
    // CHỈ LOG SOCKET:MESSAGE, BỎ CÁC SOCKET KHÁC
    if (path === "socket:message" && LOG_SOCKET_MESSAGES) {
      const entry = createLogEntry(req, res, start, null);
      buffer.push(entry);

      if (buffer.length >= BATCH_SIZE) {
        flushBuffer().catch(() => {});
      }
    }
    return next();
  }

  // For HTTP requests, capture response body
  const oldWrite = res.write;
  const oldEnd = res.end;
  const chunks = [];

  res.write = function (chunk, ...args) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    return oldWrite.apply(res, [chunk, ...args]);
  };

  res.end = function (chunk, ...args) {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    const body = Buffer.concat(chunks).toString("utf8");

    if (shouldLogRequest(req, res)) {
      const entry = createLogEntry(req, res, start, body);
      buffer.push(entry);

      if (buffer.length >= BATCH_SIZE) {
        flushBuffer().catch(() => {});
      }
    }

    return oldEnd.apply(res, [chunk, ...args]);
  };

  next();
};

// Store interval references
const flushInterval = setInterval(() => {
  if (buffer.length > 0) {
    flushBuffer().catch(() => {});
  }
}, FLUSH_INTERVAL_MS);

const cleanupInterval = setInterval(cleanupRateLimitData, 5 * 60 * 1000);

// Graceful shutdown
async function gracefulShutdown() {
  console.log("🔄 Shutting down logger...");
  clearInterval(flushInterval);
  clearInterval(cleanupInterval);

  if (buffer.length > 0) {
    console.log(`📝 Flushing ${buffer.length} remaining logs before exit...`);
    await flushBuffer();
  }

  console.log("✅ Logger shutdown complete");
}

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
process.on("beforeExit", gracefulShutdown);

// Export for testing
module.exports._testing = {
  flushBuffer,
  cleanupRateLimitData,
  shouldLogRequest,
  isUnderRateLimit,
  getBuffer: () => buffer,
  getRequestCounts: () => requestCounts,
};
