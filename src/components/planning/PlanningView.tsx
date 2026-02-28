import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { IssueList } from './IssueList';
import { EstimationBoard } from './EstimationBoard';

export function PlanningView() {
  const { issues } = useStore();
  const backlogIssues = issues.filter(i => !i.estimated);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(backlogIssues[0]?.id || null);

  const selectedIssue = issues.find(i => i.id === selectedIssueId) || null;

  return (
    <div className="flex-1 flex overflow-hidden">
      <IssueList 
        issues={backlogIssues} 
        selectedId={selectedIssueId} 
        onSelect={setSelectedIssueId} 
      />
      <div className="flex-1 bg-white p-8 overflow-y-auto">
        {selectedIssue ? (
          <EstimationBoard issue={selectedIssue} />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
            Select a task to start estimation
          </div>
        )}
      </div>
    </div>
  );
}
