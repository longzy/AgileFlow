import { useDroppable } from '@dnd-kit/core';
// Force UI sync
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Issue } from '../../types';
import { IssueCard } from './IssueCard';
import { cn } from '../../utils/cn';

export function BacklogSidebar({ issues }: { issues: Issue[] }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'todo',
  });

  return (
    <div className="w-80 flex-shrink-0 bg-[#F9F9F9] flex flex-col">
      <div className="p-6">
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">Sprint Backlog</h2>
        <p className="text-sm text-gray-500 mt-1">Drag to right to start</p>
      </div>
      <div 
        ref={setNodeRef}
        className={cn(
          "flex-1 overflow-y-auto px-4 pb-4 space-y-3 transition-colors duration-200",
          isOver && "bg-gray-100"
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
