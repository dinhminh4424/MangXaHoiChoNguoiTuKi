// middlewares/rateLimitMiddleware.js
const { rateLimit } = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");
const RateLimitConfig = require("../models/RateLimitConfig");
const AuthService = require("../services/authService");

// Store factory với windowMs động
const createMemoryStore = (windowMs) => {
  const store = new Map();
  const windowSec = Math.floor(windowMs / 1000);

  return {
    increment: (key) => {
      const nowSec = Math.floor(Date.now() / 1000);
      const windowStart = Math.floor(nowSec / windowSec) * windowSec;
      const recordKey = `${key}:${windowStart}`;
      const current = store.get(recordKey) || 0;
      store.set(recordKey, current + 1);

      const totalHits = current + 1;
      const resetTime = new Date((windowStart + windowSec) * 1000);

      // Cleanup old keys
      const cleanupBefore = nowSec - windowSec * 2;
      for (const k of store.keys()) {
        const parts = k.split(":");
        if (parts.length < 2) continue;
        const ts = parseInt(parts[parts.length - 1], 10);
        if (Number.isNaN(ts)) continue;
        if (ts < cleanupBefore) store.delete(k);
      }

      return Promise.resolve({ totalHits, resetTime });
    },

    decrement: (key) => {
      const nowSec = Math.floor(Date.now() / 1000);
      const windowStart = Math.floor(nowSec / windowSec) * windowSec;
      const recordKey = `${key}:${windowStart}`;
      const current = store.get(recordKey) || 0;
      if (current > 0) store.set(recordKey, current - 1);
      return Promise.resolve();
    },

    resetKey: (key) => {
      for (const k of store.keys()) {
        if (k.startsWith(`${key}:`)) store.delete(k);
      }
      return Promise.resolve();
    },
  };
};

// Cache đơn giản cho stores
const storeCache = new Map();

const getOrCreateStore = (windowMs) => {
  const cacheKey = `store_${windowMs}`;
  if (!storeCache.has(cacheKey)) {
    storeCache.set(cacheKey, createMemoryStore(windowMs));
  }
  return storeCache.get(cacheKey);
};

// Hàm tạo rate limiter đơn giản
const createSimpleLimiter = (config) => {
  if (!config || !config.enabled) {
    return null;
  }

  const store = getOrCreateStore(config.windowMs);

  const keyGenerator = (req) => {
    if (req.user?.userId) return `${config.key}:${req.user.userId}`;
    return `${config.key}:${ipKeyGenerator(req)}`;
  };

  const handler = async (req, res) => {
    let resetTime = null;
    try {
      const key = keyGenerator(req);
      const data = await store.increment(key);
      resetTime = data.resetTime;
    } catch (err) {
      console.error("rate-limit store increment error:", err);
    }

    res.setHeader(
      "Retry-After",
      resetTime ? Math.ceil((resetTime - Date.now()) / 1000) : 60
    );

    // Thông báo force logout cho search
    if (config.key === "search" && req.user?.userId) {
      try {
        await AuthService.notifyForceLogout(req.user.userId, {
          reason:
            config.customMessage ||
            "Bạn đã bị out vì nghi ngờ phá hoại hệ thống: Tìm kiếm quá nhiều",
          ratelimit: config.key,
        });
      } catch (err) {
        console.error("notifyForceLogout failed:", err);
      }
    }
    if (config.key === "postCreation" && req.user?.userId) {
      try {
        await AuthService.notifyForceLogout(req.user.userId, {
          reason:
            config.customMessage ||
            "Bạn đã bị out vì nghi ngờ phá hoại hệ thống: Đăng bài quá nhiều",
          ratelimit: config.key,
        });
      } catch (err) {
        console.error("notifyForceLogout failed:", err);
      }
    }
    if (config.key === "report" && req.user?.userId) {
      try {
        await AuthService.notifyForceLogout(req.user.userId, {
          reason:
            config.customMessage ||
            "Bạn đã bị out vì nghi ngờ phá hoại hệ thống: Report quá nhiều",
          ratelimit: config.key,
        });
      } catch (err) {
        console.error("notifyForceLogout failed:", err);
      }
    }
    if (config.key === "comment" && req.user?.userId) {
      try {
        await AuthService.notifyForceLogout(req.user.userId, {
          reason:
            config.customMessage ||
            "Bạn đã bị out vì nghi ngờ phá hoại hệ thống: Comment quá nhiều",
          ratelimit: config.key,
        });
      } catch (err) {
        console.error("notifyForceLogout failed:", err);
      }
    }
    if (config.key === "login" && req.user?.userId) {
      try {
        await AuthService.notifyForceLogout(req.user.userId, {
          reason:
            config.customMessage ||
            "Bạn đã bị out vì nghi ngờ phá hoại hệ thống: login quá nhiều",
          ratelimit: config.key,
        });
      } catch (err) {
        console.error("notifyForceLogout failed:", err);
      }
    }

    return res.status(429).json({
      success: false,
      message:
        config.customMessage || "Quá nhiều request. Vui lòng thử lại sau.",
      resetTime,
    });
  };

  return rateLimit({
    store,
    windowMs: config.windowMs,
    max: config.max,
    keyGenerator,
    handler,
    skip: (req) => {
      // Skip nếu user có role được bỏ qua
      if (req.user && config.skipRoles && config.skipRoles.length > 0) {
        const userRole = String(req.user.role || "").toLowerCase();
        return config.skipRoles.includes(userRole);
      }
      return false;
    },
  });
};

