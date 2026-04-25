import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useGroupStore = create((set, get) => ({
  groups: [],
  selectedGroup: null,
  groupMessages: [],
  isGroupsLoading: false,
  isGroupMessagesLoading: false,
  typingUser: null,

  // ✅ Get user's groups
  getGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data });
    } catch (error) {
      toast.error("Failed to load groups");
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  // ✅ Create group
  createGroup: async (name, description, memberIds) => {
    try {
      const res = await axiosInstance.post("/groups/create", {
        name,
        description,
        memberIds,
      });
      set({ groups: [...get().groups, res.data] });
      toast.success("Group created!");
      return res.data;
    } catch (error) {
      toast.error("Failed to create group");
    }
  },

  // ✅ Select group
  setSelectedGroup: (group) => {
    set({ selectedGroup: group });
    if (group) {
      get().getGroupMessages(group._id);
    }
  },

  // ✅ Get group messages
  getGroupMessages: async (groupId) => {
    set({ isGroupMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/groups/${groupId}/messages`);
      set({ groupMessages: res.data });
    } catch (error) {
      toast.error("Failed to load messages");
    } finally {
      set({ isGroupMessagesLoading: false });
    }
  },

  // ✅ Send group message
  sendGroupMessage: async (messageData) => {
    const { selectedGroup, groupMessages } = get();
    if (!selectedGroup) {
      toast.error("No group selected");
      return;
    }

    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: optimisticId,
      groupId: selectedGroup._id,
      senderId: useAuthStore.getState().authUser?._id,
      text: messageData.text || "",
      mediaUrl: messageData.media ? "uploading..." : null,
      mediaType: messageData.mediaType || null,
      sending: true,
      createdAt: new Date().toISOString(),
    };

    set({ groupMessages: [...groupMessages, optimisticMessage] });

    try {
      const res = await axiosInstance.post(
        `/groups/${selectedGroup._id}/send`,
        {
          text: messageData.text || "",
          media: messageData.media || null,
          mediaType: messageData.mediaType || null,
        }
      );

      const updatedMessages = groupMessages.map((msg) =>
        msg._id === optimisticId ? { ...res.data, sending: false } : msg
      );
      set({ groupMessages: updatedMessages });
    } catch (error) {
      const filteredMessages = groupMessages.filter(
        (msg) => msg._id !== optimisticId
      );
      set({ groupMessages: filteredMessages });
      toast.error("Failed to send message");
    }
  },

  // ✅ Add member to group
  addGroupMember: async (groupId, userId) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/add-member`, {
        userId,
      });
      set({ selectedGroup: res.data });
      toast.success("Member added!");
    } catch (error) {
      toast.error("Failed to add member");
    }
  },

  // ✅ Remove member from group
  removeGroupMember: async (groupId, memberId) => {
    try {
      const res = await axiosInstance.delete(
        `/groups/${groupId}/remove-member/${memberId}`
      );
      set({ selectedGroup: res.data });
      toast.success("Member removed!");
    } catch (error) {
      toast.error("Failed to remove member");
    }
  },

  // ✅ Leave group
  leaveGroup: async (groupId) => {
    try {
      await axiosInstance.post(`/groups/${groupId}/leave`);
      set({
        groups: get().groups.filter((g) => g._id !== groupId),
        selectedGroup: null,
      });
      toast.success("Left group");
    } catch (error) {
      toast.error("Failed to leave group");
    }
  },

  // ✅ Delete group
  deleteGroup: async (groupId) => {
    try {
      await axiosInstance.delete(`/groups/${groupId}`);
      set({
        groups: get().groups.filter((g) => g._id !== groupId),
        selectedGroup: null,
      });
      toast.success("Group deleted");
    } catch (error) {
      toast.error("Failed to delete group");
    }
  },

  // ✅ Subscribe to group messages
  subscribeToGroupMessages: () => {
    const { selectedGroup } = get();
    if (!selectedGroup) return;

    const socket = useAuthStore.getState().socket;

    socket.on("groupMessage", ({ groupId, message }) => {
      if (groupId === selectedGroup._id) {
        set({
          groupMessages: [...get().groupMessages, message],
        });
      }
    });

    return () => {
      socket.off("groupMessage");
    };
  },
}));
