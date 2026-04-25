import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const { sendMessage, startTyping, stopTyping, selectedUser } = useChatStore();
  const { sendGroupMessage, selectedGroup } = useGroupStore();
  const typingTimeoutRef = useRef(null);

  // ✅ Handle typing
  const handleTextChange = (e) => {
    setText(e.target.value);

    if (selectedUser) {
      startTyping();

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 1000);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Please select an image or video file");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (file.type.startsWith("image/")) {
        setFileType("image");
        setImagePreview(reader.result);
        setVideoPreview(null);
      } else if (file.type.startsWith("video/")) {
        setFileType("video");
        setVideoPreview(reader.result);
        setImagePreview(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setImagePreview(null);
    setVideoPreview(null);
    setFileType(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !videoPreview) return;

    const mediaBase64 =
      imagePreview || videoPreview
        ? (imagePreview || videoPreview).split(",")[1]
        : null;

    setSending(true);
    setUploadProgress(10);

    try {
      if (selectedGroup) {
        // ✅ Group message
        await sendGroupMessage({
          text: text.trim(),
          media: mediaBase64,
          mediaType: fileType,
        });
      } else if (selectedUser) {
        // ✅ DM message
        await sendMessage({
          text: text.trim(),
          media: mediaBase64,
          mediaType: fileType,
        });
      }

      setText("");
      removeMedia();
      if (selectedUser) stopTyping();
      toast.success("Message sent!");
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="p-4 w-full">
      {(imagePreview || videoPreview) && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
              />
            )}
            {videoPreview && (
              <video
                src={videoPreview}
                className="w-32 h-20 object-cover rounded-lg border border-zinc-700"
                controls
              />
            )}
            <button
              onClick={removeMedia}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
          {sending && uploadProgress > 0 && (
            <div className="flex flex-col">
              <div className="w-24 bg-zinc-700 rounded-full h-1.5">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-xs text-zinc-400">{uploadProgress}%</span>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={handleTextChange}
            disabled={sending}
          />
          <input
            type="file"
            accept="image/*,video/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={sending}
          />
          <button
            type="button"
            className={`hidden sm:flex btn btn-circle transition-all duration-200 ${
              imagePreview || videoPreview
                ? "text-emerald-500 scale-110"
                : "text-zinc-400 hover:scale-110"
            }`}
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
          >
            <Image size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle transition-all duration-200 hover:scale-110"
          disabled={sending || (!text.trim() && !imagePreview && !videoPreview)}
        >
          {sending ? (
            <span className="loading loading-spinner"></span>
          ) : (
            <Send size={22} />
          )}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