// Middleware dynamic rate limiter đơn giản
exports.createDynamicRateLimiter = (configKey) => {
  // Tạo limiter instance một lần duy nhất
  let limiterInstance = null;
  let lastConfig = null;

  return async (req, res, next) => {
    try {
      // Lấy config từ database
      const config = await RateLimitConfig.findOne({
        key: configKey,
        enabled: true,
      });

      // Nếu không có config hoặc bị disabled, skip
      if (!config) {
        return next();
      }

      // Kiểm tra skip roles
      if (req.user && config.skipRoles && config.skipRoles.length > 0) {
        const userRole = String(req.user.role || "").toLowerCase();
        if (config.skipRoles.includes(userRole)) {
          return next();
        }
      }

      //////////////////////////// SKIP CUSTOM //////////////////////////

      // 🔥 3. Skip search nhẹ (CHỈ áp dụng cho key = search)
      if (config.key === "search" && shouldSkipSearchRateLimit(req)) {
        return next();
      }

      //////////////////////////// END SKIP CUSTOM //////////////////////////

      // Tạo hoặc cập nhật limiter nếu config thay đổi
      const configChanged =
        !lastConfig ||
        lastConfig.windowMs !== config.windowMs ||
        lastConfig.max !== config.max ||
        lastConfig.customMessage !== config.customMessage;

      if (!limiterInstance || configChanged) {
        limiterInstance = createSimpleLimiter(config);
        lastConfig = config;
      }

      // Nếu không có limiter, skip
      if (!limiterInstance) {
        return next();
      }

      // Thực thi limiter
      return limiterInstance(req, res, next);
    } catch (error) {
      console.error(`Error in rate limiter for ${configKey}:`, error);
      return next();
    }
  };
};

// Các rate limiter cụ thể
exports.postCreationLimiter = exports.createDynamicRateLimiter("postCreation");
exports.searchLimiter = exports.createDynamicRateLimiter("search");
exports.reportLimiter = exports.createDynamicRateLimiter("report");
exports.loginLimiter = exports.createDynamicRateLimiter("login");
exports.commentLimiter = exports.createDynamicRateLimiter("comment");

// Hàm refresh đơn giản (không cần thiết nữa vì đã tự động cập nhật)
exports.refreshConfigCache = () => {
  console.log("Refresh config cache - No longer needed");
};

//////////////////////////////////////////////// Skip /////////////////////////////////////
// skip cho search
const shouldSkipSearchRateLimit = (req) => {
  const { search, emotions, tags, privacy, page } = req.query;

  const pageNumber = Number(page || 1);

  // Nếu page > 1 => user đang lướt => skip
  if (pageNumber > 1) return true;

  const hasAnyQuery = [search, emotions, tags, privacy].some(
    (v) => v !== undefined && String(v).trim() !== ""
  );

  // Không có query gì cả => chỉ lướt feed => skip
  if (!hasAnyQuery) return true;

  // page = 1 + có query => tính rate limit
  return false;
};
