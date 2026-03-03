import { useState } from 'react';
// Force UI sync
import { useStore } from '../../store/useStore';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent, useDroppable } from '@dnd-kit/core';
import { sortableKeyboardCoordinates, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { IssueCard } from './IssueCard';
import { Issue } from '../../types';
import { BacklogSidebar } from './BacklogSidebar';
import { Swimlane, ProgressMarker } from './Swimlane';

export function StandupView() {
  const { issues, updateIssueStatus, updateIssueProgress, reorderIssues } = useStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDragData, setActiveDragData] = useState<any>(null);

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

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;
    
    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    // 1. Reordering Swimlanes
    if (activeType === 'swimlane') {
      if (activeIdStr !== overIdStr) {
        const activeIssueId = activeIdStr.replace('swimlane-', '');
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
        }
      }
      return;
    }

    // 3. Dragging Issue from Backlog
    const activeIssue = issues.find(i => i.id === activeIdStr);
    if (activeIssue?.status === 'todo') {
      if (overIdStr === 'active-area' || overIdStr.startsWith('slot-') || overType === 'swimlane') {
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

  return (
    <div className="flex-1 flex overflow-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <BacklogSidebar issues={issues.filter(i => i.status === 'todo')} />
        
        <ActiveArea issues={activeIssues} />

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

function ActiveArea({ issues }: { issues: Issue[] }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'active-area',
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex-1 p-8 overflow-y-auto bg-white transition-colors ${isOver ? 'bg-gray-50' : ''}`}
    >
      <div className="max-w-5xl mx-auto space-y-4 min-h-full pb-32">
        {issues.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
            Drag tasks here to start
          </div>
        ) : (
          <SortableContext items={issues.map(i => `swimlane-${i.id}`)} strategy={verticalListSortingStrategy}>
            {issues.map(issue => (
              <Swimlane key={issue.id} issue={issue} />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
}
