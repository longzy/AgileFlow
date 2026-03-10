import { StateCreator } from 'zustand';
import { User } from '../../types/index';
import { socketService } from '../../services/socketService';
import { AppState } from '../useStore';

export interface AuthSlice {
  currentUser: User | null;
  login: (username: string) => void;
  logout: () => void;
}

export const createAuthSlice: StateCreator<AppState, [], [], AuthSlice> = (set, get) => ({
  currentUser: null,
  login: (username) => {
    const newUser = {
      id: `user-${Date.now()}`,
      name: username,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      isHost: false
    };
    
    set({ currentUser: newUser });
    
    // Trigger initSocket from planning slice
    get().initSocket();
  },
  logout: () => {
    const { selectedBoard } = get();
    if (selectedBoard) {
      socketService.leaveBoard(selectedBoard.id);
    }
    socketService.disconnect();
    set({ currentUser: null, selectedBoard: null });
    localStorage.removeItem('app-storage');
  }
});
