import { useState } from "react";
import { RetroRoom, RetroUser } from "@/shared/retro";
import { useRetroStore } from "../../../store/useRetroStore";
import { Plus, Edit2, EyeOff } from "lucide-react";
import { TimelineWritingStage } from "./TimelineWritingStage";

interface Props {
  room: RetroRoom;
  currentUser: RetroUser;
}

const TEMPLATE_COLUMNS: Record<string, string[]> = {
  "start-stop-continue": ["Start", "Stop", "Continue"],
  "went-well-improve-action": ["Went Well", "To Improve", "Action"],
  "mad-sad-glad": ["Mad", "Sad", "Glad"],
};

const getColumnColor = (column: string) => {
  const lower = column.toLowerCase();
  if (lower.includes('start') || lower.includes('well') || lower.includes('glad')) {
    return { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' };
  }
  if (lower.includes('stop') || lower.includes('improve') || lower.includes('mad')) {
    return { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500', border: 'border-rose-200' };
  }
  return { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-200' };
};

export function RetroWritingStage({ room, currentUser }: Props) {
  const { addCard, editCard } = useRetroStore();
  const columns = TEMPLATE_COLUMNS[room.template] || [];
  const [newCardText, setNewCardText] = useState<Record<string, string>>({});
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editCardText, setEditCardText] = useState("");
  const [anonymous, setAnonymous] = useState(true);

  if (room.template === "timeline") {
    return <TimelineWritingStage room={room} currentUser={currentUser} />;
  }

  const handleAddCard = (column: string) => {
    const text = newCardText[column]?.trim();
    if (text) {
      addCard(column, text, anonymous);
      setNewCardText(prev => ({ ...prev, [column]: "" }));
    }
  };

  const handleEditCard = (cardId: string) => {
    if (editCardText.trim()) {
      editCard(cardId, editCardText.trim());
      setEditingCardId(null);
    }
  };

  return (
    <div className="h-full flex flex-col min-w-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Writing Stage</h2>
          <p className="text-gray-500 text-sm mt-1">Add your thoughts to the columns below.</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <EyeOff className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Anonymous Mode</span>
        </label>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map(column => {
          const colors = getColumnColor(column);
          return (
            <div key={column} className="flex flex-col h-full">
              <div className="flex items-center gap-2 mb-4 px-2">
                <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                <h3 className="text-lg font-bold text-gray-900">{column}</h3>
                <span className="ml-auto bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-full">
                  {room.cards.filter(c => c.column === column).length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 pb-4 px-2">
                {room.cards.filter(c => c.column === column).length === 0 && (
                  <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400">
                    <p className="text-xs">No cards yet</p>
                  </div>
                )}
                {room.cards.filter(c => c.column === column).map(card => {
                  const author = room.users.find(u => u.id === card.authorId);
                  const authorName = author ? author.name : "User";
                  
                  return (
                    <div key={card.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 group relative hover:shadow-md transition-shadow">
                      {editingCardId === card.id ? (
                          <div className="flex flex-col gap-3">
                            <div className="relative">
                              <textarea
                                value={editCardText}
                                onChange={(e) => setEditCardText(e.target.value.slice(0, 200))}
                                className="w-full p-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-sm"
                                rows={3}
                                autoFocus
                              />
                              <div className="absolute bottom-2 right-2 text-[10px] text-gray-400">
                                {editCardText.length}/200
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingCardId(null)} className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">Cancel</button>
                            <button onClick={() => handleEditCard(card.id)} className="text-xs font-medium bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Save</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start gap-3">
                            <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${colors.dot}`} />
                            <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed flex-1">{card.text}</p>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-[10px]">
                            <span className={`px-2 py-0.5 rounded-full font-medium ${colors.bg} ${colors.text}`}>
                              {card.anonymous ? "Anonymous" : authorName}
                            </span>
                            {card.authorId === currentUser.id && (
                              <button
                                onClick={() => {
                                  setEditingCardId(card.id);
                                  setEditCardText(card.text);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 px-2">
                <div className="relative group">
                  <input
                    type="text"
                    value={newCardText[column] || ""}
                    onChange={(e) => setNewCardText(prev => ({ ...prev, [column]: e.target.value.slice(0, 200) }))}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCard(column)}
                    placeholder={`Add to ${column}...`}
                    className="w-full pl-4 pr-20 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm transition-shadow text-sm"
                  />
                  <div className="absolute right-12 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                    {(newCardText[column] || "").length}/200
                  </div>
                  <button
                    onClick={() => handleAddCard(column)}
                    disabled={!newCardText[column]?.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
