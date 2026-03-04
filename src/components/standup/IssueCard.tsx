import { useSortable } from '@dnd-kit/sortable';
// Force UI sync
import { CSS } from '@dnd-kit/utilities';
import { Issue } from '../../types';
import { cn } from '../../utils/cn';
import { PauseCircle, CheckCircle2, BookOpen, CheckSquare, Bug } from 'lucide-react';

interface IssueCardProps {
  key?: string | number;
  issue: Issue;
  isOverlay?: boolean;
}

export function IssueCard({ issue, isOverlay }: IssueCardProps) {
  const assignee = issue.assignee;

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

  const getTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'story': return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case 'bug': return "bg-rose-50 text-rose-700 border-rose-200";
      default: return "bg-sky-50 text-sky-700 border-sky-200";
    }
  };

  const getTypeIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'story': return <BookOpen className="w-3 h-3" />;
      case 'bug': return <Bug className="w-3 h-3" />;
      default: return <CheckSquare className="w-3 h-3" />;
    }
  };

  const isCompleted = issue.status === 'in-progress' && issue.progress === 100;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "rounded-2xl p-4 transition-all group relative border overflow-hidden",
        isCompleted 
          ? "bg-emerald-50/50 border-emerald-200 shadow-sm ring-1 ring-emerald-100/50" 
          : "bg-white border-transparent shadow-sm",
        isDragging && !isOverlay ? "opacity-30" : "hover:shadow-md",
        isOverlay ? "shadow-xl scale-105 rotate-2 cursor-grabbing z-50 ring-1 ring-gray-900/5" : "cursor-grab",
      )}
    >
      <div className="flex items-start justify-between mb-2 pl-1">
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border",
            getTypeColor(issue.type)
          )}>
            {getTypeIcon(issue.type)}
            <span>{issue.type || 'Task'}</span>
          </div>
          <span className="text-xs font-bold text-gray-900 tracking-tight">
            {issue.key}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {issue.estimated && (
            <div className="flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
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
            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-[10px] text-gray-400">?</span>
            </div>
          )}
        </div>
      </div>
      
      <h3 className="text-sm font-medium text-gray-900 mb-3 pl-1 line-clamp-2 leading-relaxed group-hover:text-gray-700 transition-colors">
        {issue.summary}
      </h3>

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50 pl-1">
        {issue.priority ? (
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
            issue.priority === 'High' ? "bg-red-50 text-red-600" :
            issue.priority === 'Medium' ? "bg-amber-50 text-amber-600" :
            "bg-blue-50 text-blue-600"
          )}>
            <span className={cn(
              "w-1.5 h-1.5 rounded-full",
              issue.priority === 'High' ? "bg-red-500" :
              issue.priority === 'Medium' ? "bg-amber-500" :
              "bg-blue-500"
            )} />
            {issue.priority}
          </div>
        ) : <div />}
        
        {issue.status === 'in-progress' && (
          <div className={cn(
            "text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
            isCompleted ? "bg-emerald-100 text-emerald-700" : "text-gray-900 bg-gray-100"
          )}>
            {isCompleted && <CheckCircle2 className="w-3 h-3" />}
            {issue.progress}%
          </div>
        )}
      </div>
    </div>
  );
}
