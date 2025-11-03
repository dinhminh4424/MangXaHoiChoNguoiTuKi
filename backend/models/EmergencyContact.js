const mongoose = require("mongoose");

const EmergencyContactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  relationship: { type: String }, // bác sĩ, người thân, supporter
});

module.exports = mongoose.model("EmergencyContact", EmergencyContactSchema);
