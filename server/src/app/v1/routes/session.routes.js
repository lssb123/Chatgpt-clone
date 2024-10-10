import express from "express";
import {
  createSession,
  deleteDuplicate,
  deleteSession,
  getAllSessionsByUser,
  getSessionHistory,
  getTitleHistory,
  updateSession,
} from "../controllers/session.controller.js";
const router = express.Router();

router.route("/session/new").post(createSession);
// router.route("/session/share/:sessionId").get(createShareableSession)
router.route("/session").get(getTitleHistory)
router.route("/session/:sessionId").get(getSessionHistory);
router.route("/session/deleteSession").delete(deleteSession);
router.route("/session/:sessionId").put(updateSession)
router.route("/session").delete(deleteDuplicate);

router.route("/sessions/:userId").get(getAllSessionsByUser)
export default router;
