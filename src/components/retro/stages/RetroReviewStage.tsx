import { RetroRoom, RetroCard, RetroUser } from "@/shared/retro";
import { useRetroStore } from "../../../store/useRetroStore";
import { Edit2, GripVertical, Layers } from "lucide-react";
import { useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useSensor, useSensors, PointerSensor, closestCenter } from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { TimelineReviewStage } from "./TimelineReviewStage";

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

function DraggableCard({ card, room, currentUser, onEdit, isOverlay = false, colors }: { key?: string | number; card: RetroCard; room: RetroRoom; currentUser: RetroUser; onEdit: (id: string, text: string) => void; isOverlay?: boolean; colors?: any }) {
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

  return (
    <div
      ref={setDroppableRef}
      className={`relative transition-colors rounded-2xl ${isOver && !isDragging ? "bg-blue-50 ring-2 ring-blue-500 ring-offset-2" : ""}`}
    >
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={`bg-white p-4 rounded-2xl border ${isOverlay ? 'border-blue-500 shadow-xl' : 'border-gray-100 shadow-sm'} group relative touch-none hover:shadow-md transition-shadow`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-1 text-gray-300 cursor-grab active:cursor-grabbing hover:text-gray-500 transition-colors">
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <p className="text-gray-800 whitespace-pre-wrap break-words text-sm leading-relaxed flex-1">{card.text}</p>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-[10px]">
          <span className={`px-2 py-0.5 rounded-full font-medium ${colors.bg} ${colors.text}`}>
            {card.anonymous ? "Anonymous" : authorName}
          </span>
          {card.authorId === currentUser.id && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent drag start
                onEdit(card.id, card.text);
              }}
              onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CardGroup({ parentCard, childCards, room, currentUser, onEdit, colors }: { key?: string | number; parentCard: RetroCard; childCards: RetroCard[]; room: RetroRoom; currentUser: RetroUser; onEdit: (id: string, text: string) => void; colors?: any }) {
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: parentCard.id,
    data: { card: parentCard },
  });

  return (
    <div
      ref={setDroppableRef}
      className={`bg-gray-50/80 p-3 rounded-3xl border-2 border-dashed ${isOver ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
    >
      <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
        <Layers className="w-3.5 h-3.5" />
        Group ({childCards.length + 1} cards)
      </div>
      <div className="space-y-3">
        <DraggableCard card={parentCard} room={room} currentUser={currentUser} onEdit={onEdit} colors={colors} />
        {childCards.map(child => (
          <div key={child.id} className="pl-6 relative">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-px bg-gray-300"></div>
             <div className="absolute left-3 top-0 bottom-1/2 w-px bg-gray-300"></div>
             <DraggableCard card={child} room={room} currentUser={currentUser} onEdit={onEdit} colors={colors} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RetroReviewStage({ room, currentUser }: Props) {
  const { editCard, mergeCards } = useRetroStore();
  const columns = TEMPLATE_COLUMNS[room.template] || [];
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editCardText, setEditCardText] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  if (room.template === "timeline") {
    return <TimelineReviewStage room={room} currentUser={currentUser} />;
  }

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
      // Merge active card into over card
      mergeCards(active.id as string, over.id as string);
    }
  };

  // Group cards by parentId
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

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >
      <div className="h-full flex flex-col">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Review Stage</h2>
          <p className="text-gray-500 text-sm mt-1">
            {room.hostId === currentUser.id 
              ? "Drag cards onto each other to group them. You can still edit your own cards."
              : "Review all cards. You can still edit your own cards."}
          </p>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
          {columns.map(column => {
            const colors = getColumnColor(column);
            return (
              <div key={column} className="flex flex-col h-full min-h-0">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                  <h3 className="text-lg font-bold text-gray-900">{column}</h3>
                  <span className="ml-auto bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-full">
                    {parentCards.filter(c => c.column === column).length}
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-4 pb-4 px-2">
                  {parentCards.filter(c => c.column === column).map(card => {
                    const children = cardsByParent[card.id] || [];
                    
                    if (editingCardId === card.id) {
                      return (
                        <div key={card.id} className="bg-white p-4 rounded-2xl border border-blue-500 shadow-sm">
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
                          <div className="flex justify-end gap-2 mt-3">
                            <button onClick={() => setEditingCardId(null)} className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">Cancel</button>
                            <button onClick={() => handleEditCard(card.id)} className="text-xs font-medium bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Save</button>
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
                          colors={colors}
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
                        colors={colors}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
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
            colors={getColumnColor(activeCard.column)}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
