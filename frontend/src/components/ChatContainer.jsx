import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    reactToMessage,
    subscribeToReactions,
    unsubscribeFromReactions,
    typingUser, // ✅ NEW: Typing user
  } = useChatStore();

  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [showReactions, setShowReactions] = useState(null);

  useEffect(() => {
    if (!selectedUser) return;

    getMessages(selectedUser._id);
    subscribeToMessages();
    subscribeToReactions();

    return () => {
      unsubscribeFromMessages();
      unsubscribeFromReactions();
    };
  }, [selectedUser?._id]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700">
        {messages.map((message, index) => (
          <div
            key={message._id}
            className={`chat transform transition-all duration-200 ease-out ${
              message.senderId === authUser._id
                ? "chat-end animate-slideInUp"
                : "chat-start animate-slideInUp-reverse"
            } ${
              message.sending
                ? "opacity-70 scale-[0.98]"
                : "hover:scale-[1.01] hover:shadow-lg"
            }`}
            ref={index === messages.length - 1 ? messageEndRef : null}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>

            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>

            {/* ✅ GROUP CLASS ADDED HERE */}
            <div className="chat-bubble flex flex-col relative p-3 shadow-lg group">
              {/* ✅ Sending indicator */}
              {message.sending && (
                <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2 pb-1 border-b border-zinc-700">
                  <span className="loading loading-spinner loading-xs"></span>
                  <span>Sending...</span>
                </div>
              )}

              {/* ✅ Uploading media indicator */}
              {message.mediaUrl === "uploading..." && message.mediaType && (
                <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2 pb-1 border-b border-zinc-700">
                  <span className="loading loading-spinner loading-xs"></span>
                  <span>Uploading {message.mediaType}...</span>
                </div>
              )}

              {/* Image */}
              {message.mediaUrl &&
                message.mediaType === "image" &&
                !message.sending && (
                  <img
                    src={message.mediaUrl}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2 cursor-pointer hover:scale-105 transition-transform duration-200"
                  />
                )}

              {/* Video */}
              {message.mediaUrl &&
                message.mediaType === "video" &&
                !message.sending && (
                  <video
                    src={message.mediaUrl}
                    className="sm:max-w-[220px] rounded-md mb-2"
                    controls
                    preload="metadata"
                  />
                )}

              {/* Legacy image */}
              {!message.mediaUrl && message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}

              {message.text && (
                <p className="whitespace-pre-wrap break-words">
                  {message.text}
                </p>
              )}

              {/* ✅ NEW: Read receipt tick */}
              {message.senderId === authUser._id && (
                <div className="text-xs mt-1 self-end">
                  {message.isRead ? (
                    <span className="text-blue-400 font-medium">✓✓ Read</span>
                  ) : (
                    <span className="text-zinc-400">✓ Sent</span>
                  )}
                </div>
              )}

              {/* Emoji picker */}
              {showReactions === message._id && (
                <div className="flex gap-2 absolute -top-10 left-0 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-2xl z-20 border">
                  {["👍", "❤️", "😂", "😮", "😢", "👎"].map((emoji) => (
                    <span
                      key={emoji}
                      className="cursor-pointer text-lg hover:scale-125 transition-transform duration-150 p-1 rounded"
                      onClick={() => {
                        reactToMessage(message._id, emoji);
                        setShowReactions(null);
                      }}
                    >
                      {emoji}
                    </span>
                  ))}
                </div>
              )}

              {/* Reactions */}
              <div className="flex gap-1 mt-2 pt-1 border-t border-zinc-700">
                {message.reactions?.map((r) => (
                  <span key={`${r.userId}-${r.emoji}`} className="text-sm">
                    {r.emoji}
                  </span>
                ))}
              </div>

              {/* ✅ HOVER-ONLY REACTION BUTTON */}
              {!message.sending && (
                <div
                  className={`
                    absolute top-2 right-2 w-8 h-8 flex items-center justify-center 
                    bg-gradient-to-br from-black/60 to-black/40 
                    hover:from-black/80 hover:to-black/60 rounded-full cursor-pointer 
                    transition-all duration-300 ease-out group-hover:opacity-100 
                    opacity-0 hover:opacity-100 hover:scale-110
                    backdrop-blur-sm shadow-2xl border border-white/30 
                    hover:border-white/50 hover:shadow-emerald-500/25
                  `}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReactions(
                      showReactions === message._id ? null : message._id
                    );
                  }}
                >
                  <span className="text-sm drop-shadow-md">😊</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* ✅ NEW: Typing indicator */}
        {typingUser && typingUser === selectedUser?._id && (
          <div className="chat chat-start animate-slideInUp-reverse">
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={selectedUser?.profilePic || "/avatar.png"}
                  alt="typing"
                />
              </div>
            </div>
            <div className="chat-bubble bg-base-300/50">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
