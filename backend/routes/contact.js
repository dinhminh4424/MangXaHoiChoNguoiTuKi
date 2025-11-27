const express = require("express");
const User = require("../models/User");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Tổng số user
    const countUser = await User.countDocuments();

    // Đếm admin — chuẩn hoá role là "admin"
    const countAdmin = await User.countDocuments({
      role: { $in: ["admin", "supporter", "doctor"] },
    });

    // Lấy danh sách admin (chỉ trả ra fields cần thiết)
    const admins = await User.find({ role: "admin" }).select(
      "name email profile"
    );

    // Đếm theo tỉnh/thành (profile.location)
    // Nếu profile.location null -> gán "Unknown"
    const countByProvince = await User.aggregate([
      {
        $group: {
          _id: { $ifNull: ["$profile.location", "Unknown"] },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          province: "$_id",
          count: 1,
        },
      },
      { $sort: { count: -1, province: 1 } },
    ]);

    // Số tỉnh/thành khác nhau
    const distinctProvinceCount = countByProvince.length;

    const activeWeb = "24/7";

    res.status(200).json({
      success: true,
      data: {
        user,
        admins,
        countAdmin,
        countUser,
        countByProvince,
        distinctProvinceCount,
        activeWeb,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
