// controllers/userInsightController.js
const UserInsight = require("../models/UserInsight");

// Hàm hỗ trợ gộp mảng và loại bỏ trùng lặp (Helper Function)
const mergeUnique = (oldArray, newArray) => {
  if (!newArray) return oldArray;
  // Đảm bảo input là mảng
  const incoming = Array.isArray(newArray) ? newArray : [newArray];
  // Gộp mảng cũ + mới -> Dùng Set để lọc trùng -> Chuyển lại thành mảng
  return [...new Set([...oldArray, ...incoming])];
};

exports.updateUserInsights = async (req, res, next) => {
  try {
    const {
      sensoryTriggers,
      sensorySoothers,
      favoriteTopics,
      topicsToAvoid,
      preferredStyle,
      personalitySummary,
      commonEmotions,
      userId,
    } = req.body;

    console.log("AI Update Insight cho User:", userId);
    console.log("req.body: ", req.body);

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu userId trong Body" });
    }

    // Tìm bản ghi
    let insight = await UserInsight.findOne({ userId });

    // TRƯỜNG HỢP 1: CHƯA CÓ -> TẠO MỚI (Giữ nguyên logic cũ)
    if (!insight) {
      insight = new UserInsight({
        userId,
        sensoryTriggers: sensoryTriggers || [],
        sensorySoothers: sensorySoothers || [],
        favoriteTopics: favoriteTopics || [],
        topicsToAvoid: topicsToAvoid || [],
        commonEmotions: commonEmotions || [],
        preferredStyle: preferredStyle || null,
        personalitySummary: personalitySummary || "",
      });
    }
    // TRƯỜNG HỢP 2: ĐÃ CÓ -> CẬP NHẬT THÊM (Sửa logic ở đây)
    else {
      // --- Xử lý các trường MẢNG (Array) ---
      // Logic: Mảng cũ + Mảng mới (không trùng)
      if (sensoryTriggers) {
        insight.sensoryTriggers = mergeUnique(
          insight.sensoryTriggers,
          sensoryTriggers
        );
      }
      if (sensorySoothers) {
        insight.sensorySoothers = mergeUnique(
          insight.sensorySoothers,
          sensorySoothers
        );
      }
      if (favoriteTopics) {
        insight.favoriteTopics = mergeUnique(
          insight.favoriteTopics,
          favoriteTopics
        );
      }
      if (topicsToAvoid) {
        insight.topicsToAvoid = mergeUnique(
          insight.topicsToAvoid,
          topicsToAvoid
        );
      }
      if (commonEmotions) {
        insight.commonEmotions = mergeUnique(
          insight.commonEmotions,
          commonEmotions
        );
      }

      // --- Xử lý các trường VĂN BẢN (String) ---
      // Tùy chọn 1: Ghi đè (Thường dùng cho PreferredStyle vì phong cách thay đổi)
      if (preferredStyle) insight.preferredStyle = preferredStyle;

      // Tùy chọn 2: Cộng dồn văn bản (Nếu muốn Personality Summary dài thêm)
      // Nếu bạn muốn ghi đè Personality thì giữ nguyên: insight.personalitySummary = personalitySummary;
      // Dưới đây là code cộng dồn:
      if (personalitySummary) {
        // Chỉ thêm nếu nội dung mới chưa có trong nội dung cũ (tránh lặp câu)
        if (!insight.personalitySummary.includes(personalitySummary)) {
          insight.personalitySummary = insight.personalitySummary
            ? insight.personalitySummary + ". " + personalitySummary
            : personalitySummary;
        }
      }
    }

    insight.lastUpdated = Date.now();
    await insight.save();

    res.json({
      success: true,
      message: "User insights updated (Merged)",
      data: insight,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};
