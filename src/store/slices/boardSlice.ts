import { StateCreator } from 'zustand';
import { Board, User, Sprint } from '../../types/index';
import { socketService } from '../../services/socketService';
import { toast } from 'react-hot-toast';

export interface BoardSlice {
  boards: Board[];
  selectedBoard: Board | null;
  users: User[];
  sprint: Sprint | null;
  fetchBoards: () => Promise<void>;
  selectBoard: (board: Board) => void;
  clearSelectedBoard: () => void;
  fetchBoardData: (sprintState?: 'active' | 'future') => Promise<void>;
  fetchProjectUsers: (boardId: string) => Promise<void>;
}

export const createBoardSlice: StateCreator<any, [], [], BoardSlice> = (set, get) => ({
  boards: [],
  selectedBoard: null,
  users: [],
  sprint: null,
  
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
    (get() as any).fetchBoardData();
  },

  clearSelectedBoard: () => {
    const { selectedBoard } = get() as any;
    if (selectedBoard) {
      socketService.leaveBoard(selectedBoard.id);
    }
    set({ selectedBoard: null, sprint: null, issues: [], users: [] });
  },

  fetchBoardData: async (sprintState = 'active') => {
    const { selectedBoard, currentUser } = get() as any;
    if (!selectedBoard || !currentUser) return;
    
    socketService.joinBoard(selectedBoard.id, currentUser);

    set({ isLoading: true, error: null });
    try {
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
        users: projectUsers.length > 0 ? projectUsers : (get() as any).users,
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
    }
  }
});
