import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // ✅ SIMPLIFIED VERSION - Works 100%
    const users = await User.find({ _id: { $ne: loggedInUserId } })
      .select("-password")
      .lean();

    // Add last message info (simple approach)
    const usersWithLastMessage = await Promise.all(
      users.map(async (user) => {
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: loggedInUserId, receiverId: user._id },
            { senderId: user._id, receiverId: loggedInUserId },
          ],
        })
          .sort({ createdAt: -1 })
          .select("text createdAt mediaType")
          .lean();

        return {
          ...user,
          lastMessage: lastMessage || null,
          unreadCount: 0, // TODO: implement later
        };
      })
    );

    // Sort by recent chats
    usersWithLastMessage.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || new Date(0);
      const bTime = b.lastMessage?.createdAt || new Date(0);
      return new Date(bTime) - new Date(aTime);
    });

    res.status(200).json(usersWithLastMessage);
  } catch (error) {
    console.error("Error in getUsersForSidebar:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, media, mediaType } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let mediaUrl = null;
    let finalMediaType = mediaType || null;

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

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: mediaType === "image" ? mediaUrl : null,
      mediaUrl: mediaUrl,
      mediaType: finalMediaType,
    });

    await newMessage.save();

    // ✅ STEP 1: REAL-TIME SIDEBAR REFRESH FOR ALL USERS
    io.emit("refreshSidebar");

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    message.reactions = message.reactions.filter(
      (r) => r.userId.toString() !== userId.toString()
    );

    message.reactions.push({ userId, emoji });

    await message.save();

    const receiverSocketId = getReceiverSocketId(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageReactionUpdated", {
        messageId,
        reactions: message.reactions,
      });
    }

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in reactToMessage:", error.message);
    res.status(500).json({ message: "Failed to react" });
  }
};
// ✅ STEP 2: Typing Indicator
export const setTypingStatus = async (req, res) => {
  try {
    const { receiverId, isTyping } = req.body;
    const senderId = req.user._id;

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", {
        senderId,
        isTyping,
      });
    }

    res.status(200).json({ message: "Typing status sent" });
  } catch (error) {
    console.error("Typing error:", error);
    res.status(500).json({ error: "Failed to update typing status" });
  }
};

// ✅ STEP 3: Mark Messages as Read
export const markMessagesAsRead = async (req, res) => {
  try {
    const { senderId } = req.body;
    const userId = req.user._id;

    await Message.updateMany(
      {
        senderId: senderId,
        receiverId: userId,
        isRead: false,
      },
      { isRead: true }
    );

    // Notify sender that messages are read
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesRead", {
        userId,
        senderId,
      });
    }

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Mark read error:", error);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
};
