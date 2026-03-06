import { create } from 'zustand';
// Force UI sync
import { persist, createJSONStorage } from 'zustand/middleware';
import { Issue, Sprint, User, IssueStatus, Vote, Board } from '../types';
import { arrayMove } from '@dnd-kit/sortable';
import { socketService } from '../services/socketService';
import { toast } from 'react-hot-toast';

interface AppState {
  users: User[];
  currentUser: User | null;
  sprint: Sprint | null;
  issues: Issue[];
  isLoading: boolean;
  error: string | null;
  
  // Board state
  boards: Board[];
  selectedBoard: Board | null;

  // Real-time state
  votes: Vote[];
  revealed: boolean;
  consensus: number | null;
  currentIssueId: string | null;
  hostId: string | null;

  setCurrentIssue: (issueId: string | null) => void;
  updateIssueStatus: (id: string, status: IssueStatus) => void;
  updateIssuePoints: (id: string, points: number) => void;
  updateIssueProgress: (id: string, progress: number) => void;
  assignUser: (issueId: string, userId: string) => void;
  reorderIssues: (activeId: string, overId: string) => void;
  login: (username: string) => void;
  logout: () => void;
  initSocket: () => void;
  fetchBoards: () => Promise<void>;
  selectBoard: (board: Board) => void;
  clearSelectedBoard: () => void;
  fetchBoardData: (sprintState?: 'active' | 'future') => Promise<void>;
  fetchProjectUsers: (boardId: string) => Promise<void>;
  
