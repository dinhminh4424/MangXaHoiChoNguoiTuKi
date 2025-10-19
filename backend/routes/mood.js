// routes/mood.js
const express = require("express");
const router = express.Router();
const MoodLog = require("../models/MoodLog");
const Group = require("../models/Group");
const auth = require("../middleware/auth");

// Log mood entry
router.post("/log", auth, async (req, res) => {
  try {
    const {
      emotion,
      intensity,
      description,
      tags,
      note,
      detectedFrom,
      imageData,
    } = req.body;

    const moodLog = new MoodLog({
      userId: req.user.userId,
      emotion,
      intensity,
      description,
      tags,
      note,
      detectedFrom,
      imageData,
    });

    await moodLog.save();

    // Get group recommendations based on emotion
    const recommendedGroups = await Group.find({
      emotionTags: emotion,
      visibility: "public",
    }).limit(3);

    res.json({
      success: true,
      moodLog,
      recommendedGroups,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get mood history
router.get("/history", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, emotion } = req.query;

    const query = { userId: req.user.userId };
    if (emotion) query.emotion = emotion;

    const moodLogs = await MoodLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await MoodLog.countDocuments(query);

    res.json({
      success: true,
      moodLogs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/stats", auth, async (req, res) => {
  try {
    const { period = "week" } = req.query;

    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case "week":
        dateFilter = {
          createdAt: { $gte: new Date(now.setDate(now.getDate() - 7)) },
        };
        break;
      case "month":
        dateFilter = {
          createdAt: { $gte: new Date(now.setMonth(now.getMonth() - 1)) },
        };
        break;
      case "year":
        dateFilter = {
          createdAt: { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) },
        };
        break;
    }

    const stats = await MoodLog.aggregate([
      {
        $match: {
          userId: req.user.userId,
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: "$emotion",
          count: { $sum: 1 },
          avgIntensity: { $avg: "$intensity" },
        },
      },
    ]);

    res.json({
      success: true,
      period,
      stats,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get mood trends (for charts)
router.get("/trends", auth, async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const trends = await MoodLog.aggregate([
      {
        $match: {
          userId: req.user.userId,
          createdAt: {
            $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            emotion: "$emotion",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    res.json({
      success: true,
      trends,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
