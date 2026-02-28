import { CheckCircle2, Circle } from 'lucide-react';
import { Issue } from '../../types';
import { cn } from '../../utils/cn';

interface IssueListProps {
  issues: Issue[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function IssueList({ issues, selectedId, onSelect }: IssueListProps) {
  return (
    <div className="w-80 flex-shrink-0 bg-[#F9F9F9] flex flex-col">
      <div className="p-6">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Tasks to Estimate</h2>
        <p className="text-sm text-slate-500 mt-1">{issues.length} tasks pending</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {issues.map(issue => (
          <button
            key={issue.id}
            onClick={() => onSelect(issue.id)}
            className={cn(
              "w-full text-left p-4 rounded-xl border transition-all duration-200",
              selectedId === issue.id
                ? "bg-white border-blue-500 shadow-md ring-1 ring-blue-500/10"
                : "bg-white border-transparent shadow-sm hover:shadow-md"
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 tracking-tight">{issue.key}</span>
              {issue.estimated ? (
                <div className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{issue.storyPoints}</span>
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="text-[10px] text-slate-400">?</span>
                </div>
              )}
            </div>
            <h3 className={cn(
              "text-sm font-medium line-clamp-2",
              selectedId === issue.id ? "text-slate-900" : "text-slate-600"
            )}>
              {issue.summary}
            </h3>
          </button>
        ))}
      </div>
    </div>
  );
}
