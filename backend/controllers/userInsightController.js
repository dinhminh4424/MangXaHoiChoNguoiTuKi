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

// Hàm tách string thành mảng (nếu nhận array thì trả về luôn)
const parseArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    return val
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean);
  }
  return [];
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

    console.log("req.body: ", req.body);

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu userId trong Body" });
    }

    // Tách string thành array
    const newSensoryTriggers = parseArray(sensoryTriggers);
    const newSensorySoothers = parseArray(sensorySoothers);
    const newFavoriteTopics = parseArray(favoriteTopics);
    const newTopicsToAvoid = parseArray(topicsToAvoid);
    const newCommonEmotions = parseArray(commonEmotions);
    const newPreferredStyle = parseArray(preferredStyle);

    // Tìm bản ghi
    let insight = await UserInsight.findOne({ userId });

    if (!insight) {
      // Tạo mới
      insight = new UserInsight({
        userId,
        sensoryTriggers: newSensoryTriggers,
        sensorySoothers: newSensorySoothers,
        favoriteTopics: newFavoriteTopics,
        topicsToAvoid: newTopicsToAvoid,
        commonEmotions: newCommonEmotions,
        preferredStyle: newPreferredStyle,
        personalitySummary: personalitySummary || "",
      });
    } else {
      // Merge array cũ + mới
      insight.sensoryTriggers = mergeUnique(
        insight.sensoryTriggers,
        newSensoryTriggers
      );
      insight.sensorySoothers = mergeUnique(
        insight.sensorySoothers,
        newSensorySoothers
      );
      insight.favoriteTopics = mergeUnique(
        insight.favoriteTopics,
        newFavoriteTopics
      );
      insight.topicsToAvoid = mergeUnique(
        insight.topicsToAvoid,
        newTopicsToAvoid
      );
      insight.commonEmotions = mergeUnique(
        insight.commonEmotions,
        newCommonEmotions
      );

      // Xử lý string
      if (preferredStyle) {
        insight.preferredStyle = preferredStyle;
        insight.preferredStyle = mergeUnique(
          insight.preferredStyle,
          newPreferredStyle
        );
      }
      if (personalitySummary) {
        if (!insight.personalitySummary.includes(personalitySummary)) {
          insight.personalitySummary = insight.personalitySummary
            ? insight.personalitySummary + ". " + personalitySummary
            : personalitySummary;
        }
      }
    }

    insight.lastUpdated = Date.now();
    await insight.save();

    console.log("insight: ", insight);
    res.json({
      success: true,
      message: "User insights updated (Merged)",
      data: insight,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.getUserInsights = async (req, res) => {
  try {
    const { userId } = req.params;

    // Gọi xuống MongoDB (Mongoose)
    const insight = await UserInsight.findOne({ userId: userId }).lean();

    if (!insight) {
      return res.json({
        found: false,
        personalitySummary: "Người dùng mới, chưa có nhiều thông tin.",
        sensoryTriggers: [],
        sensorySoothers: [],
        preferredStyle: "chi tiết", // Mặc định an toàn
        favoriteTopics: [],
        topicsToAvoid: [],
      });
    }

    return res.json({
      found: true,
      ...insight,
    });
  } catch (error) {
    console.error("Lỗi lấy insights:", error);
    return res.status(500).json({ error: "Lỗi server khi lấy insights" });
  }
};
