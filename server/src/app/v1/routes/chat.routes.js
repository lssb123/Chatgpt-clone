import express from "express";
import {
  sendMessage,
  regenerateMessage,
  submitFeedback,
  updateSessionTitle,
  updateSelectedAnswer,
} from "../controllers/chat.controller.js";

const router = express.Router();

// Send a message to a specific chat session
router.post("/chat/regenerate/:sessionId/:messageId", regenerateMessage);
router.post("/chat/:messageId/:answerId", submitFeedback);
router.post("/chat/:sessionId", sendMessage);
router.put("/chat/:sessionId",updateSessionTitle)
router.put("/chat/:sessionId/:messageId/:direction", updateSelectedAnswer);

export default router;
