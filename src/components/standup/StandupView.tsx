import { useState } from 'react';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';
// Force UI sync
import { useStore } from '../../store/useStore';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent, useDroppable } from '@dnd-kit/core';
import { sortableKeyboardCoordinates, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { IssueCard } from './IssueCard';
import { Issue } from '../../types';
import { BacklogSidebar } from './BacklogSidebar';
import { Swimlane, ProgressMarker } from './Swimlane';

const playDropSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      const audioCtx = new AudioContext();
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      const now = audioCtx.currentTime;
      playTone(987.77, now, 0.1); // B5
      playTone(1318.51, now + 0.1, 0.4); // E6
    }
  } catch (e) {
    console.error('Audio play failed', e);
  }
};

export function StandupView() {
  const { issues, updateIssueStatus, updateIssueProgress, reorderIssues, isLoading } = useStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDragData, setActiveDragData] = useState<any>(null);
  const [focusedUserId, setFocusedUserId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setActiveDragData(event.active.data.current);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveDragData(null);

    if (!over) return;

    playDropSound();

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;
    
    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    // 1. Reordering Swimlanes or Moving back to Backlog
    if (activeType === 'swimlane') {
      const activeIssueId = activeIdStr.replace('swimlane-', '');

      // Check if dropped on Backlog (container or item)
      const overIssue = issues.find(i => i.id === overIdStr);
      if (overIdStr === 'todo' || (overType === 'issue' && overIssue?.status === 'todo')) {
        updateIssueStatus(activeIssueId, 'todo');
        return;
      }

      // Reordering within swimlanes
      if (activeIdStr !== overIdStr && overType === 'swimlane') {
        const overIssueId = overIdStr.replace('swimlane-', '');
        reorderIssues(activeIssueId, overIssueId);
      }
      return;
    }

    // 2. Dragging Progress Marker
    if (activeType === 'progress-marker') {
      if (overIdStr.startsWith('slot-')) {
        const parts = overIdStr.split('-');
        const step = parseInt(parts.pop() || '0', 10);
        const targetIssueId = parts.slice(1).join('-');
        
        const activeIssueId = activeIdStr.replace('marker-', '');
        if (activeIssueId === targetIssueId) {
          updateIssueProgress(activeIssueId, step);
          
          // Trigger confetti if completed
          if (step === 100) {
            const end = Date.now() + 1.5 * 1000;
            const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

            (function frame() {
              confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.8 },
                colors: colors
              });
              confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 0.8 },
                colors: colors
              });

              if (Date.now() < end) {
                requestAnimationFrame(frame);
              }
            }());
          }
        }
      }
      return;
    }

    // 3. Dragging Issue from Backlog
    const activeIssue = issues.find(i => i.id === activeIdStr);
    if (activeIssue?.status === 'todo') {
      if (overIdStr === 'active-area' || overIdStr.startsWith('slot-') || overType === 'swimlane') {
        if (!activeIssue.assignee) {
          toast.error('Please assign a user before moving to active area');
          return;
        }
        // Only update progress, do NOT re-assign user
        updateIssueProgress(activeIdStr, 0);
      }
      return;
    }

    // If dragging back to To Do
    if (overIdStr === 'todo') {
      updateIssueStatus(activeIdStr, 'todo');
      return;
    }
  };

  const activeIssue = issues.find(i => i.id === activeId);
  const activeIssues = issues.filter(i => i.status !== 'todo' && i.status !== 'backlog');

  // Get unique assignees from active issues
  const assignees = Array.from(new Set(activeIssues.map(i => i.assignee?.id).filter(Boolean)))
    .map(id => activeIssues.find(i => i.assignee?.id === id)?.assignee)
    .filter((u): u is NonNullable<typeof u> => !!u);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-500">Loading standup data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <BacklogSidebar issues={issues.filter(i => i.status === 'todo')} />
        
        <ActiveArea 
          issues={activeIssues} 
          focusedUserId={focusedUserId} 
          setFocusedUserId={setFocusedUserId}
          assignees={assignees}
        />

        <DragOverlay>
          {activeDragData?.type === 'issue' && activeIssue ? (
            <IssueCard issue={activeIssue} isOverlay />
          ) : activeDragData?.type === 'swimlane' ? (
            <Swimlane issue={activeDragData.issue} isOverlay />
          ) : activeDragData?.type === 'progress-marker' ? (
            <ProgressMarker issue={issues.find(i => i.id === activeDragData.issueId)!} step={activeDragData.step} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function ActiveArea({ 
  issues, 
  focusedUserId, 
  setFocusedUserId,
  assignees 
}: { 
  issues: Issue[], 
  focusedUserId: string | null,
  setFocusedUserId: (id: string | null) => void,
  assignees: any[]
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'active-area',
  });

  // Sort issues: focused user's issues first, then others
  const sortedIssues = [...issues].sort((a, b) => {
    if (!focusedUserId) return 0;
    const aIsFocused = a.assignee?.id === focusedUserId;
    const bIsFocused = b.assignee?.id === focusedUserId;
    if (aIsFocused && !bIsFocused) return -1;
    if (!aIsFocused && bIsFocused) return 1;
    return 0;
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex-1 overflow-y-auto bg-white transition-colors relative ${isOver ? 'bg-gray-50' : ''}`}
    >
      {/* Sticky Member Filter Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-2 mb-4 flex items-center gap-4">
        <span className="text-sm font-medium text-gray-500">Focus:</span>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mb-1">
          <button
            onClick={() => setFocusedUserId(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
              focusedUserId === null 
                ? 'bg-gray-900 text-white shadow-sm' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {assignees.map(user => (
            <button
              key={user.id}
              onClick={() => setFocusedUserId(focusedUserId === user.id ? null : user.id)}
              className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-full transition-all border whitespace-nowrap max-w-[160px] ${
                focusedUserId === user.id 
                  ? 'bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-100' 
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
              title={user.name}
            >
              <img src={user.avatar} alt={user.name} className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
              <span className="text-xs font-medium truncate">{user.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-4 min-h-full pb-32 px-8">
        {issues.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
            Drag tasks here to start
          </div>
        ) : (
          <SortableContext items={sortedIssues.map(i => `swimlane-${i.id}`)} strategy={verticalListSortingStrategy}>
            {sortedIssues.map(issue => (
              <div 
                key={issue.id} 
                className={`transition-opacity duration-300 ${
                  focusedUserId && issue.assignee?.id !== focusedUserId ? 'opacity-30 grayscale' : 'opacity-100'
                }`}
              >
                <Swimlane issue={issue} />
              </div>
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
}
