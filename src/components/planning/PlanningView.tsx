import { useEffect } from 'react';
// Force UI sync
import { useStore } from '../../store/useStore';
import { IssueList } from './IssueList';
import { EstimationBoard } from './EstimationBoard';

export function PlanningView() {
  const { issues, currentIssueId, setCurrentIssue, isLoading } = useStore();
  const backlogIssues = issues.filter(i => !i.estimated);
  
  // Set initial selected issue if none selected
  useEffect(() => {
    if (!currentIssueId && backlogIssues.length > 0 && !isLoading) {
      setCurrentIssue(backlogIssues[0].id);
    }
  }, [currentIssueId, backlogIssues, setCurrentIssue, isLoading]);

  const selectedIssue = issues.find(i => i.id === currentIssueId) || null;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-500">Loading planning data...</p>
        </div>
      </div>
    );
  }

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
          <div className="h-full flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
            Select a task to start estimation
          </div>
        )}
      </div>
    </div>
  );
}
