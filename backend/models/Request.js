const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    ticketNo: { type: Number, unique: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    email: { type: String, required: true },
    status: { type: String, enum: ["Open", "In Progress", "Closed"], default: "Open" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Request", requestSchema);
