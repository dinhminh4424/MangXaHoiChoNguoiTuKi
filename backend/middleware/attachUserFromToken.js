// middleware/attachUserFromToken.js
const jwt = require("jsonwebtoken");

/**
 * Lightweight middleware: nếu có Authorization Bearer token -> verify -> gán req.user
 * KHÔNG trả 401 nếu token thiếu/không hợp lệ, chỉ next().
 * Gán cả req.user.userId và req.user.id để tương thích.
 */
module.exports = function attachUserFromToken(req, res, next) {
  try {
    const authHeader =
      req.header("Authorization") || req.header("authorization");
    if (!authHeader) {
      // debug: không có header
      // console.log('[attachUserFromToken] no auth header');
      return next();
    }

    // support "Bearer <token>" or raw token
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : authHeader.trim();
    if (!token) {
      // console.log('[attachUserFromToken] token empty after slice');
      return next();
    }

    // Verify token and attach minimal user info
    let payload;
    try {
      payload = jwt.verify(
        token,
        process.env.JWT_SECRET || "autism_support_secret"
      );
    } catch (e) {
      // invalid token -> don't block
      // console.warn('[attachUserFromToken] jwt.verify failed:', e.message);
      return next();
    }

    // Debug: show payload (optional, remove in prod)
    // console.log('[attachUserFromToken] token payload:', payload);

    // Ensure req.user exists and set both userId and id for compatibility
    req.user = req.user || {};
    const userId = payload.userId || payload.sub || payload.id || null;
    req.user.userId = userId;
    req.user.id = userId; // some code expects req.user.id
    req.user.username =
      payload.username || payload.name || req.user.username || null;
    req.user.role = payload.role || req.user.role || null;

    return next();
  } catch (err) {
    // swallow errors - do not block request
    return next();
  }
};
