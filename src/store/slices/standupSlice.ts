import { StateCreator } from 'zustand';
import { AppState } from '../useStore';

export interface StandupSlice {
  isStandupActive: boolean;
  currentStandupIssueId: string | null;
  standupTimeLeft: number; // in seconds
  isStandupMuted: boolean;
  isStandupPaused: boolean;
  isStandupTransitioning: boolean;
  
  startStandup: () => void;
  stopStandup: () => void;
  pauseStandup: () => void;
  resumeStandup: () => void;
  skipStandupIssue: () => void;
  setStandupTimeLeft: (time: number) => void;
  toggleStandupMute: () => void;
  nextStandupIssue: () => void;
  setStandupTransitioning: (isTransitioning: boolean) => void;
}

export const createStandupSlice: StateCreator<AppState, [], [], StandupSlice> = (set, get) => ({
  isStandupActive: false,
  currentStandupIssueId: null,
  standupTimeLeft: 120, // 2 minutes
  isStandupMuted: false,
  isStandupPaused: false,
  isStandupTransitioning: false,

  startStandup: () => {
    const issues = get().issues;
    const activeIssues = issues.filter(i => i.status !== 'todo' && i.status !== 'backlog' && (i.progress || 0) < 100);
    if (activeIssues.length === 0) return;

    set({
      isStandupActive: true,
      currentStandupIssueId: activeIssues[0].id,
      standupTimeLeft: 120,
      isStandupPaused: false,
    });
  },

  stopStandup: () => {
    set({
      isStandupActive: false,
      currentStandupIssueId: null,
      isStandupPaused: false,
    });
  },

  pauseStandup: () => {
    set({ isStandupPaused: true });
  },

  resumeStandup: () => {
    set({ isStandupPaused: false });
  },

  setStandupTimeLeft: (time) => {
    set({ standupTimeLeft: time });
  },

  toggleStandupMute: () => {
    set((state) => ({ isStandupMuted: !state.isStandupMuted }));
  },

  setStandupTransitioning: (isTransitioning) => {
    set({ isStandupTransitioning: isTransitioning });
  },

  nextStandupIssue: () => {
    const { issues, currentStandupIssueId } = get();
    // Candidates are all issues in the active area (not todo/backlog)
    const candidates = issues.filter(i => i.status !== 'todo' && i.status !== 'backlog');
    const currentIndex = candidates.findIndex(i => i.id === currentStandupIssueId);
    
    // Find the next issue in the list that is not yet completed
    const nextIncompleteIssue = candidates.slice(currentIndex + 1).find(i => (i.progress || 0) < 100);
    
    if (nextIncompleteIssue) {
      set({
        currentStandupIssueId: nextIncompleteIssue.id,
        standupTimeLeft: 120,
        isStandupTransitioning: false,
      });
    } else {
      get().stopStandup();
      set({ isStandupTransitioning: false });
    }
  },

  skipStandupIssue: () => {
    get().nextStandupIssue();
  },
});
