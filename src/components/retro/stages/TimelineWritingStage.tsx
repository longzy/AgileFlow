import { useState } from "react";
import { RetroRoom, RetroCard } from "@/shared/retro";
import { useRetroStore } from "../../../store/useRetroStore";
import { Plus, Edit2, Check, EyeOff, Smile, Frown } from "lucide-react";
import { cn } from "../../../utils/cn";

interface Props {
  room: RetroRoom;
  currentUser: any;
}

export function TimelineWritingStage({ room, currentUser }: Props) {
  const { addCard, editCard } = useRetroStore();
  const [newCardText, setNewCardText] = useState("");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedSentiment, setSelectedSentiment] = useState<"positive" | "negative" | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editCardText, setEditCardText] = useState("");
  const [anonymous, setAnonymous] = useState(true);

  const days = Array.from({ length: 10 }, (_, i) => i + 1);

  const handleAddCard = () => {
    if (newCardText.trim() && selectedDay !== null && selectedSentiment !== null) {
      const column = `day-${selectedDay}-${selectedSentiment}`;
      addCard(column, newCardText.trim(), anonymous);
      setNewCardText("");
      setSelectedDay(null);
      setSelectedSentiment(null);
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
          <h2 className="text-2xl font-bold text-gray-900">Sprint Timeline (10 Days)</h2>
          <p className="text-gray-500 text-sm mt-1">Add events to the timeline.</p>
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

      {/* Timeline Container */}
      <div className="flex-1 overflow-x-auto overflow-y-auto pb-8 relative min-w-0 w-full">
        <div className="min-w-[1200px] min-h-full grid grid-rows-[1fr_auto_1fr] grid-cols-10 relative py-12">
          {/* Central Axis */}
          <div className="row-start-2 col-span-10 h-1 bg-gray-300 self-center rounded-full" />

          {/* Days Grid */}
          {days.map((day, index) => {
            const col = index + 1;
            const positiveCards = room.cards.filter(c => c.column === `day-${day}-positive`);
            const negativeCards = room.cards.filter(c => c.column === `day-${day}-negative`);

            return (
              <div key={day} className="contents group">
                {/* Hover Catcher & Guide Line */}
                <div 
                  className="row-start-1 row-span-3 flex justify-center z-0" 
                  style={{ gridColumnStart: col }}
                >
                  <div className="w-full h-full flex justify-center">
                    <div className="w-px h-full bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {/* Top Half (Positive) */}
                <div 
                  className="row-start-1 flex flex-col-reverse items-center pb-6 px-2 gap-2 z-10" 
                  style={{ gridColumnStart: col }}
                >
                  {positiveCards.map(card => (
                    <CardItem 
                      key={card.id} 
                      card={card} 
                      currentUser={currentUser}
                      editingCardId={editingCardId}
                      editCardText={editCardText}
                      setEditingCardId={setEditingCardId}
                      setEditCardText={setEditCardText}
                      handleEditCard={handleEditCard}
                      sentiment="positive"
                    />
                  ))}
                  <button 
                    onClick={() => { setSelectedDay(day); setSelectedSentiment("positive"); }}
                    className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emerald-100 hover:scale-110 shrink-0"
                    title="Add Positive Event"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Day Marker */}
                <div 
                  className="row-start-2 flex justify-center items-center z-20" 
                  style={{ gridColumnStart: col }}
                >
                  <div className="w-8 h-8 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center group-hover:border-blue-500 transition-colors">
                    <span className="text-xs font-bold text-gray-600">D{day}</span>
                  </div>
                </div>

                {/* Bottom Half (Negative) */}
                <div 
                  className="row-start-3 flex flex-col items-center pt-6 px-2 gap-2 z-10" 
                  style={{ gridColumnStart: col }}
                >
                  <button 
                    onClick={() => { setSelectedDay(day); setSelectedSentiment("negative"); }}
                    className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-100 hover:scale-110 shrink-0"
                    title="Add Negative Event"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  {negativeCards.map(card => (
                    <CardItem 
                      key={card.id} 
                      card={card} 
                      currentUser={currentUser}
                      editingCardId={editingCardId}
                      editCardText={editCardText}
                      setEditingCardId={setEditingCardId}
                      setEditCardText={setEditCardText}
                      handleEditCard={handleEditCard}
                      sentiment="negative"
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Input Modal/Drawer for selected day */}
      {selectedDay !== null && selectedSentiment !== null && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                selectedSentiment === "positive" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
              )}>
                {selectedSentiment === "positive" ? <Smile className="w-5 h-5" /> : <Frown className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Day {selectedDay} - {selectedSentiment === "positive" ? "Went Well" : "Needs Improvement"}
                </h3>
                <p className="text-sm text-gray-500">Add a card to the timeline</p>
              </div>
            </div>
            
            <textarea
              value={newCardText}
              onChange={(e) => setNewCardText(e.target.value)}
              placeholder="What happened on this day?"
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none mb-4"
              rows={4}
              autoFocus
            />
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setSelectedDay(null); setSelectedSentiment(null); setNewCardText(""); }}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddCard}
                disabled={!newCardText.trim()}
                className={cn(
                  "px-6 py-2 text-white font-medium rounded-xl transition-colors disabled:opacity-50",
                  selectedSentiment === "positive" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                )}
              >
                Add Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CardItem({ card, currentUser, editingCardId, editCardText, setEditingCardId, setEditCardText, handleEditCard, sentiment }: any) {
  return (
    <div className={cn(
      "w-full max-w-[140px] p-3 rounded-xl border shadow-sm group relative text-sm",
      sentiment === "positive" ? "bg-emerald-50/50 border-emerald-100" : "bg-rose-50/50 border-rose-100"
    )}>
      {editingCardId === card.id ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={editCardText}
            onChange={(e) => setEditCardText(e.target.value)}
            className="w-full p-1.5 text-xs border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 outline-none resize-none"
            rows={3}
            autoFocus
          />
          <div className="flex justify-end gap-1">
            <button onClick={() => setEditingCardId(null)} className="text-[10px] text-gray-500 hover:text-gray-700">Cancel</button>
            <button onClick={() => handleEditCard(card.id)} className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-700">Save</button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-gray-800 whitespace-pre-wrap line-clamp-3" title={card.text}>{card.text}</p>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-400">
            <span>{card.anonymous ? "Anon" : "User"}</span>
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
  );
}
