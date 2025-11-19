// middlewares/rateLimitMiddleware.js
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

const AuthService = require("../services/authService");

// createMemoryStore nhận windowMs (ms) để store trả resetTime phù hợp
const createMemoryStore = (windowMs) => {
  const store = new Map();

  // windowSec dùng để làm key bucket (số giây)
  const windowSec = Math.floor(windowMs / 1000);

  return {
    // key là chuỗi do keyGenerator truyền vào (ví dụ "post_creation:123")
    increment: (key) => {
      const nowSec = Math.floor(Date.now() / 1000);
      // bucket theo windowSec (cửa sổ cố định)
      const windowStart = Math.floor(nowSec / windowSec) * windowSec;
      const recordKey = `${key}:${windowStart}`;

      const current = store.get(recordKey) || 0;
      store.set(recordKey, current + 1);

      // trả tổng hits trong cửa sổ hiện tại
      const totalHits = current + 1;
      const resetTime = new Date((windowStart + windowSec) * 1000);

      // cleanup: xoá key cũ hơn 2 * windowSec (vừa đủ)
      const cleanupBefore = nowSec - windowSec * 2;
      for (const k of store.keys()) {
        const parts = k.split(":");
        if (parts.length < 2) continue;
        const ts = parseInt(parts[parts.length - 1], 10);
        if (Number.isNaN(ts)) continue;
        if (ts < cleanupBefore) store.delete(k);
      }

      return Promise.resolve({
        totalHits,
        resetTime,
      });
    },

    decrement: (key) => {
      // optional: nếu bạn cần rollback request (thường không cần)
      // tìm bucket hiện tại và giảm 1
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

// TẠO store riêng cho từng limiter để resetTime khớp
const postCreationStore = createMemoryStore(5 * 60 * 1000); // 5 phút
const searchStore = createMemoryStore(1 * 60 * 1000); // 1 phút
const reportStore = createMemoryStore(10 * 60 * 1000); // 10 phút

//  reset time
const handlerWithReset = (message, store, keyPrefix) => async (req, res) => {
  let resetTime = null;
  try {
    const key = req.user?.userId
      ? `${keyPrefix}:${req.user.userId}`
      : ipKeyGenerator(req.ip);
    const data = await store.increment(key); // lấy resetTime từ store
    resetTime = data.resetTime;
  } catch (err) {
    console.error("rate-limit store increment error:", err);
  }

  res.setHeader(
    "Retry-After",
    resetTime ? Math.ceil((resetTime - Date.now()) / 1000) : 60
  );
  return res.status(429).json({
    success: false,
    message,
    resetTime, // gửi luôn resetTime
  });
};

// Middleware giới hạn tạo bài viết
exports.postCreationLimiter = rateLimit({
  store: postCreationStore,
  windowMs: 5 * 60 * 1000, // 5 phút
  max: 10,
  keyGenerator: (req) => `post_creation:${req.user?.userId || req.ip}`,
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message:
        "Bạn đã đăng quá nhiều bài viết trong thời gian ngắn. Vui lòng thử lại sau một khoảng thời gian.",
    });
  },
  skip: (req) => {
    const role = String(req.user?.role || "").toLowerCase();
    return ["admin", "supporter"].includes(role);
  },
  keyGenerator: (req) => {
    if (req.user?.userId) return `post_creation:${req.user.userId}`;
    return ipKeyGenerator(req.ip);
  },
});

// Middleware giới hạn tìm kiếm (khi page = 1)
exports.searchLimiter = rateLimit({
  store: searchStore,
  windowMs: 1 * 60 * 1000,
  max: 10, // tối đa bao nhiêu resquet
  keyGenerator: (req) => `search:${req.user?.userId || req.ip}`,
  handler: async (req, res) => {
    try {
      // nếu cần thông báo / force logout người dùng (nếu user tồn tại)
      if (req.user && req.user.userId) {
        console.log("Kiểm tra");
        await AuthService.notifyForceLogout(req.user.userId);
      }
    } catch (err) {
      // log lỗi nhưng không block response
      console.error("notifyForceLogout failed:", err);
    }

    return handlerWithReset(
      "Bạn tìm kiếm quá nhanh. Vui lòng thử lại sau 1 phút.",
      searchStore,
      "search"
    )(req, res);

    // return res.status(429).json({
    //   success: false,
    //   message: "Bạn thực hiện tìm kiếm quá nhanh. Vui lòng thử lại sau 1 phút.",
    // });
  },
  skip: (req) => {
    const page = parseInt(req.query.page, 10) || 1;
    return page !== 1;
  },
  keyGenerator: (req) => {
    if (req.user?.userId) return `post_creation:${req.user.userId}`;
    return ipKeyGenerator(req.ip);
  },
});

// Middleware giới hạn báo cáo
exports.reportLimiter = rateLimit({
  store: reportStore,
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => `report:${req.user?.userId || req.ip}`,
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: "Bạn đã gửi quá nhiều báo cáo. Vui lòng thử lại sau 10 phút.",
    });
  },
  skip: (req) => {
    const role = String(req.user?.role || "").toLowerCase();
    return ["admin", "supporter"].includes(role);
  },
  keyGenerator: (req) => {
    if (req.user?.userId) return `post_creation:${req.user.userId}`;
    return ipKeyGenerator(req.ip);
  },
});
