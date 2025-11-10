const mongoose = require("mongoose");

const EmergencyRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: false,
    },
    phoneNumber: {
      type: String,
      required: false,
    },
    type: { type: String, default: "panic" },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: {
      type: String, // ✅ địa chỉ cụ thể
      required: false,
    },
    message: { type: String },
    isSilent: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    status: { type: String, default: "Pending" }, // Pending | Responded | Resolved
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmergencyRequest", EmergencyRequestSchema);
