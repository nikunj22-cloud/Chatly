import { useEffect, useRef, useState } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { X, Users } from "lucide-react";
import MessageInput from "./MessageInput";

const GroupChatContainer = () => {
  const {
    selectedGroup,
    groupMessages,
    isGroupMessagesLoading,
    sendGroupMessage,
    removeGroupMember,
    leaveGroup,
    deleteGroup,
  } = useGroupStore();

  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [groupMessages]);

  if (!selectedGroup) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-400">
        Select a group to start chatting
      </div>
    );
  }

  const isAdmin = selectedGroup.admins.some(
    (admin) => admin._id === authUser._id
  );

  const handleSendMessage = async (messageData) => {
    await sendGroupMessage(messageData);
  };

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      {/* Header */}
      <div className="border-b border-base-300 p-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">{selectedGroup.name}</h2>
          <p className="text-xs text-zinc-400">
            {selectedGroup.members.length} members
          </p>
        </div>
        <button
          onClick={() => setShowMembers(!showMembers)}
          className="btn btn-sm btn-ghost btn-circle"
        >
          <Users size={20} />
        </button>
      </div>

      {/* Members Sidebar */}
      {showMembers && (
        <div className="border-b border-base-300 p-4 max-h-48 overflow-y-auto">
          <h3 className="font-medium mb-3">
            Members ({selectedGroup.members.length})
          </h3>
          <div className="space-y-2">
            {selectedGroup.members.map((member) => (
              <div
                key={member.userId._id}
                className="flex items-center justify-between p-2 hover:bg-base-300 rounded"
              >
                <div className="flex items-center gap-2">
                  <img
                    src={member.userId.profilePic || "/avatar.png"}
                    alt={member.userId.fullName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm">{member.userId.fullName}</p>
                    {member.role === "admin" && (
                      <p className="text-xs text-emerald-400">Admin</p>
                    )}
                  </div>
                </div>
                {isAdmin && member.userId._id !== authUser._id && (
                  <button
                    onClick={() =>
                      removeGroupMember(selectedGroup._id, member.userId._id)
                    }
                    className="btn btn-xs btn-ghost text-red-400"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Group Actions */}
          <div className="mt-4 pt-4 border-t border-base-300 space-y-2">
            {isAdmin && (
              <button
                onClick={() => deleteGroup(selectedGroup._id)}
                className="btn btn-sm btn-error w-full"
              >
                Delete Group
              </button>
            )}
            <button
              onClick={() => leaveGroup(selectedGroup._id)}
              className="btn btn-sm btn-outline w-full"
            >
              Leave Group
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isGroupMessagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <span className="loading loading-spinner"></span>
          </div>
        ) : (
          groupMessages.map((message) => (
            <div
              key={message._id}
              className={`chat ${
                message.senderId._id === authUser._id
                  ? "chat-end"
                  : "chat-start"
              }`}
              ref={messageEndRef}
            >
              <div className="chat-image avatar">
                <img
                  src={message.senderId.profilePic || "/avatar.png"}
                  alt={message.senderId.fullName}
                  className="w-10 h-10 rounded-full"
                />
              </div>

              <div>
                <p className="text-xs font-semibold mb-1">
                  {message.senderId.fullName}
                </p>
                <div className="chat-bubble">
                  {message.mediaUrl && message.mediaType === "image" && (
                    <img
                      src={message.mediaUrl}
                      alt="image"
                      className="sm:max-w-[200px] rounded-md mb-2"
                    />
                  )}
                  {message.mediaUrl && message.mediaType === "video" && (
                    <video
                      src={message.mediaUrl}
                      className="sm:max-w-[220px] rounded-md mb-2"
                      controls
                    />
                  )}
                  {message.text && <p>{message.text}</p>}
                </div>
                <time className="text-xs opacity-50">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <MessageInput onSendMessage={handleSendMessage} isGroup={true} />
    </div>
  );
};

export default GroupChatContainer;
