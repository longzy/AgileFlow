import { RetroRoom, RetroUser } from "@/shared/retro";
import { useRetroStore } from "../../../stores/useRetroStore";
import { CheckCircle, Circle, User, Calendar, ChevronDown } from "lucide-react";
import { useState } from "react";

interface Props {
  room: RetroRoom;
  isHost: boolean;
}

export function RetroActionStage({ room, isHost }: Props) {
  const { updateAction } = useRetroStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editOwnerId, setEditOwnerId] = useState("");
  const [editDate, setEditDate] = useState("");

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
    return room.users?.find(u => u.id === userId);
  };

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto w-full">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Action Points</h2>
        <p className="text-gray-500">Top voted items have been converted to action points.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1">
        <div className="p-6 space-y-4">
          {room.actionPoints.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No action points generated.
            </div>
          ) : (
            room.actionPoints.map(action => (
              <div key={action.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50 flex gap-4 items-start">
                <button 
                  onClick={() => toggleStatus(action.id, action.status)}
                  disabled={!isHost}
                  className={`mt-1 flex-shrink-0 ${isHost ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  {action.status === "done" ? (
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-300" />
                  )}
                </button>
                
                <div className="flex-1">
                  {editingId === action.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                        rows={2}
                      />
                      <div className="flex gap-4">
                        <div className="flex-1 relative">
                          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 w-full">
                            <User className="w-4 h-4 text-gray-400" />
                            <select
                              value={editOwnerId}
                              onChange={(e) => setEditOwnerId(e.target.value)}
                              className="flex-1 outline-none text-sm bg-transparent appearance-none cursor-pointer"
                            >
                              <option value="">Unassigned</option>
                              {room.users?.map(user => (
                                <option key={user.id} value={user.id}>
                                  {user.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-gray-400 pointer-events-none absolute right-3" />
                          </div>
                        </div>
                        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <input 
                            type="date" 
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="flex-1 outline-none text-sm bg-transparent"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                        <button 
                          onClick={() => setEditingId(null)} 
                          className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleSave(action.id)} 
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className={`group ${isHost ? 'cursor-pointer' : ''}`}
                      onClick={() => handleEdit(action)}
                    >
                      <p className={`text-gray-900 font-medium mb-3 ${action.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                        {action.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          {action.owner ? (
                            <>
                              <div className="w-5 h-5 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                                {getUserById(action.owner)?.avatar ? (
                                  <img src={getUserById(action.owner)?.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-[10px] font-bold text-gray-500">
                                    {getUserById(action.owner)?.name?.charAt(0).toUpperCase() || "?"}
                                  </span>
                                )}
                              </div>
                              <span className="font-medium text-gray-700">
                                {getUserById(action.owner)?.name || "Unknown User"}
                              </span>
                            </>
                          ) : (
                            <>
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-400 italic">Unassigned</span>
                            </>
                          )}
                        </div>
                        {action.dueDate && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{action.dueDate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