  // Socket actions
  joinRoom: (roomId: string) => void;
  claimHost: (boardId: string) => void;
  submitVote: (roomId: string, points: number) => void;
  revealVotes: (roomId: string) => void;
  resetVotes: (roomId: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      users: [],
      currentUser: null,
      sprint: null,
      issues: [],
      isLoading: false,
      error: null,
      
      boards: [],
      selectedBoard: null,

      votes: [],
      revealed: false,
      consensus: null,
      currentIssueId: null,
      hostId: null,

      setCurrentIssue: (issueId) => {
        set({ currentIssueId: issueId });
        const { selectedBoard } = get();
        if (selectedBoard) {
          socketService.updateCurrentIssue(selectedBoard.id, issueId);
        }
      },
      
      initSocket: () => {
        const { currentUser } = get();
        if (!currentUser) return;

        // Connect to socket
        socketService.connect();
        socketService.userJoined(currentUser);
        
        // Listen for updates
        socketService.on("connect", () => {
          const { selectedBoard, currentUser, currentIssueId } = get();
          if (selectedBoard && currentUser) {
            socketService.joinBoard(selectedBoard.id, currentUser);
          }
          if (currentIssueId) {
            socketService.joinRoom(currentIssueId);
          }
        });

        socketService.on("room_state", (state: any) => {
          set({ 
            votes: state.votes, 
            revealed: state.revealed, 
            consensus: state.consensus 
          });
        });
        
        socketService.on("user_joined", (user: User) => {
          // Deprecated: handled by board_users
        });

        socketService.on("board_users", (users: User[]) => {
          set({ users });
        });

        socketService.on("issue_updated", (updatedIssue: Issue) => {
          set(state => ({
            issues: state.issues.map(i => i.id === updatedIssue.id ? updatedIssue : i)
          }));
        });

        socketService.on("current_issue_updated", (issueId: string) => {
          set({ currentIssueId: issueId });
        });

        socketService.on("board_host", (hostId: string) => {
          set({ hostId });
        });
      },

      login: (username) => {
        const newUser = {
          id: `user-${Date.now()}`,
          name: username,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
          isHost: false
        };
        
        set((state) => ({
          currentUser: newUser,
          users: [...state.users, newUser]
        }));
        
        get().initSocket();
      },

      logout: () => {
        const { selectedBoard } = get();
        if (selectedBoard) {
          socketService.leaveBoard(selectedBoard.id);
        }
        socketService.disconnect();
        set({ currentUser: null, selectedBoard: null });
        localStorage.removeItem('app-storage'); // Optional: clear storage
      },

      fetchBoards: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/jira/boards');
          if (!res.ok) throw new Error('Failed to fetch boards');
          const data = await res.json();
          set({ boards: data.boards, isLoading: false });
        } catch (error) {
          console.error(error);
          toast.error('Failed to load boards');
          set({ error: 'Failed to load boards', isLoading: false });
        }
      },

      selectBoard: (board) => {
        set({ selectedBoard: board });
        get().fetchBoardData();
      },

      clearSelectedBoard: () => {
        const { selectedBoard } = get();
        if (selectedBoard) {
          socketService.leaveBoard(selectedBoard.id);
        }
        set({ selectedBoard: null, sprint: null, issues: [], users: [] });
      },

      updateIssueStatus: (id, status) => set((state) => {
        const issue = state.issues.find(i => i.id === id);
        if (!issue) return state;
        
        const oldStatus = issue.status;
        const updatedIssues = state.issues.map(i => i.id === id ? { 
          ...i, 
          status,
          progress: status === 'todo' ? 0 : (status === 'done' ? 100 : i.progress)
        } : i);
        
        // Broadcast update
        const updatedIssue = updatedIssues.find(i => i.id === id);
        if (updatedIssue && state.selectedBoard) {
          socketService.updateIssue(state.selectedBoard.id, updatedIssue);
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
          }).catch(err => {
            console.error('Failed to update status', err);
            toast.error('Failed to update status');
          });

          // Update pending custom field
          const isPending = status === 'pending';
          fetch(`/api/jira/issue/${id}/pending`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isPending })
          }).catch(err => {
            console.error('Failed to update pending status', err);
            toast.error('Failed to update pending status');
          });
        }

        return { issues: updatedIssues };
      }),

      updateIssuePoints: (id, points) => set((state) => {
        const updatedIssues = state.issues.map(i => i.id === id ? { ...i, storyPoints: points, estimated: true } : i);
        
        // Broadcast update
        const updatedIssue = updatedIssues.find(i => i.id === id);
        if (updatedIssue && state.selectedBoard) {
          socketService.updateIssue(state.selectedBoard.id, updatedIssue);
        }

        // Reset server room state (clear votes and consensus)
        socketService.reset(id);

        // Call API in background
        fetch(`/api/jira/issue/${id}/points`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ points })
        }).catch(err => {
          console.error('Failed to update points', err);
          toast.error('Failed to update points');
        });

        // Reset voting state immediately to prevent UI flicker
        // We don't broadcast reset here because we are about to switch rooms
        // But we want the local UI to clear the "Consensus" state
        
        // Find next unestimated issue
        // 1. Search after current index
        const currentIndex = updatedIssues.findIndex(i => i.id === id);
        let nextIssue = updatedIssues.slice(currentIndex + 1).find(i => !i.estimated);
        
        // 2. If not found, search from beginning
        if (!nextIssue) {
          nextIssue = updatedIssues.slice(0, currentIndex).find(i => !i.estimated);
        }

        if (nextIssue) {
          // Defer the switch slightly to allow UI to update
          setTimeout(() => {
            get().setCurrentIssue(nextIssue.id);
          }, 100);
        } else {
          // No more issues, clear current issue
          get().setCurrentIssue(null);
        }

        return { 
          issues: updatedIssues,
          votes: [],
          revealed: false,
          consensus: null
        };
      }),

      updateIssueProgress: (id, progress) => set((state) => {
        const issueIndex = state.issues.findIndex(i => i.id === id);
        if (issueIndex === -1) return state;

        const issue = state.issues[issueIndex];
        const wasTodo = issue.status === 'todo';
        const newStatus = progress === 100 ? 'done' : 'in-progress';
        
        // Optimistic update
        let newIssues = [...state.issues];
        let updatedIssue;
        
        if (wasTodo && newStatus === 'in-progress') {
          newIssues.splice(issueIndex, 1);
          updatedIssue = { ...issue, progress, status: newStatus };
          newIssues.push(updatedIssue);
        } else {
          updatedIssue = { ...issue, progress, status: newStatus };
          newIssues[issueIndex] = updatedIssue;
        }

        // Broadcast update
        if (state.selectedBoard) {
          socketService.updateIssue(state.selectedBoard.id, updatedIssue);
        }

        // Call API in background
        fetch(`/api/jira/issue/${id}/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ progress })
        }).catch(err => {
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
          }).catch(err => {
            console.error('Failed to update status', err);
            toast.error('Failed to update status');
          });

          // If it was pending and now it's in-progress or done, clear the pending flag
          if (issue.status === 'pending') {
            fetch(`/api/jira/issue/${id}/pending`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isPending: false })
            }).catch(err => {
              console.error('Failed to update pending status', err);
              toast.error('Failed to update pending status');
            });
          }
        }

        return { issues: newIssues };
      }),

      assignUser: (issueId, userId) => set((state) => {
        const user = state.users.find(u => u.id === userId);
        if (!user) return state;

        const updatedIssues = state.issues.map(i => i.id === issueId ? { ...i, assignee: user } : i);
        
        // Broadcast update
        const updatedIssue = updatedIssues.find(i => i.id === issueId);
        if (updatedIssue && state.selectedBoard) {
          socketService.updateIssue(state.selectedBoard.id, updatedIssue);
        }

        // Call API in background
        fetch(`/api/jira/issue/${issueId}/assignee`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        }).catch(err => {
          console.error('Failed to update assignee', err);
          toast.error('Failed to update assignee');
        });

        return { issues: updatedIssues };
      }),

      reorderIssues: (activeId, overId) => set((state) => {
        const oldIndex = state.issues.findIndex(i => i.id === activeId);
        const newIndex = state.issues.findIndex(i => i.id === overId);
        return {
          issues: arrayMove(state.issues, oldIndex, newIndex)
        };
      }),

      fetchBoardData: async (sprintState = 'active') => {
        const { selectedBoard, currentUser } = get();
        if (!selectedBoard || !currentUser) return;
        
        // Join board room
        socketService.joinBoard(selectedBoard.id, currentUser);

        set({ isLoading: true, error: null });
        try {
          // Fetch board data and users in parallel
          const [boardRes, usersRes] = await Promise.all([
            fetch(`/api/jira/board-data?boardId=${selectedBoard.id}&state=${sprintState}`),
            fetch(`/api/jira/board/${selectedBoard.id}/users`)
          ]);

          if (!boardRes.ok) throw new Error('Failed to fetch board data');
          
          const data = await boardRes.json();
          
          let projectUsers: User[] = [];
          if (usersRes.ok) {
            projectUsers = await usersRes.json();
          }
          
          set({
            users: projectUsers.length > 0 ? projectUsers : get().users,
            sprint: data.sprint,
            issues: data.issues,
            isLoading: false
          });
        } catch (error) {
          console.error(error);
          toast.error('Failed to load data');
          set({ error: 'Failed to load data', isLoading: false });
        }
      },

      fetchProjectUsers: async (boardId) => {
        try {
          const res = await fetch(`/api/jira/board/${boardId}/users`);
          if (!res.ok) throw new Error('Failed to fetch users');
          const users = await res.json();
          set({ users });
        } catch (error) {
          console.error(error);
          // Don't show toast here to avoid spamming if it fails silently
        }
      },

      // Socket actions
      joinRoom: (roomId) => {
        socketService.joinRoom(roomId);
      },
      
      claimHost: (boardId) => {
        const { currentUser } = get();
        if (currentUser) {
          socketService.claimHost(boardId, currentUser.id);
        }
      },

      submitVote: (roomId, points) => {
        const { currentUser } = get();
        if (currentUser) {
          socketService.vote(roomId, currentUser.id, points);
        }
      },
      
      revealVotes: (roomId) => {
        socketService.reveal(roomId);
      },
      
      resetVotes: (roomId) => {
        socketService.reset(roomId);
      }
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({ currentUser: state.currentUser, selectedBoard: state.selectedBoard }),
    }
  )
);
