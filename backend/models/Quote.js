const mongoose = require("mongoose");

const quoteSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    author: { type: String, default: "Khuyết Danh" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quote", quoteSchema);
