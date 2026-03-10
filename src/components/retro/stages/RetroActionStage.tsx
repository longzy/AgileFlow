import { RetroRoom, RetroUser } from "@/shared/retro";
import { useRetroStore } from "../../../store/useRetroStore";
import { CheckCircle, Circle, User, Calendar, ChevronDown, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface Props {
  room: RetroRoom;
  isHost: boolean;
}

export function RetroActionStage({ room, isHost }: Props) {
  const { updateAction, onlineUsers } = useRetroStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editOwnerId, setEditOwnerId] = useState("");
  const [editDate, setEditDate] = useState("");

  // Combine room.users and onlineUsers to ensure we have a complete list
  // even for rooms created before user persistence was added
  const allUsers = [...(room.users || [])];
  onlineUsers?.forEach(ou => {
    if (!allUsers.find(u => u.id === ou.id)) {
      allUsers.push(ou);
    }
  });

  const handleEdit = (action: any) => {
    if (!isHost) return;
    setEditingId(action.id);
    setEditDesc(action.description);
    setEditOwnerId(action.owner || "");
    setEditDate(action.dueDate || "");
  };

  const handleSave = (actionId: string) => {
    updateAction(actionId, {
      description: editDesc,
      owner: editOwnerId,
      dueDate: editDate,
    });
    setEditingId(null);
  };

  const toggleStatus = (actionId: string, currentStatus: string) => {
    if (!isHost) return;
    updateAction(actionId, {
      status: currentStatus === "todo" ? "done" : "todo"
    });
  };

  const getUserById = (userId: string) => {
    return allUsers.find(u => u.id === userId);
  };

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Action Points</h2>
        <p className="text-gray-500 text-sm mt-1">Top voted items have been converted to action points.</p>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        <div className="space-y-4">
          {room.actionPoints.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No action points</h3>
              <p className="text-gray-500 text-sm">No action points were generated from the voting stage.</p>
            </div>
          ) : (
            room.actionPoints.map(action => {
              const isDone = action.status === "done";
              return (
                <div 
                  key={action.id} 
                  className={`p-5 rounded-2xl border transition-all ${
                    isDone 
                      ? "bg-emerald-50/30 border-emerald-100" 
                      : "bg-white border-gray-100 shadow-sm hover:shadow-md"
                  } flex gap-4 items-start group`}
                >
                  <button 
                    onClick={() => toggleStatus(action.id, action.status)}
                    disabled={!isHost}
                    className={`mt-1 flex-shrink-0 transition-transform ${isHost ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-300 group-hover:text-gray-400 transition-colors" />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    {editingId === action.id ? (
                      <div className="space-y-4">
                        <textarea
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="w-full p-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-sm"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="flex-1 relative">
                            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 w-full focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-shadow">
                              <User className="w-4 h-4 text-gray-400" />
                              <select
                                value={editOwnerId}
                                onChange={(e) => setEditOwnerId(e.target.value)}
                                className="flex-1 outline-none text-sm bg-transparent appearance-none cursor-pointer"
                              >
                                <option value="">Unassigned</option>
                                {allUsers.map(user => (
                                  <option key={user.id} value={user.id}>
                                    {user.name}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="w-4 h-4 text-gray-400 pointer-events-none absolute right-3" />
                            </div>
                          </div>
                          <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-shadow">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <input 
                              type="date" 
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="flex-1 outline-none text-sm bg-transparent"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <button 
                            onClick={() => setEditingId(null)} 
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => handleSave(action.id)} 
                            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                          >
                            Save Action
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className={`${isHost ? 'cursor-pointer' : ''}`}
                        onClick={() => handleEdit(action)}
                      >
                        <p className={`text-base font-medium mb-4 leading-relaxed ${isDone ? 'line-through text-gray-400' : 'text-gray-900 group-hover:text-blue-600 transition-colors'}`}>
                          {action.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          {action.owner ? (
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isDone ? 'bg-gray-100' : 'bg-blue-50'}`}>
                              <div className="w-5 h-5 rounded-full bg-white overflow-hidden flex items-center justify-center shadow-sm">
                                {getUserById(action.owner)?.avatar ? (
                                  <img src={getUserById(action.owner)?.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-[10px] font-bold text-gray-500">
                                    {getUserById(action.owner)?.name?.charAt(0).toUpperCase() || "?"}
                                  </span>
                                )}
                              </div>
                              <span className={`font-medium ${isDone ? 'text-gray-500' : 'text-blue-700'}`}>
                                {getUserById(action.owner)?.name || "Unknown User"}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100">
                              <User className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-gray-500 font-medium text-xs uppercase tracking-wider">Unassigned</span>
                            </div>
                          )}
                          
                          {action.dueDate && (
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${isDone ? 'bg-gray-100 text-gray-500' : 'bg-orange-50 text-orange-700'}`}>
                              <Calendar className="w-3.5 h-3.5" />
                              <span className="font-medium">{action.dueDate}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
