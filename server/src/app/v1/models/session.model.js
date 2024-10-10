import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    sharable: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    userId: { type: String, required: true },
    title: { type: String, required: true },
  },
  { timestamps: true }
);

const Session = mongoose.model("Session", sessionSchema);

export default Session;
