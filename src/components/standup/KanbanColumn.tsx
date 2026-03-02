import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Issue, IssueStatus } from '../../types';
import { IssueCard } from './IssueCard';
import { cn } from '../../utils/cn';

interface KanbanColumnProps {
  key?: string | number;
  column: { id: IssueStatus; title: string };
  issues: Issue[];
}

export function KanbanColumn({ column, issues }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div className="flex flex-col w-80 shrink-0">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="font-semibold text-gray-200">{column.title}</h3>
        <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs font-medium text-gray-400">
          {issues.length}
        </span>
      </div>
      
      <div 
        ref={setNodeRef}
        className={cn(
          "flex-1 p-3 rounded-2xl border transition-colors duration-200 flex flex-col gap-3",
          isOver ? "bg-white/10 border-white/20" : "bg-white/5 border-white/5"
        )}
      >
        <SortableContext items={issues.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {issues.map(issue => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
