import { useState } from "react";
import { useRetroStore } from "../../store/useRetroStore";
import { Users } from "lucide-react";
import { UserListDrawer } from "./UserListDrawer";

export function RetroHeaderUsers() {
  const { onlineUsers, room } = useRetroStore();
  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false);

  if (!room) return null;

  return (
    <>
      <button
        onClick={() => setIsUserDrawerOpen(true)}
        className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors text-gray-600 font-medium text-sm shrink-0"
        title="View Users"
      >
        <Users className="w-4 h-4" />
        <span className="hidden sm:inline">Users ({onlineUsers?.length || 0})</span>
        <span className="sm:hidden">{onlineUsers?.length || 0}</span>
      </button>

      <UserListDrawer 
        isOpen={isUserDrawerOpen} 
        onClose={() => setIsUserDrawerOpen(false)} 
        users={onlineUsers || []} 
        hostId={room.hostId}
      />
    </>
  );
}
