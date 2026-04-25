import Group from "../models/group.model.js";
import GroupMessage from "../models/groupMessage.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// ✅ Create Group
export const createGroup = async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;
    const createdBy = req.user._id;

    if (!name || !memberIds || memberIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Group name and members required" });
    }

    const members = [
      { userId: createdBy, role: "admin" },
      ...memberIds.map((id) => ({ userId: id, role: "member" })),
    ];

    const group = await Group.create({
      name,
      description: description || "",
      createdBy,
      members,
      admins: [createdBy],
    });

    const populatedGroup = await group.populate([
      "members.userId",
      "createdBy",
      "admins",
    ]);

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error("Create group error:", error);
    res.status(500).json({ error: "Failed to create group" });
  }
};

// ✅ Get User's Groups
export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await Group.find({
      "members.userId": userId,
    })
      .populate("members.userId", "fullName profilePic")
      .populate("createdBy", "fullName profilePic")
      .sort({ "lastMessage.createdAt": -1 });

    res.status(200).json(groups);
  } catch (error) {
    console.error("Get groups error:", error);
    res.status(500).json({ error: "Failed to fetch groups" });
  }
};

// ✅ Get Group Messages
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;

    const messages = await GroupMessage.find({ groupId })
      .populate("senderId", "fullName profilePic")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Get group messages error:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// ✅ Send Group Message
export const sendGroupMessage = async (req, res) => {
  try {
    const { text, media, mediaType } = req.body;
    const { groupId } = req.params;
    const senderId = req.user._id;

    let mediaUrl = null;

    if (media && media.startsWith("http")) {
      mediaUrl = media;
    } else if (media && media.trim() !== "" && mediaType) {
      const prefix =
        mediaType === "image"
          ? "data:image/jpeg;base64,"
          : "data:video/mp4;base64,";

      const uploadResponse = await cloudinary.uploader.upload(prefix + media, {
        resource_type: mediaType === "video" ? "video" : "image",
      });
      mediaUrl = uploadResponse.secure_url;
    }

    const message = await GroupMessage.create({
      groupId,
      senderId,
      text,
      mediaUrl,
      mediaType,
    }).then((msg) => msg.populate("senderId", "fullName profilePic"));

    // Update group lastMessage
    await Group.findByIdAndUpdate(groupId, {
      lastMessage: {
        text: text || `${mediaType || "Media"}`,
        sender: senderId,
        createdAt: new Date(),
      },
    });

    // Emit to all group members
    io.emit("groupMessage", { groupId, message });

    res.status(201).json(message);
  } catch (error) {
    console.error("Send group message error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// ✅ Add Member to Group
export const addGroupMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const requesterId = req.user._id;

    const group = await Group.findById(groupId);

    // Check if requester is admin
    if (!group.admins.includes(requesterId)) {
      return res.status(403).json({ message: "Only admins can add members" });
    }

    // Check if user already member
    if (group.members.some((m) => m.userId.toString() === userId)) {
      return res.status(400).json({ message: "User already in group" });
    }

    group.members.push({ userId, role: "member" });
    await group.save();

    const updatedGroup = await group.populate("members.userId");

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("Add member error:", error);
    res.status(500).json({ error: "Failed to add member" });
  }
};

// ✅ Remove Member from Group
export const removeGroupMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const requesterId = req.user._id;

    const group = await Group.findById(groupId);

    // Check if requester is admin
    if (!group.admins.includes(requesterId)) {
      return res
        .status(403)
        .json({ message: "Only admins can remove members" });
    }

    group.members = group.members.filter(
      (m) => m.userId.toString() !== memberId
    );
    group.admins = group.admins.filter((a) => a.toString() !== memberId);

    await group.save();

    const updatedGroup = await group.populate("members.userId");

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("Remove member error:", error);
    res.status(500).json({ error: "Failed to remove member" });
  }
};

// ✅ Leave Group
export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);

    group.members = group.members.filter(
      (m) => m.userId.toString() !== userId.toString()
    );
    group.admins = group.admins.filter(
      (a) => a.toString() !== userId.toString()
    );

    // If no members left, delete group
    if (group.members.length === 0) {
      await Group.findByIdAndDelete(groupId);
      return res.status(200).json({ message: "Group deleted" });
    }

    // If creator left, make first member admin
    if (!group.admins.length && group.members.length > 0) {
      group.admins.push(group.members[0].userId);
    }

    await group.save();

    res.status(200).json({ message: "Left group" });
  } catch (error) {
    console.error("Leave group error:", error);
    res.status(500).json({ error: "Failed to leave group" });
  }
};

// ✅ Delete Group (admin only)
export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);

    if (!group.admins.includes(userId)) {
      return res.status(403).json({ message: "Only admins can delete group" });
    }

    await Group.findByIdAndDelete(groupId);
    await GroupMessage.deleteMany({ groupId });

    res.status(200).json({ message: "Group deleted" });
  } catch (error) {
    console.error("Delete group error:", error);
    res.status(500).json({ error: "Failed to delete group" });
  }
};
