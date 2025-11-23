// // middlewares/rateLimitMiddleware.js
// const { rateLimit } = require("express-rate-limit");
// const { ipKeyGenerator } = require("express-rate-limit");
// const RateLimitConfig = require("../models/RateLimitConfig");
// const AuthService = require("../services/authService");

// // Store factory với windowMs động
// const createMemoryStore = (windowMs) => {
//   const store = new Map();
//   const windowSec = Math.floor(windowMs / 1000);

//   return {
//     increment: (key) => {
//       const nowSec = Math.floor(Date.now() / 1000);
//       const windowStart = Math.floor(nowSec / windowSec) * windowSec;
//       const recordKey = `${key}:${windowStart}`;
//       const current = store.get(recordKey) || 0;
//       store.set(recordKey, current + 1);

//       const totalHits = current + 1;
//       const resetTime = new Date((windowStart + windowSec) * 1000);

//       // Cleanup old keys
//       const cleanupBefore = nowSec - windowSec * 2;
//       for (const k of store.keys()) {
//         const parts = k.split(":");
//         if (parts.length < 2) continue;
//         const ts = parseInt(parts[parts.length - 1], 10);
//         if (Number.isNaN(ts)) continue;
//         if (ts < cleanupBefore) store.delete(k);
//       }

//       return Promise.resolve({ totalHits, resetTime });
//     },

//     decrement: (key) => {
//       const nowSec = Math.floor(Date.now() / 1000);
//       const windowStart = Math.floor(nowSec / windowSec) * windowSec;
//       const recordKey = `${key}:${windowStart}`;
//       const current = store.get(recordKey) || 0;
//       if (current > 0) store.set(recordKey, current - 1);
//       return Promise.resolve();
//     },

//     resetKey: (key) => {
//       for (const k of store.keys()) {
//         if (k.startsWith(`${key}:`)) store.delete(k);
//       }
//       return Promise.resolve();
//     },
//   };
// };

// // Cache cho stores và configs
// const storeCache = new Map();
// const configCache = new Map();
// const limiterCache = new Map(); // Cache cho rate limiter instances

// const getOrCreateStore = (windowMs) => {
//   const cacheKey = `store_${windowMs}`;
//   if (!storeCache.has(cacheKey)) {
//     storeCache.set(cacheKey, createMemoryStore(windowMs));
//   }
//   return storeCache.get(cacheKey);
// };

// // Hàm tạo rate limiter với config cụ thể
// const createLimiter = (configKey, config) => {
//   if (!config || !config.enabled) {
//     return null;
//   }

//   const store = getOrCreateStore(config.windowMs);

//   const keyGenerator = (req) => {
//     if (req.user?.userId) return `${configKey}:${req.user.userId}`;
//     return `${configKey}:${ipKeyGenerator(req)}`;
//   };

//   const handler = async (req, res) => {
//     let resetTime = null;
//     try {
//       const key = keyGenerator(req);
//       const data = await store.increment(key);
//       resetTime = data.resetTime;
//     } catch (err) {
//       console.error("rate-limit store increment error:", err);
//     }

//     res.setHeader(
//       "Retry-After",
//       resetTime ? Math.ceil((resetTime - Date.now()) / 1000) : 60
//     );

//     // Thông báo force logout cho search
//     if (configKey === "search" && req.user?.userId) {
//       try {
//         await AuthService.notifyForceLogout(req.user.userId);
//       } catch (err) {
//         console.error("notifyForceLogout failed:", err);
//       }
//     }

//     return res.status(429).json({
//       success: false,
//       message:
//         config.customMessage || "Quá nhiều request. Vui lòng thử lại sau.",
//       resetTime,
//     });
//   };

//   return rateLimit({
//     store,
//     windowMs: config.windowMs,
//     max: config.max,
//     keyGenerator,
//     handler,
//     skip: (req) => {
//       // Skip nếu user có role được bỏ qua
//       if (req.user && config.skipRoles && config.skipRoles.length > 0) {
//         const userRole = String(req.user.role || "").toLowerCase();
//         return config.skipRoles.includes(userRole);
//       }
//       return false;
//     },
//   });
// };

// // Hàm khởi tạo tất cả rate limiters
// exports.initializeRateLimiters = async () => {
//   try {
//     console.log("🔄 Đang khởi tạo rate limiters...");

//     const configs = await RateLimitConfig.find({ enabled: true });

//     for (const config of configs) {
//       const limiter = createLimiter(config.key, config);
//       if (limiter) {
//         limiterCache.set(config.key, limiter);
//         console.log(`✅ Đã khởi tạo rate limiter: ${config.key}`);
//       }
//     }

//     console.log(`✅ Đã khởi tạo ${limiterCache.size} rate limiters`);
//   } catch (error) {
//     console.error("❌ Lỗi khởi tạo rate limiters:", error);
//   }
// };

// // Middleware dynamic rate limiter
// exports.createDynamicRateLimiter = (configKey, defaultConfig = {}) => {
//   return async (req, res, next) => {
//     try {
//       // Lấy limiter từ cache
//       let limiter = limiterCache.get(configKey);

//       // Nếu không có limiter trong cache, thử lấy config và tạo
//       if (!limiter) {
//         let config = configCache.get(configKey);

//         if (!config) {
//           config = await RateLimitConfig.findOne({
//             key: configKey,
//             enabled: true,
//           });
//           if (config) {
//             configCache.set(configKey, config);
//           }
//         }

//         if (config) {
//           limiter = createLimiter(configKey, config);
//           if (limiter) {
//             limiterCache.set(configKey, limiter);
//           }
//         }
//       }

//       // Nếu không có limiter (config không tồn tại hoặc disabled), skip
//       if (!limiter) {
//         return next();
//       }

//       // Thực thi limiter
//       return limiter(req, res, next);
//     } catch (error) {
//       console.error(`Error in rate limiter for ${configKey}:`, error);
//       return next();
//     }
//   };
// };

// // Các rate limiter cụ thể
// exports.postCreationLimiter = exports.createDynamicRateLimiter("postCreation");
// exports.searchLimiter = exports.createDynamicRateLimiter("search");
// exports.reportLimiter = exports.createDynamicRateLimiter("report");
// exports.loginLimiter = exports.createDynamicRateLimiter("login");
// exports.commentLimiter = exports.createDynamicRateLimiter("comment");

// // Hàm refresh cache (gọi khi admin update config)
// exports.refreshConfigCache = async (configKey = null) => {
//   if (configKey) {
//     configCache.delete(configKey);
//     limiterCache.delete(configKey);

//     // Tạo lại limiter nếu config tồn tại và enabled
//     const config = await RateLimitConfig.findOne({ key: configKey });
//     if (config && config.enabled) {
//       const limiter = createLimiter(configKey, config);
//       if (limiter) {
//         limiterCache.set(configKey, limiter);
//       }
//     }
//   } else {
//     configCache.clear();
//     limiterCache.clear();
//     // Khởi tạo lại tất cả
//     await exports.initializeRateLimiters();
//   }
//   console.log(`Rate limit config cache refreshed for: ${configKey || "all"}`);
// };

// =============== bản 2

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
