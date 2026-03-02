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
    <div className="w-80 flex-shrink-0 bg-[#F9F9F9] flex flex-col border-r border-slate-100 h-full">
      <div className="p-6 border-b border-slate-100 bg-white">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Tasks to Estimate</h2>
        <p className="text-sm text-slate-500 mt-1 font-medium">{issues.length} tasks pending</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {issues.map(issue => (
          <button
            key={issue.id}
            onClick={() => onSelect(issue.id)}
            className={cn(
              "w-full text-left p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden",
              selectedId === issue.id
                ? "bg-white border-slate-900 shadow-md ring-1 ring-slate-900/5"
                : "bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm"
            )}
          >
            {selectedId === issue.id && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-900" />
            )}
            <div className="flex items-start justify-between mb-2">
              <span className={cn(
                "text-xs font-bold tracking-wider px-2 py-0.5 rounded-md",
                selectedId === issue.id ? "bg-slate-100 text-slate-900" : "bg-slate-50 text-slate-500"
              )}>
                {issue.key}
              </span>
              {issue.estimated ? (
                <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{issue.storyPoints}</span>
                </div>
              ) : (
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center transition-colors",
                  selectedId === issue.id ? "bg-slate-100 text-slate-600" : "bg-slate-50 text-slate-300"
                )}>
                  <span className="text-[10px] font-bold">?</span>
                </div>
              )}
            </div>
            <h3 className={cn(
              "text-sm font-medium line-clamp-2 leading-relaxed",
              selectedId === issue.id ? "text-slate-900" : "text-slate-600 group-hover:text-slate-900"
            )}>
              {issue.summary}
            </h3>
          </button>
        ))}
      </div>
    </div>
  );
}
