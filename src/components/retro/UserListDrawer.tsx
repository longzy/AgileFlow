import { RetroUser } from "@/shared/retro";
import { X, User as UserIcon, Crown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  users: RetroUser[];
  hostId: string;
}

export function UserListDrawer({ isOpen, onClose, users, hostId }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-xl z-50 flex flex-col"
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                Users ({users.length})
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {users.map(user => {
                  const isHost = user.id === hostId;
                  return (
                    <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 relative">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-gray-500 font-medium text-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        {isHost && (
                          <div className="absolute -top-1 -right-1 bg-yellow-100 text-yellow-600 rounded-full p-0.5 border border-white shadow-sm" title="Host">
                            <Crown className="w-3 h-3 fill-yellow-600" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate">{user.name}</p>
                          {isHost && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-100">
                              Host
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">ID: {user.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
