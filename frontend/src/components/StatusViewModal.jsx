import { useEffect } from "react";
import axios from "axios";

const StatusViewModal = ({ status, onClose }) => {
  if (!status) return null;

  // ✅ Mark status as viewed when modal opens
  useEffect(() => {
    if (!status?._id) return;

    axios
      .post(
        `https://chatly-v7tj.vercel.app/api/status/${status._id}/view`,
        {},
        { withCredentials: true }
      )
      .catch((err) => {
        console.error("Failed to mark status viewed", err);
      });
  }, [status?._id]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="relative max-w-sm w-full bg-base-100 rounded-lg p-4">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-zinc-400 hover:text-white"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-3">
          <img
            src={status.userId?.profilePic || "/avatar.png"}
            alt={status.userId?.fullName}
            className="size-10 rounded-full object-cover"
          />
          <div>
            <div className="font-medium text-sm">
              {status.userId?.fullName || "Unknown"}
            </div>
            <div className="text-xs text-zinc-400">
              {new Date(status.createdAt).toLocaleString()}
            </div>

            {/* Optional: seen count if status current user ka hai */}
            {status.viewers && (
              <div className="text-[11px] text-zinc-500 mt-1">
                Seen by {status.viewers.length}
              </div>
            )}
          </div>
        </div>

        {status.mediaUrl && status.type === "image" && (
          <img
            src={status.mediaUrl}
            alt="status"
            className="w-full rounded-lg object-contain max-h-80 mb-3"
          />
        )}

        {status.mediaUrl && status.type === "video" && (
          <video
            src={status.mediaUrl}
            className="w-full rounded-lg object-contain max-h-80 mb-3"
            controls
          />
        )}

        {status.text && (
          <p className="text-sm text-zinc-200 whitespace-pre-wrap">
            {status.text}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatusViewModal;
