// backend/src/routes/status.route.js
import express from "express";
import multer from "multer";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  uploadStatus,
  getStatuses,
  markStatusViewed,
  deleteStatus,
} from "../controllers/status.controller.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

// Order: upload → protect → controller
router.post("/upload", upload.single("file"), protectRoute, uploadStatus);

router.get("/", protectRoute, getStatuses);

router.post("/:id/view", protectRoute, markStatusViewed);

// ✅ NEW: delete status
router.delete("/:id", protectRoute, deleteStatus);
export default router;
