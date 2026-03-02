import { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { IssueList } from './IssueList';
import { EstimationBoard } from './EstimationBoard';

export function PlanningView() {
  const { issues, currentIssueId, setCurrentIssue } = useStore();
  const backlogIssues = issues.filter(i => !i.estimated);
  
  // Set initial selected issue if none selected
  useEffect(() => {
    if (!currentIssueId && backlogIssues.length > 0) {
      setCurrentIssue(backlogIssues[0].id);
    }
  }, [currentIssueId, backlogIssues, setCurrentIssue]);

  const selectedIssue = issues.find(i => i.id === currentIssueId) || null;

  return (
    <div className="flex-1 flex overflow-hidden">
      <IssueList 
        issues={backlogIssues} 
        selectedId={currentIssueId} 
        onSelect={setCurrentIssue} 
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
