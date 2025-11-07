// routes/clientLogs.js
const express = require("express");
const router = express.Router();
const ClientLog = require("../models/ClientLog");
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.MAX_CLIENT_LOG_RPS || "200"),
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/", limiter, async (req, res) => {
  try {
    // sampling: nếu không bật FULL_CLIENT_LOG, sample 2%
    const FULL_CLIENT = process.env.FULL_CLIENT_LOG === "true";
    if (!FULL_CLIENT && Math.random() > 0.02) {
      return res.status(202).json({ accepted: true, sampled: true });
    }

    const doc = {
      timestamp: new Date(),
      event: req.body.event,
      payload: req.body.payload,
      url: req.body.url || req.headers.referer,
      userAgent: req.headers["user-agent"],
      userId: req.body.userId || req.user?.id || null,
      correlationId:
        req.headers["x-correlation-id"] || req.body.correlationId || null,
      ip: req.ip,
      meta: req.body.meta || {},
    };

    await ClientLog.create(doc);
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("client log failed", err.message);
    res.status(500).json({ ok: false });
  }
});

module.exports = router;
