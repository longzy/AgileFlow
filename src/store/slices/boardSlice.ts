import { StateCreator } from 'zustand';
import { toast } from 'react-hot-toast';
import { Board, User, Sprint, Group } from '../../types/index';
import { socketService } from '../../services/socketService';
import { AppState } from '../useStore';

export interface BoardSlice {
  boards: Board[];
  selectedBoard: Board | null;
  users: User[];
  groups: Group[];
  selectedGroup: string;
  sprint: Sprint | null;
  fetchBoards: () => Promise<void>;
  selectBoard: (board: Board) => void;
  clearSelectedBoard: () => void;
  fetchBoardData: (sprintState?: 'active' | 'future') => Promise<void>;
  fetchProjectUsers: (boardId: string, group?: string) => Promise<void>;
  fetchGroups: () => Promise<void>;
  setSelectedGroup: (group: string) => void;
}

export const createBoardSlice: StateCreator<AppState, [], [], BoardSlice> = (set, get) => ({
  boards: [],
  selectedBoard: null,
  users: [],
  groups: [],
  selectedGroup: '软件部门',
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
    get().fetchBoardData();
  },

  clearSelectedBoard: () => {
    const { selectedBoard } = get();
    if (selectedBoard) {
      socketService.leaveBoard(selectedBoard.id);
    }
    set({ selectedBoard: null, sprint: null, issues: [], users: [] });
  },

  fetchBoardData: async (sprintState = 'active') => {
    const { selectedBoard, currentUser, selectedGroup } = get();
    if (!selectedBoard || !currentUser) return;
    
    socketService.joinBoard(selectedBoard.id, currentUser);

    set({ isLoading: true, error: null });
    try {
      const [boardRes, usersRes] = await Promise.all([
        fetch(`/api/jira/board-data?boardId=${selectedBoard.id}&state=${sprintState}`),
        fetch(`/api/jira/board/${selectedBoard.id}/users?group=${encodeURIComponent(selectedGroup)}`)
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

  fetchProjectUsers: async (boardId, groupOverride) => {
    try {
      const group = groupOverride || get().selectedGroup;
      const res = await fetch(`/api/jira/board/${boardId}/users?group=${encodeURIComponent(group)}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const users = await res.json();
      set({ users });
    } catch (error) {
      console.error(error);
    }
  },

  fetchGroups: async () => {
    try {
      const res = await fetch('/api/jira/groups');
      if (!res.ok) throw new Error('Failed to fetch groups');
      const groups = await res.json();
      set({ groups });
    } catch (error) {
      console.error(error);
    }
  },

  setSelectedGroup: (group: string) => {
    set({ selectedGroup: group, users: [] });
    const { selectedBoard } = get();
    if (selectedBoard) {
      get().fetchProjectUsers(selectedBoard.id, group);
    }
  }
});
