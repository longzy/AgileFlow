import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
// Force UI sync
import { useStore } from '../../store/useStore';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent, useDroppable } from '@dnd-kit/core';
import { sortableKeyboardCoordinates, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { IssueCard } from './IssueCard';
import { Issue } from '../../types';
import { BacklogSidebar } from './BacklogSidebar';
import { Swimlane, ProgressMarker } from './Swimlane';
import { Play, Pause, SkipForward, Volume2, VolumeX, StopCircle, Timer } from 'lucide-react';
import { speak, announceTurn } from '../../utils/voice';

import { playDropSound } from '../../utils/audio';
import { triggerSuccessConfetti } from '../../utils/effects';
import { LoadingScreen } from '../common/LoadingScreen';
import { cn } from '../../utils/cn';

export function StandupView() {
  const { 
    issues, 
    updateIssueStatus, 
    updateIssueProgress, 
    reorderIssues, 
    isLoading,
    isStandupActive,
    currentStandupIssueId,
    standupTimeLeft,
    isStandupMuted,
    isStandupPaused,
    isStandupTransitioning,
    startStandup,
    stopStandup,
    pauseStandup,
    resumeStandup,
    skipStandupIssue,
    setStandupTimeLeft,
    toggleStandupMute,
    nextStandupIssue,
    setStandupTransitioning
  } = useStore();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDragData, setActiveDragData] = useState<any>(null);
  const [focusedUserId, setFocusedUserId] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeIssues = issues.filter(i => i.status !== 'todo' && i.status !== 'backlog' && (i.progress || 0) < 100);

  // Timer logic - Countdown
  useEffect(() => {
    if (isStandupActive && !isStandupPaused && !isStandupTransitioning && standupTimeLeft > 0) {
      timerRef.current = setInterval(() => {
        setStandupTimeLeft(standupTimeLeft - 1);
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [isStandupActive, isStandupPaused, isStandupTransitioning, standupTimeLeft, setStandupTimeLeft]);

  // Transition trigger - When time is up
  useEffect(() => {
    if (standupTimeLeft === 0 && isStandupActive && !isStandupTransitioning) {
      // Start transition buffer
      setStandupTransitioning(true);
      
      // Announce time is up and who is next
      if (!isStandupMuted) {
        const currentIndex = activeIssues.findIndex(i => i.id === currentStandupIssueId);
        const nextIssue = activeIssues[currentIndex + 1];
        if (nextIssue?.assignee) {
          const isChinese = /[\u4e00-\u9fa5]/.test(nextIssue.assignee.name);
          if (isChinese) {
            speak(`时间到。下一位是 ${nextIssue.assignee.name}`);
          } else {
            speak(`Time is up. Next up is ${nextIssue.assignee.name}`);
          }
        } else {
          const isAnyChinese = issues.some(i => /[\u4e00-\u9fa5]/.test(i.assignee?.name || ''));
          speak(isAnyChinese ? "时间到。站会结束。" : "Time is up. Standup complete.");
        }
      }
    }
  }, [standupTimeLeft, isStandupActive, isStandupTransitioning, isStandupMuted, activeIssues, currentStandupIssueId, setStandupTransitioning]);

  // Transition timer - Handles the 4s delay
  useEffect(() => {
    if (isStandupTransitioning) {
      transitionTimerRef.current = setTimeout(() => {
        nextStandupIssue();
      }, 4000);
      return () => {
        if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      };
    }
  }, [isStandupTransitioning, nextStandupIssue]);

  // Voice announcement logic
  useEffect(() => {
    // Only announce "It's your turn" when transitioning back to active (isStandupTransitioning goes false)
    // OR when the standup just started
    if (isStandupActive && currentStandupIssueId && !isStandupMuted && !isStandupTransitioning) {
      const currentIssue = issues.find(i => i.id === currentStandupIssueId);
      if (currentIssue?.assignee) {
        // Small delay to let the UI settle
        const timer = setTimeout(() => {
          announceTurn(currentIssue.assignee.name);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [currentStandupIssueId, isStandupActive, isStandupMuted, isStandupTransitioning, issues]);

  // Scroll to current standup issue
  useEffect(() => {
    if (isStandupActive && currentStandupIssueId) {
      const element = document.getElementById(`swimlane-${currentStandupIssueId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentStandupIssueId, isStandupActive]);

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
            triggerSuccessConfetti();
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

  const activeIdStr = activeId as string;
  const activeIssue = issues.find(i => i.id === activeId);

  // Get unique assignees from active issues
  const assignees = Array.from(new Set(activeIssues.map(i => i.assignee?.id).filter(Boolean)))
    .map(id => activeIssues.find(i => i.assignee?.id === id)?.assignee)
    .filter((u): u is NonNullable<typeof u> => !!u);

  if (isLoading) {
    return <LoadingScreen message="Loading standup data..." />;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
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

      {/* Standup Controls Overlay */}
      <div className={cn(
        "absolute bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500",
        isStandupActive ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
      )}>
        <div className="bg-gray-900 text-white rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-8 border border-white/10 backdrop-blur-xl bg-gray-900/90">
          <div className="flex items-center gap-4 border-r border-white/10 pr-8">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
              isStandupTransitioning ? "bg-emerald-500 animate-bounce" :
              standupTimeLeft <= 10 ? "bg-red-500 animate-pulse" : 
              standupTimeLeft <= 30 ? "bg-amber-500" : "bg-blue-500"
            )}>
              <Timer className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black tabular-nums tracking-tighter min-w-[80px]">
                {isStandupTransitioning ? "Next..." : `${Math.floor(standupTimeLeft / 60)}:${(standupTimeLeft % 60).toString().padStart(2, '0')}`}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                {isStandupTransitioning ? "Preparing" : "Time Left"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={isStandupPaused ? resumeStandup : pauseStandup}
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
              title={isStandupPaused ? "Resume" : "Pause"}
            >
              {isStandupPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>
            <button 
              onClick={skipStandupIssue}
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
              title="Skip"
            >
              <SkipForward className="w-5 h-5" />
            </button>
            <button 
              onClick={toggleStandupMute}
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
              title={isStandupMuted ? "Unmute" : "Mute"}
            >
              {isStandupMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button 
              onClick={stopStandup}
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-red-500/20 text-red-400 transition-colors ml-2"
              title="Stop Standup"
            >
              <StopCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {!isStandupActive && activeIssues.length > 0 && (
        <button
          onClick={startStandup}
          className="absolute bottom-8 right-8 z-40 bg-gray-900 text-white px-6 py-3 rounded-2xl font-bold shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
            <Play className="w-4 h-4 fill-current" />
          </div>
          开始站会
        </button>
      )}
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
