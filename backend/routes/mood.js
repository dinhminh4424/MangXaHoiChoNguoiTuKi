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
    const {
      page = 1,
      limit = 10,
      emotion,
      detectedFrom,
      dateFrom,
      dateTo,
      search,
    } = req.query;

    const query = { userId: req.user.userId };

    // Filter by emotion
    if (emotion) query.emotion = emotion;

    // Filter by detection method
    if (detectedFrom) query.detectedFrom = detectedFrom;

    // Filter by date range
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Set to end of the day
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    // Text search in note and description
    if (search) {
      query.$or = [
        { note: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const moodLogs = await MoodLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await MoodLog.countDocuments(query);

    res.json({
      success: true,
      moodLogs,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// routes/mood.js - Sửa phần stats
router.get("/stats", auth, async (req, res) => {
  try {
    const { period = "week" } = req.query;

    let startDate = new Date();

    // Calculate start date based on period
    switch (period) {
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    // Sử dụng find thay vì aggregate với $match
    const moodLogs = await MoodLog.find({
      userId: req.user.userId,
      createdAt: { $gte: startDate },
    });

    // Manual aggregation
    const stats = {};
    moodLogs.forEach((log) => {
      if (!stats[log.emotion]) {
        stats[log.emotion] = {
          count: 0,
          totalIntensity: 0,
        };
      }
      stats[log.emotion].count++;
      stats[log.emotion].totalIntensity += log.intensity;
    });

    // Convert to array format và tính avgIntensity
    const statsArray = Object.entries(stats).map(([emotion, data]) => ({
      _id: emotion,
      count: data.count,
      avgIntensity: data.totalIntensity / data.count,
    }));

    // Sort by count descending
    statsArray.sort((a, b) => b.count - a.count);

    // Get total count for the period
    const totalCount = moodLogs.length;

    res.json({
      success: true,
      period,
      stats: statsArray,
      totalCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// Get mood trends (for charts)
router.get("/trends", auth, async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const dateFilter = {
      createdAt: {
        $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      },
    };

    const trends = await MoodLog.aggregate([
      {
        $match: {
          userId: req.user.userId,
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            emotion: "$emotion",
          },
          count: { $sum: 1 },
          avgIntensity: { $avg: "$intensity" },
        },
      },
      {
        $sort: { "_id.date": 1, "_id.emotion": 1 },
      },
    ]);

    // Also get daily totals
    const dailyTotals = await MoodLog.aggregate([
      {
        $match: {
          userId: req.user.userId,
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          },
          totalEntries: { $sum: 1 },
          avgMoodIntensity: { $avg: "$intensity" },
        },
      },
      {
        $sort: { "_id.date": 1 },
      },
    ]);

    res.json({
      success: true,
      trends,
      dailyTotals,
      days: parseInt(days),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
