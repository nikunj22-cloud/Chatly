import { useState } from "react";
import { X } from "lucide-react";
import { useGroupStore } from "../store/useGroupStore";
import { useChatStore } from "../store/useChatStore";

const GroupCreateModal = ({ isOpen, onClose }) => {
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { createGroup } = useGroupStore();
  const { users } = useChatStore();

  if (!isOpen) return null;

  const handleToggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) {
      alert("Group name and at least one member required");
      return;
    }

    setLoading(true);
    try {
      await createGroup(groupName, description, selectedMembers);
      setGroupName("");
      setDescription("");
      setSelectedMembers([]);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-base-100 w-96 rounded-lg p-5 relative max-h-[80vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-zinc-400 hover:text-white"
        >
          <X />
        </button>

        <h2 className="text-lg font-semibold mb-4">Create Group</h2>

        <input
          type="text"
          placeholder="Group name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="input input-bordered w-full mb-3"
        />

        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="textarea textarea-bordered w-full mb-3"
        />

        <p className="text-sm font-medium mb-2">Select members:</p>
        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
          {users.map((user) => (
            <label
              key={user._id}
              className="flex items-center gap-2 p-2 hover:bg-base-200 rounded"
            >
              <input
                type="checkbox"
                checked={selectedMembers.includes(user._id)}
                onChange={() => handleToggleMember(user._id)}
                className="checkbox checkbox-sm"
              />
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.fullName}
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="text-sm">{user.fullName}</span>
            </label>
          ))}
        </div>

        <button
          onClick={handleCreate}
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading ? "Creating..." : "Create Group"}
        </button>
      </div>
    </div>
  );
};

export default GroupCreateModal;
