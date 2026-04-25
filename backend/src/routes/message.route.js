import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
  reactToMessage,
  setTypingStatus, // ✅ ADD KAR
  markMessagesAsRead,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);
router.post("/react/:messageId", protectRoute, reactToMessage);

// ✅ NEW ROUTES
router.post("/typing/:receiverId", protectRoute, setTypingStatus);
router.post("/mark-read", protectRoute, markMessagesAsRead);

export default router;
