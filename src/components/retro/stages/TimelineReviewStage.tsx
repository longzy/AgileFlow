import { RetroRoom, RetroCard, RetroUser } from "@/shared/retro";
import { useRetroStore } from "../../../store/useRetroStore";
import { Edit2, GripVertical, Layers } from "lucide-react";
import { useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useSensor, useSensors, PointerSensor, closestCenter } from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "../../../utils/cn";

interface Props {
  room: RetroRoom;
  currentUser: RetroUser;
}

function DraggableCard({ card, room, currentUser, onEdit, isOverlay = false }: { key?: string | number; card: RetroCard; room: RetroRoom; currentUser: RetroUser; onEdit: (id: string, text: string) => void; isOverlay?: boolean }) {
  const author = room.users.find(u => u.id === card.authorId);
  const authorName = author ? author.name : "User";
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: { card },
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: card.id,
    data: { card },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const isPositive = card.column.endsWith("positive");

  return (
    <div
      ref={setDroppableRef}
      className={`relative transition-colors ${isOver && !isDragging ? "bg-blue-50 ring-2 ring-blue-500 ring-offset-2 rounded-xl" : ""}`}
    >
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={cn(
          "p-3 rounded-xl border shadow-sm group relative touch-none text-sm w-full max-w-[140px]",
          isOverlay ? 'border-blue-500 shadow-xl scale-105' : 'border-gray-200',
          isPositive ? "bg-emerald-50/50 border-emerald-100" : "bg-rose-50/50 border-rose-100"
        )}
      >
        <div className="flex items-start gap-2">
          <div className="mt-0.5 text-gray-400 cursor-grab active:cursor-grabbing shrink-0">
            <GripVertical className="w-3 h-3" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-800 whitespace-pre-wrap break-words line-clamp-3" title={card.text}>{card.text}</p>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-400">
              <span>{card.anonymous ? "Anon" : authorName}</span>
              {card.authorId === currentUser.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(card.id, card.text);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 hover:text-blue-700"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardGroup({ parentCard, childCards, room, currentUser, onEdit }: { key?: string | number; parentCard: RetroCard; childCards: RetroCard[]; room: RetroRoom; currentUser: RetroUser; onEdit: (id: string, text: string) => void }) {
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: parentCard.id,
    data: { card: parentCard },
  });

  const isPositive = parentCard.column.endsWith("positive");

  return (
    <div
      ref={setDroppableRef}
      className={cn(
        "p-2 rounded-2xl border-2 border-dashed w-full max-w-[150px]",
        isOver ? "border-blue-500 bg-blue-50" : "border-gray-200",
        isPositive ? "bg-emerald-50/30" : "bg-rose-50/30"
      )}
    >
      <div className="flex items-center gap-1 px-1 py-0.5 text-[10px] font-medium text-gray-500 mb-1">
        <Layers className="w-3 h-3" />
        Group ({childCards.length + 1})
      </div>
      <div className="space-y-1.5 flex flex-col items-center">
        <DraggableCard card={parentCard} room={room} currentUser={currentUser} onEdit={onEdit} />
        {childCards.map(child => (
          <div key={child.id} className="relative w-full flex justify-center">
             <DraggableCard card={child} room={room} currentUser={currentUser} onEdit={onEdit} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimelineReviewStage({ room, currentUser }: Props) {
  const { editCard, mergeCards } = useRetroStore();
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editCardText, setEditCardText] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const days = Array.from({ length: 10 }, (_, i) => i + 1);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleEditCard = (cardId: string) => {
    if (editCardText.trim()) {
      editCard(cardId, editCardText.trim());
      setEditingCardId(null);
    }
  };

  const onEditStart = (id: string, text: string) => {
    setEditingCardId(id);
    setEditCardText(text);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      mergeCards(active.id as string, over.id as string);
    }
  };

  const parentCards = room.cards.filter(c => !c.parentId);
  const cardsByParent: Record<string, RetroCard[]> = {};
  
  room.cards.forEach(c => {
    if (c.parentId) {
      if (!cardsByParent[c.parentId]) {
        cardsByParent[c.parentId] = [];
      }
      cardsByParent[c.parentId].push(c);
    }
  });

  const activeCard = activeId ? room.cards.find(c => c.id === activeId) : null;

  const renderCardOrGroup = (card: RetroCard) => {
    const children = cardsByParent[card.id] || [];
    
    if (editingCardId === card.id) {
      return (
        <div key={card.id} className="bg-white p-2 rounded-xl border border-blue-500 shadow-sm w-full max-w-[140px]">
          <div className="relative">
            <textarea
              value={editCardText}
              onChange={(e) => setEditCardText(e.target.value.slice(0, 200))}
              className="w-full p-1.5 text-xs border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 outline-none resize-none"
              rows={3}
              autoFocus
            />
            <div className="absolute bottom-1 right-1 text-[8px] text-gray-400">
              {editCardText.length}/200
            </div>
          </div>
          <div className="flex justify-end gap-1 mt-1">
            <button onClick={() => setEditingCardId(null)} className="text-[10px] text-gray-500 hover:text-gray-700">Cancel</button>
            <button onClick={() => handleEditCard(card.id)} className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-700">Save</button>
          </div>
        </div>
      );
    }

    if (children.length > 0) {
      return (
        <CardGroup 
          key={card.id} 
          parentCard={card} 
          childCards={children} 
          room={room}
          currentUser={currentUser} 
          onEdit={onEditStart} 
        />
      );
    }

    return (
      <DraggableCard 
        key={card.id} 
        card={card} 
        room={room}
        currentUser={currentUser} 
        onEdit={onEditStart} 
      />
    );
  };

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >
      <div className="h-full flex flex-col min-w-0">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Review Stage (Timeline)</h2>
          <p className="text-gray-500">
            {room.hostId === currentUser.id 
              ? "Drag cards onto each other to group them. You can still edit your own cards."
              : "Review all cards. You can still edit your own cards."}
          </p>
        </div>

        {/* Timeline Container */}
        <div className="flex-1 overflow-x-auto overflow-y-auto pb-8 relative min-w-0 w-full">
          <div className="min-w-[1200px] min-h-full grid grid-rows-[1fr_auto_1fr] grid-cols-10 relative py-12">
            {/* Central Axis */}
            <div className="row-start-2 col-span-10 h-1 bg-gray-300 self-center rounded-full" />

            {/* Days Grid */}
            {days.map((day, index) => {
              const col = index + 1;
              const positiveCards = parentCards.filter(c => c.column === `day-${day}-positive`);
              const negativeCards = parentCards.filter(c => c.column === `day-${day}-negative`);

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
                    {positiveCards.map(renderCardOrGroup)}
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
                    {negativeCards.map(renderCardOrGroup)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <DragOverlay>
        {activeCard ? (
          <DraggableCard 
            card={activeCard} 
            room={room}
            currentUser={currentUser} 
            onEdit={() => {}} 
            isOverlay 
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
