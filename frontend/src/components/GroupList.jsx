import { useEffect, useState } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { Users, Plus } from "lucide-react";
import GroupCreateModal from "./GroupCreateModal";

const GroupList = () => {
  const {
    groups,
    isGroupsLoading,
    getGroups,
    setSelectedGroup,
    selectedGroup,
  } = useGroupStore();
  const { authUser } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    getGroups();
  }, []);

  if (isGroupsLoading) {
    return <div className="p-4 text-zinc-400">Loading groups...</div>;
  }

  return (
    <div className="border-t border-base-300 p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="size-5" />
          <span className="font-semibold text-sm">Groups</span>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-xs btn-circle btn-ghost"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {groups.map((group) => (
          <button
            key={group._id}
            onClick={() => setSelectedGroup(group)}
            className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
              selectedGroup?._id === group._id
                ? "bg-base-300 ring-1 ring-base-300"
                : "hover:bg-base-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <img
                src={group.groupPic || "/group-avatar.png"}
                alt={group.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{group.name}</p>
                <p className="text-xs text-zinc-400 truncate">
                  {group.members.length} members
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <GroupCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};

export default GroupList;
