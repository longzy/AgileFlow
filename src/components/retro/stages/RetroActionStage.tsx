import { RetroRoom, RetroUser } from "@/shared/retro";
import { useRetroStore } from "../../../store/useRetroStore";
import { CheckCircle, Circle, User, Calendar, ChevronDown, CheckCircle2 } from "lucide-react";
import { useState } from "react";

const getColumnColor = (column: string) => {
  const lower = column.toLowerCase();
  if (lower.includes('start') || lower.includes('well') || lower.includes('glad')) {
    return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
  }
  if (lower.includes('stop') || lower.includes('improve') || lower.includes('mad')) {
    return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
  }
  return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
};

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
    });
    setEditingId(null);
  };

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto w-full min-h-0">
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
              const card = room.cards.find(c => c.id === action.cardId);
              const column = card?.column || "General";
              const colors = getColumnColor(column);

              return (
                <div 
                  key={action.id} 
                  className={`p-5 rounded-2xl border transition-all ${
                    isDone 
                      ? "bg-emerald-50/30 border-emerald-100" 
                      : "bg-white border-gray-100 shadow-sm hover:shadow-md"
                  } flex items-start group`}
                >
                  <div className="flex-1 min-w-0">
                    {editingId === action.id ? (
                      <div className="space-y-4">
                        <div className="relative">
                          <textarea
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value.slice(0, 200))}
                            className="w-full p-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-sm"
                            rows={2}
                            autoFocus
                          />
                          <div className="absolute bottom-2 right-2 text-[10px] text-gray-400">
                            {editDesc.length}/200
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
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors.bg} ${colors.text} border ${colors.border}`}>
                            {column}
                          </span>
                        </div>
                        <p className={`text-base font-medium leading-relaxed ${isDone ? 'line-through text-gray-400' : 'text-gray-900 group-hover:text-blue-600 transition-colors'}`}>
                          {action.description}
                        </p>
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
