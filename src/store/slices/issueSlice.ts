import { StateCreator } from 'zustand';
import { Issue, IssueStatus, User } from '../../types/index';
import { socketService } from '../../services/socketService';
import { toast } from 'react-hot-toast';
import { arrayMove } from '@dnd-kit/sortable';

export interface IssueSlice {
  issues: Issue[];
  isLoading: boolean;
  error: string | null;
  updateIssueStatus: (id: string, status: IssueStatus) => void;
  updateIssuePoints: (id: string, points: number) => void;
  updateIssueProgress: (id: string, progress: number) => void;
  assignUser: (issueId: string, userId: string) => void;
  reorderIssues: (activeId: string, overId: string) => void;
}

export const createIssueSlice: StateCreator<any, [], [], IssueSlice> = (set, get) => ({
  issues: [],
  isLoading: false,
  error: null,

  updateIssueStatus: (id, status) => {
    const { issues, selectedBoard } = get() as any;
    const issue = issues.find((i: Issue) => i.id === id);
    if (!issue) return;
    
    const oldStatus = issue.status;
    const updatedIssues = issues.map((i: Issue) => i.id === id ? { 
      ...i, 
      status,
      progress: status === 'todo' ? 0 : (status === 'done' ? 100 : i.progress)
    } : i);
    
    // Broadcast update
    const updatedIssue = updatedIssues.find((i: Issue) => i.id === id);
    if (updatedIssue && selectedBoard) {
      socketService.updateIssue(selectedBoard.id, updatedIssue);
    }

    // Call API in background if status changed
    if (oldStatus !== status) {
      let statusCategory = 'new';
      if (status === 'in-progress' || status === 'pending') statusCategory = 'indeterminate';
      if (status === 'done') statusCategory = 'done';
      
      fetch(`/api/jira/issue/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusCategory })
      })
      .then(res => { if (!res.ok) throw new Error('Failed to update status'); })
      .catch(err => {
        console.error('Failed to update status', err);
        toast.error('Failed to update status');
      });

      // Update pending custom field
      const isPending = status === 'pending';
      fetch(`/api/jira/issue/${id}/pending`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPending })
      })
      .then(res => { if (!res.ok) throw new Error('Failed to update pending status'); })
      .catch(err => {
        console.error('Failed to update pending status', err);
        toast.error('Failed to update pending status');
      });
    }

    set({ issues: updatedIssues });
  },

  updateIssuePoints: (id, points) => {
    const { issues, selectedBoard } = get() as any;
    const updatedIssues = issues.map((i: Issue) => i.id === id ? { ...i, storyPoints: points, estimated: true } : i);
    
    // Broadcast update
    const updatedIssue = updatedIssues.find((i: Issue) => i.id === id);
    if (updatedIssue && selectedBoard) {
      socketService.updateIssue(selectedBoard.id, updatedIssue);
    }

    // Reset server room state (clear votes and consensus)
    socketService.reset(id);

    // Call API in background
    fetch(`/api/jira/issue/${id}/points`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points })
    })
    .then(res => { if (!res.ok) throw new Error('Failed to update points'); })
    .catch(err => {
      console.error('Failed to update points', err);
      toast.error('Failed to update points');
    });

    // Find next unestimated issue
    const currentIndex = updatedIssues.findIndex((i: Issue) => i.id === id);
    let nextIssue = updatedIssues.slice(currentIndex + 1).find((i: Issue) => !i.estimated);
    
    if (!nextIssue) {
      nextIssue = updatedIssues.slice(0, currentIndex).find((i: Issue) => !i.estimated);
    }

    if (nextIssue) {
      setTimeout(() => {
        (get() as any).setCurrentIssue(nextIssue.id);
      }, 100);
    } else {
      (get() as any).setCurrentIssue(null);
    }

    set({ 
      issues: updatedIssues,
      votes: [],
      revealed: false,
      consensus: null
    });
  },

  updateIssueProgress: (id, progress) => {
    const { issues, selectedBoard } = get() as any;
    const issueIndex = issues.findIndex((i: Issue) => i.id === id);
    if (issueIndex === -1) return;

    const issue = issues[issueIndex];
    const wasTodo = issue.status === 'todo';
    const newStatus = progress === 100 ? 'done' : 'in-progress';
    
    // Optimistic update
    let newIssues = [...issues];
    let updatedIssue;
    
    if (wasTodo && newStatus === 'in-progress') {
      newIssues.splice(issueIndex, 1);
      // Keep existing assignee if present, otherwise it remains undefined
      updatedIssue = { ...issue, progress, status: newStatus };
      newIssues.push(updatedIssue);
    } else {
      updatedIssue = { ...issue, progress, status: newStatus };
      newIssues[issueIndex] = updatedIssue;
    }

    // Broadcast update
    if (selectedBoard) {
      socketService.updateIssue(selectedBoard.id, updatedIssue);
    }

    // Call API in background
    fetch(`/api/jira/issue/${id}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress })
    })
    .then(res => { if (!res.ok) throw new Error('Failed to update progress'); })
    .catch(err => {
      console.error('Failed to update progress', err);
      toast.error('Failed to update progress');
    });

    if (issue.status !== newStatus) {
      let statusCategory = 'new';
      if (newStatus === 'in-progress') statusCategory = 'indeterminate';
      if (newStatus === 'done') statusCategory = 'done';
      
      fetch(`/api/jira/issue/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusCategory })
      })
      .then(res => { if (!res.ok) throw new Error('Failed to update status'); })
      .catch(err => {
        console.error('Failed to update status', err);
        toast.error('Failed to update status');
      });

      // If it was pending and now it's in-progress or done, clear the pending flag
      if (issue.status === 'pending') {
        fetch(`/api/jira/issue/${id}/pending`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPending: false })
        })
        .then(res => { if (!res.ok) throw new Error('Failed to update pending status'); })
        .catch(err => {
          console.error('Failed to update pending status', err);
          toast.error('Failed to update pending status');
        });
      }
    }

    set({ issues: newIssues });
  },

  assignUser: (issueId, userId) => {
    const { issues, selectedBoard, users } = get() as any;
    const user = users.find((u: User) => u.id === userId);
    if (!user) return;

    const updatedIssues = issues.map((i: Issue) => i.id === issueId ? { ...i, assignee: user } : i);
    
    // Broadcast update
    const updatedIssue = updatedIssues.find((i: Issue) => i.id === issueId);
    if (updatedIssue && selectedBoard) {
      socketService.updateIssue(selectedBoard.id, updatedIssue);
    }

    // Call API in background
    fetch(`/api/jira/issue/${issueId}/assignee`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })
    .then(res => { if (!res.ok) throw new Error('Failed to update assignee'); })
    .catch(err => {
      console.error('Failed to update assignee', err);
      toast.error('Failed to update assignee');
    });

    set({ issues: updatedIssues });
  },

  reorderIssues: (activeId, overId) => {
    const { issues } = get() as any;
    const oldIndex = issues.findIndex((i: Issue) => i.id === activeId);
    const newIndex = issues.findIndex((i: Issue) => i.id === overId);
    set({
      issues: arrayMove(issues, oldIndex, newIndex)
    });
  }
});
