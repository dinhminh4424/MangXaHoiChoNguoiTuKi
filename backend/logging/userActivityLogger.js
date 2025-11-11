// backend/logging/userActivityLogger.js
const ClientLog = require("../models/ClientLog");
const { createAudit } = require("./audit");

const SENSITIVE_KEYS = new Set([
  "password",
  "newpassword",
  "oldpassword",
  "confirmpassword",
  "otp",
  "token",
  "authorization",
  "auth",
  "cookie",
]);

/**
 * An toàn: sanitize payload, handle circular refs and limit recursion depth.
 * Returns primitives as-is, converts Dates/ObjectId to strings, and masks sensitive keys.
 */
function sanitizePayload(value, opts = {}) {
  const { seen = new WeakSet(), depth = 0, maxDepth = 6 } = opts;

  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;

  // avoid extremely deep structures
  if (depth >= maxDepth) return "[MaxDepth]";

  // circular reference
  if (seen.has(value)) return "[Circular]";

  seen.add(value);

  // Date
  if (value instanceof Date) return value.toISOString();

  // Buffer
  if (
    typeof Buffer !== "undefined" &&
    Buffer.isBuffer &&
    Buffer.isBuffer(value)
  ) {
    return "[Buffer]";
  }

  // Mongoose ObjectId detection
  if (value && value._bsontype === "ObjectID") {
    try {
      return value.toString();
    } catch (e) {
      return "[ObjectId]";
    }
  }

  // If Mongoose document, try to convert to plain object first (safer)
  if (typeof value.toObject === "function" && !Array.isArray(value)) {
    try {
      const obj = value.toObject({ getters: false, virtuals: false });
      return sanitizePayload(obj, { seen, depth: depth + 1, maxDepth });
    } catch (e) {
      // fallthrough to normal handling
    }
  }

  if (Array.isArray(value)) {
    const out = [];
    for (const item of value) {
      out.push(sanitizePayload(item, { seen, depth: depth + 1, maxDepth }));
    }
    return out;
  }

  const out = {};
  for (const [k, v] of Object.entries(value)) {
    const keyLower = String(k).toLowerCase();
    if (SENSITIVE_KEYS.has(keyLower)) {
      out[k] = "***";
      continue;
    }

    try {
      out[k] = sanitizePayload(v, { seen, depth: depth + 1, maxDepth });
    } catch (err) {
      out[k] = "[SanitizeError]";
    }
  }

  return out;
}

/**
 * Build a small request snapshot (avoid passing full req/res to logger).
 * Only keep fields we need and sanitize body.
 */
function buildReqSnapshot(req) {
  if (!req || typeof req !== "object") return null;
  return {
    method: req.method,
    path: req.originalUrl || req.url,
    params: req.params,
    query: req.query,
    body: sanitizePayload(req.body || {}),
    headers: {
      "user-agent": req.headers?.["user-agent"],
      // mask authorization header to avoid leaking tokens
      authorization: req.headers?.authorization ? "***" : undefined,
    },
    ip: req.ip || req.headers?.["x-forwarded-for"] || null,
    correlationId: req.correlationId || null,
  };
}

function buildResSnapshot(res) {
  if (!res || typeof res !== "object") return null;
  return {
    statusCode: res.statusCode || null,
  };
}

/**
 * logUserActivity - safe audit + client log writer
 * - action: required
 * - req/res: can pass original express req/res OR a prebuilt snapshot (recommended snapshot)
 */
function logUserActivity({
  action,
  userId,
  role,
  target = {},
  description,
  payload = {},
  meta = {},
  req,
  res,
}) {
  if (!action) {
    console.warn("logUserActivity called without action name");
    return;
  }

  // actor info
  const actorId = userId || (req && req.user && req.user.userId) || "anonymous";
  const actorRole = role || (req && req.user && req.user.role) || null;

  // If full req/res passed, convert to safe snapshots
  const reqSnapshot = req && req.method ? buildReqSnapshot(req) : req || {};
  const resSnapshot = res && res.statusCode ? buildResSnapshot(res) : res || {};

  // sanitize payload (handles circulars)
  const sanitizedPayload = sanitizePayload(payload || {});
  const finalMeta = { ...meta };
  if (description) finalMeta.description = description;

  // Prepare audit object matching createAudit signature
  const auditObj = {
    actorId,
    actorRole,
    action,
    target,
    req: reqSnapshot,
    res: resSnapshot,
    meta: {
      ...finalMeta,
      payload: sanitizedPayload,
    },
  };

  // Fire-and-forget audit creation (createAudit should itself handle errors)
  Promise.resolve(createAudit(auditObj)).catch((err) => {
    console.error(
      `Failed to write audit log for action ${action}:`,
      err && err.message ? err.message : err
    );
  });

  // Prepare client log doc
  const clientLogDoc = {
    timestamp: new Date(),
    event: action,
    payload: sanitizedPayload,
    url: reqSnapshot?.path || null,
    userAgent: reqSnapshot?.headers?.["user-agent"] || null,
    userId: actorId,
    correlationId: reqSnapshot?.correlationId || null,
    ip: reqSnapshot?.ip || null,
    meta: finalMeta,
  };

  // Fire-and-forget write to ClientLog collection
  Promise.resolve(ClientLog.create(clientLogDoc)).catch((err) => {
    console.error(
      `Failed to write client log for action ${action}:`,
      err && err.message ? err.message : err
    );
  });
}

module.exports = { logUserActivity, sanitizePayload };
