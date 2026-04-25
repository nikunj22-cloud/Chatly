import mongoose from "mongoose";

const statusSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: { type: String, default: "" },
  mediaUrl: { type: String, default: "" },
  type: {
    type: String,
    enum: ["text", "image", "video"],
    default: "text",
  },
  createdAt: { type: Date, default: Date.now },
  expiresAt: {
    type: Date,
    default: () => Date.now() + 24 * 60 * 60 * 1000,
  },
  viewers: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      viewedAt: { type: Date, default: Date.now },
    },
  ],
});

const Status = mongoose.model("Status", statusSchema);

export default Status; // ✅ YEH ZAROORI H
