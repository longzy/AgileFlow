import { RetroRoom, RetroCard } from "@/shared/retro";
import { useRetroStore } from "../../../stores/useRetroStore";
import { Edit2, GripVertical, Layers } from "lucide-react";
import { useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useSensor, useSensors, PointerSensor, closestCenter } from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  room: RetroRoom;
  currentUser: any;
}

const TEMPLATE_COLUMNS: Record<string, string[]> = {
  "start-stop-continue": ["Start", "Stop", "Continue"],
  "went-well-improve-action": ["Went Well", "To Improve", "Action"],
  "mad-sad-glad": ["Mad", "Sad", "Glad"],
};

function DraggableCard({ card, currentUser, onEdit, isOverlay = false }: { card: RetroCard; currentUser: any; onEdit: (id: string, text: string) => void; isOverlay?: boolean }) {
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
      className={`relative transition-colors ${isOver && !isDragging ? "bg-blue-50 ring-2 ring-blue-500 ring-offset-2" : ""}`}
    >
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={`bg-white p-4 rounded-xl border ${isOverlay ? 'border-blue-500 shadow-xl' : 'border-gray-200 shadow-sm'} group relative touch-none`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-1 text-gray-400 cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-800 whitespace-pre-wrap break-words">{card.text}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
              <span>{card.anonymous ? "Anonymous" : "User"}</span>
              {card.authorId === currentUser.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent drag start
                    onEdit(card.id, card.text);
                  }}
                  onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
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

function CardGroup({ parentCard, childCards, currentUser, onEdit }: { parentCard: RetroCard; childCards: RetroCard[]; currentUser: any; onEdit: (id: string, text: string) => void }) {
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: parentCard.id,
    data: { card: parentCard },
  });

  return (
    <div
      ref={setDroppableRef}
      className={`bg-gray-50 p-2 rounded-2xl border-2 border-dashed ${isOver ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
    >
      <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-gray-500 mb-2">
        <Layers className="w-3 h-3" />
        Group ({childCards.length + 1} cards)
      </div>
      <div className="space-y-2">
        <DraggableCard card={parentCard} currentUser={currentUser} onEdit={onEdit} />
        {childCards.map(child => (
          <div key={child.id} className="pl-4 relative">
             <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-px bg-gray-300"></div>
             <div className="absolute left-0 top-0 bottom-1/2 w-px bg-gray-300"></div>
             <DraggableCard card={child} currentUser={currentUser} onEdit={onEdit} />
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
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Review Stage</h2>
          <p className="text-gray-500">
            {room.hostId === currentUser.id 
              ? "Drag cards onto each other to group them. You can still edit your own cards."
              : "Review all cards. You can still edit your own cards."}
          </p>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
          {columns.map(column => (
            <div key={column} className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden h-full">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 shrink-0">
                <h3 className="text-lg font-bold text-gray-900">{column}</h3>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {parentCards.filter(c => c.column === column).map(card => {
                  const children = cardsByParent[card.id] || [];
                  
                  if (editingCardId === card.id) {
                    return (
                      <div key={card.id} className="bg-white p-4 rounded-xl border border-blue-500 shadow-sm">
                        <textarea
                          value={editCardText}
                          onChange={(e) => setEditCardText(e.target.value)}
                          className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button onClick={() => setEditingCardId(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                          <button onClick={() => handleEditCard(card.id)} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700">Save</button>
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
                        currentUser={currentUser} 
                        onEdit={onEditStart} 
                      />
                    );
                  }

                  return (
                    <DraggableCard 
                      key={card.id} 
                      card={card} 
                      currentUser={currentUser} 
                      onEdit={onEditStart} 
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <DragOverlay>
        {activeCard ? (
          <DraggableCard 
            card={activeCard} 
            currentUser={currentUser} 
            onEdit={() => {}} 
            isOverlay 
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
