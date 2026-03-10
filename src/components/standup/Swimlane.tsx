import React from 'react';
// Force UI sync
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Issue } from '../../types';
import { cn } from '../../utils/cn';
import { GripVertical, CheckCircle2, PauseCircle, PlayCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';

const STEPS = Array.from({ length: 21 }, (_, i) => i * 5); // 0, 5, 10... 100

import { IssueTypeTag } from '../common/IssueTypeTag';

export const Swimlane: React.FC<{ issue: Issue, isOverlay?: boolean }> = ({ issue, isOverlay }) => {
  const { updateIssueStatus } = useStore();
  const currentProgress = issue.progress || 0;
  const [displayProgress, setDisplayProgress] = React.useState(currentProgress);
  const isCompleted = currentProgress === 100;
  const isPending = issue.status === 'pending';

  // Sync local state when prop changes, but only if NOT dragging this specific issue's marker
  // We'll handle the drag update separately or let it sync after drag ends
  React.useEffect(() => {
    setDisplayProgress(currentProgress);
  }, [currentProgress]);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `swimlane-${issue.id}`,
    data: { type: 'swimlane', issue },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging || isOverlay ? 50 : 1,
  };

  return (
    <div 
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      className={cn(
        "rounded-2xl p-4 flex flex-col gap-1 mb-3 transition-colors relative overflow-hidden border",
        isCompleted 
          ? "bg-emerald-50/50 border-emerald-200 shadow-sm" 
          : isPending
            ? "bg-amber-50/50 border-amber-200 shadow-sm opacity-80"
            : "bg-[#F9F9F9] border-transparent",
        isDragging && !isOverlay ? "opacity-50" : "",
        isOverlay && "shadow-xl rotate-1 scale-105 cursor-grabbing bg-white border border-gray-100"
      )}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <div {...attributes} {...listeners} className={cn("text-gray-300", isOverlay ? "cursor-grabbing" : "cursor-grab hover:text-gray-500")}>
            <GripVertical className="w-5 h-5" />
          </div>

          {issue.priority && (
            <span className={cn(
              "w-2 h-2 rounded-full flex-shrink-0",
              issue.priority === 'High' ? "bg-red-500" :
              issue.priority === 'Medium' ? "bg-amber-500" :
              "bg-blue-500"
            )} title={`Priority: ${issue.priority}`} />
          )}
          
          <IssueTypeTag type={issue.type} />

          <span className="text-xs font-bold text-gray-900 tracking-tight">
            {issue.key}
          </span>
          {/* truncate min-w-0 flex-1 */}
          <span className="text-gray-600 font-medium text-sm truncate min-w-0 flex-1" title={issue.summary}>{issue.summary}</span>
        </div>
          
        <span className={cn(
          "text-lg font-bold text-right tabular-nums flex-shrink-0 flex items-center justify-end gap-2",
          isCompleted ? "text-emerald-600" : isPending ? "text-amber-600" : "text-gray-900"
        )}>
          {isCompleted && <CheckCircle2 className="w-5 h-5" />}
          {!isCompleted && (
            <button 
              onClick={() => updateIssueStatus(issue.id, isPending ? 'in-progress' : 'pending')}
              className={cn(
                "p-1 rounded-full hover:bg-white/50 transition-colors",
                isPending ? "text-amber-600 bg-amber-100/50" : "text-gray-400 hover:text-gray-600"
              )}
              title={isPending ? "Resume" : "Mark as Pending"}
            >
              {isPending ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
            </button>
          )}
          {isPending && <span className="text-xs font-medium px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Pending</span>}
          {displayProgress}%
        </span>
      </div>
      
      <div className="flex gap-1 relative mt-3 h-8">
        {/* Background track line */}
        <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-200 -translate-y-1/2 rounded-full z-0" />
        <div 
          className={cn(
            "absolute top-1/2 left-0 h-2 -translate-y-1/2 rounded-full z-0 transition-all duration-500",
            isCompleted ? "bg-emerald-500" : isPending ? "bg-amber-400" : "bg-gray-900"
          )}
          style={{ width: `${displayProgress}%` }}
        />

        {STEPS.map(step => (
          <SwimlaneSlot 
            key={step} 
            issue={issue} 
            step={step} 
            hasCard={currentProgress === step} 
            onHover={() => setDisplayProgress(step)}
            onLeave={() => setDisplayProgress(currentProgress)}
          />
        ))}
      </div>
    </div>
  );
}

const SwimlaneSlot: React.FC<{ 
  issue: Issue, 
  step: number, 
  hasCard: boolean,
  onHover: () => void,
  onLeave: () => void
}> = ({ issue, step, hasCard, onHover, onLeave }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${issue.id}-${step}`,
    data: { type: 'slot', issueId: issue.id, step }
  });

  // Effect to trigger hover updates when dragging over
  React.useEffect(() => {
    if (isOver) {
      onHover();
    } else {
      onLeave();
    }
  }, [isOver]);

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "flex-1 w-0 min-w-0 h-full relative z-10 flex items-center justify-center group",
      )}
    >
      {/* Hover indicator for slot */}
      <div className={cn(
        "absolute top-1/2 -translate-y-1/2 w-full h-8 rounded transition-colors",
        isOver ? "bg-blue-500/10" : "group-hover:bg-gray-100"
      )} />
      
      {/* Step marker (small dot) */}
      {step % 25 === 0 && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-400">
          {step}%
        </div>
      )}
      
      {hasCard && <ProgressMarker issue={issue} step={step} />}
    </div>
  );
}

export function ProgressMarker({ issue, step, isOverlay }: { issue: Issue, step: number, isOverlay?: boolean }) {
  const assignee = issue.assignee;
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `marker-${issue.id}`,
    data: { type: 'progress-marker', issueId: issue.id, step }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
  } : undefined;

  if (isDragging && !isOverlay) {
    return <div ref={setNodeRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 opacity-0" />;
  }

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      {...listeners}
      {...attributes}
      style={isOverlay ? undefined : style}
      className={cn(
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center z-20",
        isOverlay ? "cursor-grabbing scale-125 shadow-2xl" : "cursor-grab hover:scale-110 transition-transform"
      )}
    >
      {assignee ? (
        <img src={assignee.avatar} alt={assignee.name} className="w-8 h-8 min-w-[32px] min-h-[32px] flex-shrink-0 rounded-full object-cover border-2 border-white shadow-sm bg-white" />
      ) : (
        <div className="w-8 h-8 min-w-[32px] min-h-[32px] flex-shrink-0 rounded-full border-2 border-gray-900 bg-white flex items-center justify-center shadow-sm">
          <span className="text-[10px] text-gray-900 font-bold">{step}%</span>
        </div>
      )}
    </div>
  );
}
