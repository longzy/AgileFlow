import { StateCreator } from 'zustand';
import { Vote, User } from '../../types/index';
import { socketService } from '../../services/socketService';

export interface PlanningSlice {
  votes: Vote[];
  revealed: boolean;
  consensus: number | null;
  currentIssueId: string | null;
  hostId: string | null;
  onlineUsers: User[];
  setCurrentIssue: (issueId: string | null) => void;
  initSocket: () => void;
  joinRoom: (roomId: string) => void;
  claimHost: (boardId: string) => void;
  submitVote: (roomId: string, points: number) => void;
  revealVotes: (roomId: string) => void;
  resetVotes: (roomId: string) => void;
}

export const createPlanningSlice: StateCreator<any, [], [], PlanningSlice> = (set, get) => ({
  votes: [],
  revealed: false,
  consensus: null,
  currentIssueId: null,
  hostId: null,
  onlineUsers: [],

  setCurrentIssue: (issueId) => {
    set({ currentIssueId: issueId });
    const { selectedBoard } = get() as any;
    if (selectedBoard) {
      socketService.updateCurrentIssue(selectedBoard.id, issueId);
    }
  },
  
  initSocket: () => {
    const { currentUser } = get() as any;
    if (!currentUser) return;

    socketService.connect();
    socketService.userJoined(currentUser);
    
    socketService.on("connect", () => {
      const { selectedBoard, currentUser, currentIssueId } = get() as any;
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
    
    socketService.on("board_users", (users: User[]) => {
      set({ onlineUsers: users });
    });

    socketService.on("issue_updated", (updatedIssue: any) => {
      set(state => ({
        issues: state.issues.map((i: any) => i.id === updatedIssue.id ? updatedIssue : i)
      }));
    });

    socketService.on("current_issue_updated", (issueId: string) => {
      set({ currentIssueId: issueId });
    });

    socketService.on("board_host", (hostId: string) => {
      set({ hostId });
    });
  },

  joinRoom: (roomId) => {
    socketService.joinRoom(roomId);
  },
  
  claimHost: (boardId) => {
    const { currentUser } = get() as any;
    if (currentUser) {
      socketService.claimHost(boardId, currentUser.id);
    }
  },

  submitVote: (roomId, points) => {
    const { currentUser } = get() as any;
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
});
