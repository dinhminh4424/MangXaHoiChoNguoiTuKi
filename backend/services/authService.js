// services/authService.js
const NotificationService = require("./notificationService");
const User = require("../models/User");

async function notifyForceLogout(
  userId,
  { reason = "force_logout", actorId = null } = {}
) {
  try {
    await User.findByIdAndUpdate(userId, {
      isOnline: false,
      lastSeen: Date.now(),
    });

    await NotificationService.createAndEmitNotification({
      recipient: userId,
      sender: actorId,
      type: "FORCE_LOGOUT",
      title: "Bạn đã bị đăng xuất",
      message: "Tài khoản của bạn đã bị đăng xuất do vi phạm quy định.",
      data: { reason },
      priority: "high",
      url: "/login",
    });

    return { success: true };
  } catch (err) {
    console.error("notifyForceLogout error:", err);
    return { success: false, error: err };
  }
}

module.exports = { notifyForceLogout };
