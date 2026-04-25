import { useEffect, useState } from "react";
import axios from "axios";
import StatusViewModal from "./StatusViewModal";
import { useAuthStore } from "../store/useAuthStore";

const StatusList = () => {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState(null);
  const { authUser } = useAuthStore();

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/status", {
        withCredentials: true,
      });
      setStatuses(res.data || []);
      console.log("✅ Statuses fetched:", res.data.length);
    } catch (error) {
      console.error("❌ Error fetching statuses:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStatuses();
  }, []);

  // Auto refresh every 5s (WhatsApp style)
  useEffect(() => {
    const interval = setInterval(fetchStatuses, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading)
    return (
      <div className="flex items-center gap-3 p-3">
        <span className="loading loading-spinner loading-xs"></span>
        <p className="text-sm text-zinc-400">Loading statuses...</p>
      </div>
    );

  if (!statuses.length)
    return <p className="text-sm text-zinc-400 mt-3">No statuses yet</p>;

  return (
    <>
      <div className="mt-3 space-y-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
        {statuses.map((status) => (
          <button
            key={status._id}
            onClick={() => setActiveStatus(status)}
            className={`flex items-center gap-3 w-full text-left rounded-xl p-2 transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${
              status._id === activeStatus?._id
                ? "ring-2 ring-blue-500 bg-blue-500/10 scale-105 shadow-lg"
                : "hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-emerald-500/5"
            }`}
          >
            <div className="relative">
              <img
                src={status.userId?.profilePic || "/avatar.png"}
                alt={status.userId?.fullName}
                className="size-10 rounded-full object-cover ring-2 ring-white/50"
              />
              {/* Active status ring */}
              {status._id === activeStatus?._id && (
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full animate-pulse blur-xl opacity-50"></div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="font-medium text-xs truncate">
                {status.userId?.fullName || "Unknown"}
              </div>

              {/* Own status: seen count */}
              {status.userId?._id === authUser?._id && (
                <div className="text-[10px] text-emerald-400 font-medium bg-emerald-500/20 px-1.5 py-0.5 rounded-full mt-0.5">
                  Seen by {status.viewers?.length || 0}
                </div>
              )}

              {status.mediaUrl && status.type === "image" && (
                <span className="text-xs text-zinc-400">📷 Photo</span>
              )}
              {status.mediaUrl && status.type === "video" && (
                <span className="text-xs text-zinc-400">🎥 Video</span>
              )}
              {status.text && !status.mediaUrl && (
                <div className="text-xs text-zinc-300 truncate max-w-[150px] mt-0.5">
                  {status.text}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <StatusViewModal
        status={activeStatus}
        onClose={() => setActiveStatus(null)}
      />
    </>
  );
};

export default StatusList;
