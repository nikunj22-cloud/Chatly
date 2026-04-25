import { X } from "lucide-react";
import { useState } from "react";
import axios from "axios";

const StatusModal = ({ isOpen, onClose }) => {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState(null); // "image" | "video" | null
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (!text && !file) {
      alert("Please add text or media");
      return;
    }

    const formData = new FormData();
    formData.append("text", text);
    if (file) formData.append("file", file);
    if (fileType) formData.append("type", fileType);

    try {
      setLoading(true);
      await axios.post("http://localhost:5000/api/status/upload", formData, {
        withCredentials: true,
      });
      setText("");
      setFile(null);
      setFileType(null);
      onClose();
    } catch (error) {
      console.error("Status upload failed:", error);
      console.error("Response:", error.response?.data);
      alert(error.response?.data?.message || "Failed to upload status");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0] || null;
    setFile(f);

    if (!f) {
      setFileType(null);
      return;
    }

    if (f.type.startsWith("image/")) {
      setFileType("image");
    } else if (f.type.startsWith("video/")) {
      setFileType("video");
    } else {
      setFileType(null);
      alert("Please select image or video");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-base-100 w-96 rounded-lg p-5 relative">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-zinc-400 hover:text-white"
        >
          <X />
        </button>

        <h2 className="text-lg font-semibold mb-4">Add Status</h2>

        <textarea
          placeholder="Write a status..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="textarea textarea-bordered w-full mb-3"
        />

        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="file-input file-input-bordered w-full mb-3"
        />

        <button
          onClick={handleUpload}
          disabled={loading}
          className={`btn btn-primary w-full mt-4 ${loading ? "loading" : ""}`}
        >
          {loading ? "Uploading..." : "Upload Status"}
        </button>
      </div>
    </div>
  );
};

export default StatusModal;
