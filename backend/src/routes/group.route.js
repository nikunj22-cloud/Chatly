import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createGroup,
  getUserGroups,
  getGroupMessages,
  sendGroupMessage,
  addGroupMember,
  removeGroupMember,
  leaveGroup,
  deleteGroup,
} from "../controllers/group.controller.js";

const router = express.Router();

// Group management
router.post("/create", protectRoute, createGroup);
router.get("/", protectRoute, getUserGroups);
router.post("/:groupId/add-member", protectRoute, addGroupMember);
router.delete(
  "/:groupId/remove-member/:memberId",
  protectRoute,
  removeGroupMember
);
router.post("/:groupId/leave", protectRoute, leaveGroup);
router.delete("/:groupId", protectRoute, deleteGroup);

// Group messages
router.get("/:groupId/messages", protectRoute, getGroupMessages);
router.post("/:groupId/send", protectRoute, sendGroupMessage);

export default router;
