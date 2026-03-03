import { useState } from "react";
import { RetroRoom, RetroCard } from "@/shared/retro";
import { useRetroStore } from "../../../stores/useRetroStore";
import { Plus, Edit2, Check, EyeOff } from "lucide-react";

interface Props {
  room: RetroRoom;
  currentUser: any;
}

const TEMPLATE_COLUMNS: Record<string, string[]> = {
  "start-stop-continue": ["Start", "Stop", "Continue"],
  "went-well-improve-action": ["Went Well", "To Improve", "Action"],
  "mad-sad-glad": ["Mad", "Sad", "Glad"],
};

export function RetroWritingStage({ room, currentUser }: Props) {
  const { addCard, editCard } = useRetroStore();
  const columns = TEMPLATE_COLUMNS[room.template] || [];
  const [newCardText, setNewCardText] = useState<Record<string, string>>({});
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editCardText, setEditCardText] = useState("");
  const [anonymous, setAnonymous] = useState(true);

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
    <div className="h-full flex flex-col">
      <div className="flex justify-end mb-4">
        <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
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
        {columns.map(column => (
          <div key={column} className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">{column}</h3>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {room.cards.filter(c => c.column === column).map(card => (
                <div key={card.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 group relative">
                  {editingCardId === card.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={editCardText}
                        onChange={(e) => setEditCardText(e.target.value)}
                        className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingCardId(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                        <button onClick={() => handleEditCard(card.id)} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700">Save</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-800 whitespace-pre-wrap">{card.text}</p>
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                        <span>{card.anonymous ? "Anonymous" : "User"}</span>
                        {card.authorId === currentUser.id && (
                          <button
                            onClick={() => {
                              setEditingCardId(card.id);
                              setEditCardText(card.text);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 hover:text-blue-700"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCardText[column] || ""}
                  onChange={(e) => setNewCardText(prev => ({ ...prev, [column]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCard(column)}
                  placeholder="Add a card..."
                  className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <button
                  onClick={() => handleAddCard(column)}
                  disabled={!newCardText[column]?.trim()}
                  className="p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
