import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Issue, Sprint, User, IssueStatus, Vote, Board } from '../types';
import { arrayMove } from '@dnd-kit/sortable';
import { socketService } from '../services/socketService';

interface AppState {
  users: User[];
  currentUser: User | null;
  sprint: Sprint | null;
  issues: Issue[];
  activeView: 'planning' | 'standup';
  isLoading: boolean;
  error: string | null;
  
  // Board state
  boards: Board[];
  selectedBoard: Board | null;

  // Real-time state
  votes: Vote[];
  revealed: boolean;
  consensus: number | null;

  setActiveView: (view: 'planning' | 'standup') => void;
  updateIssueStatus: (id: string, status: IssueStatus) => void;
  updateIssuePoints: (id: string, points: number) => void;
  updateIssueProgress: (id: string, progress: number) => void;
  reorderIssues: (activeId: string, overId: string) => void;
  login: (username: string) => void;
  logout: () => void;
  initSocket: () => void;
  fetchBoards: () => Promise<void>;
  selectBoard: (board: Board) => void;
  clearSelectedBoard: () => void;
  fetchBoardData: () => Promise<void>;
  
  // Socket actions
  joinRoom: (roomId: string) => void;
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
      activeView: 'planning',
      isLoading: false,
      error: null,
      
      boards: [],
      selectedBoard: null,

      votes: [],
      revealed: false,
      consensus: null,

      setActiveView: (view) => set({ activeView: view }),
      
      initSocket: () => {
        const { currentUser } = get();
        if (!currentUser) return;

        // Connect to socket
        socketService.connect();
        socketService.userJoined(currentUser);
        
        // Listen for updates
        socketService.on("room_state", (state: any) => {
          set({ 
            votes: state.votes, 
            revealed: state.revealed, 
            consensus: state.consensus 
          });
        });
        
        socketService.on("user_joined", (user: User) => {
          set(state => {
            if (state.users.find(u => u.id === user.id)) return state;
            return { users: [...state.users, user] };
          });
        });

        socketService.on("issue_updated", (updatedIssue: Issue) => {
          set(state => ({
            issues: state.issues.map(i => i.id === updatedIssue.id ? updatedIssue : i)
          }));
        });
      },

      login: (username) => {
        const newUser = {
          id: `user-${Date.now()}`,
          name: username,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
        };
        
        set((state) => ({
          currentUser: newUser,
          users: [...state.users, newUser]
        }));
        
        get().initSocket();
      },

      logout: () => {
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

        return { issues: updatedIssues };
      }),

      updateIssuePoints: (id, points) => set((state) => {
        const updatedIssues = state.issues.map(i => i.id === id ? { ...i, storyPoints: points, estimated: true } : i);
        
        // Broadcast update
        const updatedIssue = updatedIssues.find(i => i.id === id);
        if (updatedIssue && state.selectedBoard) {
          socketService.updateIssue(state.selectedBoard.id, updatedIssue);
        }

        return { issues: updatedIssues };
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
        }).catch(err => console.error('Failed to update progress', err));

        return { issues: newIssues };
      }),

      reorderIssues: (activeId, overId) => set((state) => {
        const oldIndex = state.issues.findIndex(i => i.id === activeId);
        const newIndex = state.issues.findIndex(i => i.id === overId);
        return {
          issues: arrayMove(state.issues, oldIndex, newIndex)
        };
      }),

      fetchBoardData: async () => {
        const { selectedBoard, currentUser } = get();
        if (!selectedBoard) return;
        
        // Join board room
        socketService.joinBoard(selectedBoard.id);

        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`/api/jira/board-data?boardId=${selectedBoard.id}`);
          if (!res.ok) throw new Error('Failed to fetch board data');
          const data = await res.json();
          
          // If mock data, we might need to adjust it or just use it as is
          // For real data, it will be filtered by boardId on server
          
          // Ensure currentUser is in the users list
          let fetchedUsers = data.users;
          if (currentUser && !fetchedUsers.find((u: User) => u.id === currentUser.id)) {
            fetchedUsers = [...fetchedUsers, currentUser];
          }

          set({
            users: fetchedUsers,
            // currentUser is set via login
            sprint: data.sprint,
            issues: data.issues,
            isLoading: false
          });
        } catch (error) {
          console.error(error);
          set({ error: 'Failed to load data', isLoading: false });
        }
      },

      // Socket actions
      joinRoom: (roomId) => {
        socketService.joinRoom(roomId);
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
