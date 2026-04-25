import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Plus } from "lucide-react";
import StatusModal from "./StatusModal";
import StatusList from "./StatusList";
import GroupCreateModal from "./GroupCreateModal";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } =
    useChatStore();

  const {
    groups,
    isGroupsLoading,
    getGroups,
    setSelectedGroup,
    selectedGroup,
  } = useGroupStore();

  const { onlineUsers, authUser } = useAuthStore();

  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  useEffect(() => {
    getUsers();
    getGroups();
  }, []);

  const sortedUsers = users
    .sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || new Date(0);
      const bTime = b.lastMessage?.createdAt || new Date(0);
      return new Date(bTime) - new Date(aTime);
    })
    .filter((user) => (showOnlineOnly ? onlineUsers.includes(user._id) : true));

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <>
      <aside className="h-full w-20 lg:w-80 border-r border-base-300 flex flex-col transition-all duration-200 bg-gradient-to-b from-base-200 to-base-300">
        {/* TOP SECTION */}
        <div className="border-b border-base-300 w-full p-5">
          {/* MY STATUS */}
          <div
            className="flex items-center gap-3 mb-4 cursor-pointer hover:scale-105 transition-all duration-200"
            onClick={() => setIsStatusOpen(true)}
          >
            <div className="relative">
              <img
                src={authUser?.profilePic || "/avatar.png"}
                alt="My Status"
                className="size-12 rounded-full object-cover border-3 border-green-500 shadow-lg ring-2 ring-white/20"
              />
              <span className="absolute bottom-0 right-0 size-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full ring-3 ring-base-100 flex items-center justify-center text-white font-bold shadow-lg">
                +
              </span>
            </div>

            <div className="hidden lg:block">
              <p className="font-semibold text-sm">My Status</p>
              <p className="text-xs text-zinc-400">Tap to add status update</p>
            </div>
          </div>

          <StatusList />

          {/* CONTACTS HEADER */}
          <div className="flex items-center gap-2 mb-3 pt-3">
            <Users className="size-6 text-zinc-300" />
            <span className="font-semibold text-sm hidden lg:block">Chats</span>
          </div>

          {/* ONLINE FILTER */}
          <div className="hidden lg:flex items-center gap-2 mb-4 p-2 bg-base-300/50 rounded-lg">
            <label className="cursor-pointer flex items-center gap-2 flex-1">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="checkbox checkbox-sm checkbox-primary"
              />
              <span className="text-sm font-medium">Online only</span>
            </label>
            <div className="text-xs text-emerald-400 font-medium bg-emerald-500/20 px-2 py-1 rounded-full">
              {onlineUsers.length - 1} online
            </div>
          </div>
        </div>

        {/* USERS & GROUPS LIST */}
        <div className="flex-1 overflow-y-auto w-full py-2 px-1 scrollbar-thin scrollbar-thumb-zinc-600">
          {/* GROUPS SECTION */}
          {groups.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between px-4 py-2">
                <h3 className="text-xs font-bold text-zinc-400 uppercase">
                  Groups
                </h3>
                <button
                  onClick={() => setShowCreateGroupModal(true)}
                  className="btn btn-xs btn-circle btn-ghost"
                  title="Create Group"
                >
                  <Plus size={14} />
                </button>
              </div>

              {groups.map((group) => (
                <button
                  key={group._id}
                  onClick={() => {
                    setSelectedUser(null);
                    setSelectedGroup(group);
                  }}
                  className={`
                    w-full p-4 flex items-start gap-4 rounded-2xl mb-2 transition-all duration-200
                    hover:shadow-xl hover:scale-[1.02] hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10
                    ${
                      selectedGroup?._id === group._id
                        ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 ring-2 ring-purple-500/50 shadow-2xl scale-[1.02]"
                        : "hover:shadow-purple-500/25 bg-base-200/50"
                    }
                  `}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={group.groupPic || "/group-avatar.png"}
                      alt={group.name}
                      className="size-14 object-cover rounded-full ring-3 ring-white/30 shadow-lg"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col">
                    <p className="font-bold text-sm truncate">{group.name}</p>
                    <p className="text-xs text-zinc-400">
                      {group.members.length} members
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* CREATE GROUP BUTTON (if no groups) */}
          {groups.length === 0 && (
            <div className="p-4 mb-4">
              <button
                onClick={() => setShowCreateGroupModal(true)}
                className="btn btn-sm btn-primary w-full"
              >
                <Plus size={16} />
                Create Group
              </button>
            </div>
          )}

          {/* DIVIDER */}
          {groups.length > 0 && (
            <div className="border-t border-base-300 my-3"></div>
          )}

          {/* CONTACTS SECTION */}
          <div className="px-4 py-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase mb-3">
              Direct Messages
            </h3>
          </div>

          {sortedUsers.map((user) => {
            const isRecent = user.lastMessage;
            const unreadCount = user.unreadCount || 0;

            return (
              <button
                key={user._id}
                onClick={() => {
                  setSelectedUser(user);
                  setSelectedGroup(null);
                }}
                className={`
                  w-full p-4 flex items-start gap-4 rounded-2xl mb-2 transition-all duration-200
                  hover:shadow-xl hover:scale-[1.02] hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-emerald-500/10
                  ${
                    selectedUser?._id === user._id
                      ? "bg-gradient-to-r from-blue-500/20 to-emerald-500/20 ring-2 ring-blue-500/50 shadow-2xl scale-[1.02]"
                      : "hover:shadow-emerald-500/25 bg-base-200/50"
                  }
                `}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={user.profilePic || "/avatar.png"}
                    alt={user.fullName}
                    className="size-14 object-cover rounded-full ring-3 ring-white/30 shadow-lg hover:ring-blue-500/50 transition-all duration-200"
                  />
                  {onlineUsers.includes(user._id) && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-emerald-500 to-green-500 border-3 border-base-200 rounded-full shadow-lg animate-pulse"></div>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-sm truncate max-w-[140px] lg:max-w-[200px]">
                      {user.fullName}
                    </p>
                    {isRecent && (
                      <time className="text-xs text-zinc-400 ml-2 flex-shrink-0">
                        {new Date(
                          user.lastMessage.createdAt
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-xs text-zinc-400 truncate max-w-[140px] lg:max-w-[200px] font-medium">
                      {isRecent
                        ? (user.lastMessage.text?.slice(0, 25) || "Media") +
                          (user.lastMessage.text?.length > 25 ? "..." : "")
                        : "Say hi to start chatting!"}
                    </p>

                    {unreadCount > 0 && (
                      <div className="ml-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg min-w-[24px] h-6 flex items-center justify-center animate-bounce">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {sortedUsers.length === 0 && groups.length === 0 && (
            <div className="text-center text-zinc-500 py-12 px-4">
              <Users className="size-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No chats yet</p>
              <p className="text-xs mt-1">
                Start a conversation to see it here
              </p>
            </div>
          )}
        </div>

        {/* MODALS */}
        <StatusModal
          isOpen={isStatusOpen}
          onClose={() => setIsStatusOpen(false)}
        />
        <GroupCreateModal
          isOpen={showCreateGroupModal}
          onClose={() => setShowCreateGroupModal(false)}
        />
      </aside>
    </>
  );
};

export default Sidebar;
