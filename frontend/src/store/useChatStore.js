import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  typingUser: null, // ✅ NEW: Typing status
  typingTimeout: null, // ✅ NEW: Typing timeout

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });

      // ✅ Mark messages as read
      await axiosInstance.post("/messages/mark-read", {
        senderId: userId,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    if (!selectedUser) {
      toast.error("No user selected");
      return;
    }

    // Stop typing when sending
    get().stopTyping();

    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: optimisticId,
      senderId: useAuthStore.getState().authUser?._id,
      receiverId: selectedUser._id,
      text: messageData.text || "",
      mediaUrl: messageData.media ? "uploading..." : null,
      mediaType: messageData.mediaType || null,
      sending: true,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    set({ messages: [...messages, optimisticMessage] });

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        {
          text: messageData.text || "",
          media: messageData.media || null,
          mediaType: messageData.mediaType || null,
        }
      );

      const updatedMessages = messages.map((msg) =>
        msg._id === optimisticId ? { ...res.data, sending: false } : msg
      );
      set({ messages: updatedMessages });
    } catch (error) {
      const filteredMessages = messages.filter(
        (msg) => msg._id !== optimisticId
      );
      set({ messages: filteredMessages });
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  // ✅ NEW: Start typing
  startTyping: async () => {
    const { selectedUser, typingTimeout } = get();
    if (!selectedUser) return;

    // Clear previous timeout
    if (typingTimeout) clearTimeout(typingTimeout);

    // Send typing status
    try {
      await axiosInstance.post(`/messages/typing/${selectedUser._id}`, {
        isTyping: true,
      });
    } catch (error) {
      console.error("Typing error:", error);
    }

    // Auto stop typing after 3 seconds
    const timeout = setTimeout(() => {
      get().stopTyping();
    }, 3000);

    set({ typingTimeout: timeout });
  },

  // ✅ NEW: Stop typing
  stopTyping: async () => {
    const { selectedUser, typingTimeout } = get();
    if (!selectedUser) return;

    if (typingTimeout) clearTimeout(typingTimeout);

    try {
      await axiosInstance.post(`/messages/typing/${selectedUser._id}`, {
        isTyping: false,
      });
    } catch (error) {
      console.error("Stop typing error:", error);
    }

    set({ typingUser: null, typingTimeout: null });
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser =
        newMessage.senderId === selectedUser._id ||
        newMessage.receiverId === selectedUser._id;

      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });

    socket.on("refreshSidebar", () => {
      get().getUsers();
    });

    // ✅ NEW: Listen to typing
    socket.on("typing", ({ senderId, isTyping }) => {
      if (isTyping) {
        set({ typingUser: senderId });
      } else {
        set({ typingUser: null });
      }
    });

    // ✅ NEW: Listen to read receipts
    socket.on("messagesRead", ({ userId }) => {
      const updatedMessages = get().messages.map((msg) =>
        msg.receiverId === userId ? { ...msg, isRead: true } : msg
      );
      set({ messages: updatedMessages });
    });

    return () => {
      socket.off("newMessage");
      socket.off("refreshSidebar");
      socket.off("typing");
      socket.off("messagesRead");
    };
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("refreshSidebar");
    socket.off("typing");
    socket.off("messagesRead");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),

  subscribeToProfileUpdates: () => {
    const socket = useAuthStore.getState().socket;

    socket.on("profile-updated", ({ userId, profilePic }) => {
      const { users, selectedUser } = get();

      const updatedUsers = users.map((user) =>
        user._id === userId ? { ...user, profilePic } : user
      );

      set({ users: updatedUsers });

      if (selectedUser && selectedUser._id === userId) {
        set({
          selectedUser: { ...selectedUser, profilePic },
        });
      }
    });
  },

  unsubscribeFromProfileUpdates: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("profile-updated");
  },

  subscribeToReactions: () => {
    const socket = useAuthStore.getState().socket;

    socket.on("messageReaction", (updatedMessage) => {
      const messages = get().messages.map((msg) =>
        msg._id === updatedMessage._id ? updatedMessage : msg
      );
      set({ messages });
    });
  },

  unsubscribeFromReactions: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("messageReaction");
  },

  reactToMessage: async (messageId, emoji) => {
    const { messages } = get();
    const socket = useAuthStore.getState().socket;

    try {
      const res = await axiosInstance.post(`/messages/react/${messageId}`, {
        emoji,
      });

      const updatedMessages = messages.map((msg) =>
        msg._id === messageId ? res.data : msg
      );
      set({ messages: updatedMessages });

      socket.emit("messageReaction", res.data);
    } catch (error) {
      console.error("React to message error:", error);
      toast.error(
        error.response?.data?.message || "Failed to react to message"
      );
    }
  },
}));
