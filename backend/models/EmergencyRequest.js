const mongoose = require("mongoose");

const EmergencyRequestSchema = new mongoose.Schema({
  userId: {
  type: String, // 👈 cho phép string
  required: false,
},

  type: { type: String, default: "panic" },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  message: { type: String },
  isSilent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: "Pending" }, // Pending | Responded | Resolved
});

module.exports = mongoose.model("EmergencyRequest", EmergencyRequestSchema);
