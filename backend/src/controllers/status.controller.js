import Status from "../models/status.model.js";
import cloudinary from "../lib/cloudinary.js";

export const uploadStatus = async (req, res) => {
  try {
    const { text } = req.body;
    let mediaUrl = "";
    let type = "text";

    if (req.file) {
      const isImage = req.file.mimetype.startsWith("image/");
      const isVideo = req.file.mimetype.startsWith("video/");

      if (!isImage && !isVideo) {
        return res
          .status(400)
          .json({ message: "Only image or video files are allowed" });
      }

      const base64String = req.file.buffer.toString("base64");
      const prefix = isVideo
        ? "data:video/mp4;base64,"
        : "data:image/jpeg;base64,";

      const { secure_url } = await cloudinary.uploader.upload(
        prefix + base64String,
        {
          resource_type: isVideo ? "video" : "image",
        }
      );

      mediaUrl = secure_url;
      type = isVideo ? "video" : "image";
    }

    if (!text && !mediaUrl) {
      return res.status(400).json({ message: "Please add text or media" });
    }

    const status = await Status.create({
      userId: req.user._id,
      text: text || "",
      mediaUrl: mediaUrl || "",
      type,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      viewers: [], // ✅ Initialize empty viewers array
    });

    res.status(201).json(status);
  } catch (error) {
    console.error("Error creating status:", error);
    res.status(500).json({
      message: "Failed to create status",
      error: error.message,
    });
  }
};

export const getStatuses = async (req, res) => {
  try {
    const statuses = await Status.find()
      .populate("userId", "fullName profilePic")
      .populate("viewers.userId", "fullName profilePic") // ✅ Populate viewers
      .sort({ createdAt: -1 });

    res.status(200).json(statuses);
  } catch (error) {
    console.error("Error fetching statuses:", error);
    res.status(500).json({ message: "Failed to fetch statuses" });
  }
};

// ✅ NEW: Mark status as viewed
export const markStatusViewed = async (req, res) => {
  try {
    const statusId = req.params.id;
    const viewerId = req.user._id;

    const status = await Status.findById(statusId);
    if (!status) {
      return res.status(404).json({ message: "Status not found" });
    }

    // Check if already viewed
    const alreadyViewed = status.viewers.some(
      (v) => v.userId.toString() === viewerId.toString()
    );

    if (!alreadyViewed) {
      status.viewers.push({ userId: viewerId });
      await status.save();
    }

    res.status(200).json(status);
  } catch (error) {
    console.error("Error marking status viewed:", error);
    res.status(500).json({ message: "Failed to mark status viewed" });
  }
};

// ✅ NEW: Delete status
export const deleteStatus = async (req, res) => {
  try {
    const statusId = req.params.id;
    const userId = req.user._id;

    const status = await Status.findById(statusId);
    if (!status) {
      return res.status(404).json({ message: "Status not found" });
    }

    // Only owner can delete
    if (status.userId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Not allowed to delete this status" });
    }

    await Status.findByIdAndDelete(statusId);

    res.status(200).json({ message: "Status deleted successfully" });
  } catch (error) {
    console.error("Error deleting status:", error);
    res.status(500).json({ message: "Failed to delete status" });
  }
};
