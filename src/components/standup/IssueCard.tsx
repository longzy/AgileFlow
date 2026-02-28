import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Issue } from '../../types';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { PauseCircle, CheckCircle2 } from 'lucide-react';

interface IssueCardProps {
  key?: string | number;
  issue: Issue;
  isOverlay?: boolean;
}

export function IssueCard({ issue, isOverlay }: IssueCardProps) {
  const { users } = useStore();
  const assignee = users.find(u => u.id === issue.assigneeId);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: issue.id,
    data: { type: 'issue', issue }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-white rounded-2xl p-4 transition-all group relative border border-transparent shadow-sm",
        isDragging && !isOverlay ? "opacity-30" : "hover:shadow-md",
        isOverlay ? "shadow-xl scale-105 rotate-2 cursor-grabbing z-50 ring-1 ring-slate-900/5" : "cursor-grab",
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-bold text-slate-900 tracking-tight">
          {issue.key}
        </span>
        <div className="flex items-center gap-2">
          {issue.estimated && (
            <div className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
              <CheckCircle2 className="w-3 h-3" />
              <span>{issue.storyPoints}</span>
            </div>
          )}
          {assignee ? (
            <img 
              src={assignee.avatar} 
              alt={assignee.name} 
              className="w-6 h-6 min-w-[24px] min-h-[24px] object-cover rounded-full border border-white shadow-sm"
              title={assignee.name}
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
              <span className="text-[10px] text-slate-400">?</span>
            </div>
          )}
        </div>
      </div>
      
      <h3 className="text-sm font-medium text-slate-900 mb-3 line-clamp-2 leading-relaxed group-hover:text-slate-700 transition-colors">
        {issue.summary}
      </h3>

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
        <div className="flex items-center gap-2">
          <span className={cn(
            "w-2 h-2 rounded-full",
            issue.priority === 'High' ? "bg-red-500" :
            issue.priority === 'Medium' ? "bg-amber-500" :
            "bg-blue-500"
          )} />
          <span className="text-xs text-slate-500 font-medium">{issue.priority}</span>
        </div>
        
        {issue.status === 'in-progress' && (
          <div className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">
            {issue.progress}%
          </div>
        )}
      </div>
    </div>
  );
}
