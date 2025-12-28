const mongoose = require("mongoose");

const EmergencyRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    phoneNumber: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      enum: ["panic", "medical", "fire", "police", "other"], // Loại yêu cầu khẩn cấp
      default: "panic",
    },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    locationAccuracy: { type: Number }, // Độ chính xác (mét)
    address: {
      type: String,
      required: false,
    },
    message: { type: String },
    isSilent: { type: Boolean, default: false },

    // Trạng thái và phản hồi
    status: {
      // Trạng thái yêu cầu
      type: String,
      enum: [
        "pending", // mới tạo
        "responded", // đã có người phản hồi
        "in_progress", // đang xử lý
        "resolved", // đã giải quyết
        "cancelled", // đã huỷ
        "expired", // hết hạn
      ],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["critical", "high", "medium", "low"], // Mức độ ưu tiên
      default: "medium",
    },

    // Thông tin phản hồi
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    respondedAt: { type: Date },
    responseNotes: { type: String },
    estimatedResponseTime: { type: String },
    assignedTeam: { type: String },

    // Thời gian giải quyết
    resolvedAt: { type: Date },
    resolutionNotes: { type: String },

    // Thông tin thiết bị
    deviceInfo: {
      battery: { type: Number },
      network: {
        type: String,
        enum: [
          "wifi",
          "cellular",
          "2g",
          "3g",
          "4g",
          "5g",
          "slow-2g",
          "unknown",
        ],
        default: "unknown",
      },
      os: { type: String },
      appVersion: { type: String },
    },

    // Ghi chú nội bộ
    notes: { type: String },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Indexes for better performance
EmergencyRequestSchema.index({ createdAt: -1 });
EmergencyRequestSchema.index({ status: 1 });
EmergencyRequestSchema.index({ priority: 1 });
EmergencyRequestSchema.index({ type: 1 });
EmergencyRequestSchema.index({ userId: 1 });

// Auto-update updatedAt on save
EmergencyRequestSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("EmergencyRequest", EmergencyRequestSchema);
