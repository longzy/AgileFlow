import { create } from "zustand";
import { socketService } from "../services/socketService";
import { RetroRoom, RetroStage, RetroCard, RetroActionPoint } from "../../shared/retro";

interface User {
  id: string;
  name: string;
  avatar?: string;
}

interface RetroState {
  room: RetroRoom | null;
  user: User | null;
  onlineUsers: User[];
  error: string | null;
  connect: (roomId: string, user: User, isCreating?: boolean, template?: string) => void;
  disconnect: () => void;
  createRoom: (roomId: string, hostId: string, template: string) => void;
  changeStage: (stage: RetroStage, durationMinutes?: number) => void;
  addCard: (column: string, text: string, anonymous: boolean) => void;
  editCard: (cardId: string, text: string) => void;
  vote: (cardId: string) => void;
  revokeVote: (cardId: string) => void;
  updateAction: (actionId: string, updates: Partial<RetroActionPoint>) => void;
  toggleTimer: () => void;
  mergeCards: (sourceCardId: string, targetCardId: string) => void;
  deleteRoom: () => void;
  sendEmoji: (emoji: string) => void;
}

export const useRetroStore = create<RetroState>((set, get) => ({
  room: null,
  user: null,
  onlineUsers: [],
  error: null,

  connect: (roomId: string, user: User, isCreating?: boolean, template?: string) => {
    const { room } = get();
    
    // If already connected to the same room, do nothing
    if (room?.id === roomId) {
      return;
    }

    socketService.connect();
    
    // Setup listeners
    socketService.on("retro:state", (room: RetroRoom) => {
      set({ room, error: null });
    });

    socketService.on("retro:users", (onlineUsers: User[]) => {
      set({ onlineUsers });
    });

    socketService.on("retro:error", (error: string) => {
      set({ error });
    });

    socketService.on("retro:deleted", () => {
      set({ room: null, error: "Room has been deleted by host" });
      // Use a more React-friendly way to navigate if possible, but for now keeping it simple
      window.location.href = "/retro";
    });

    socketService.on("retro:emoji", ({ emoji, userId }: { emoji: string, userId: string }) => {
      const event = new CustomEvent('retro-emoji', { detail: { emoji, userId } });
      window.dispatchEvent(event);
    });

    // Join or create room
    if (isCreating && template) {
      socketService.retroCreate(roomId, user.id, template, user);
    } else {
      socketService.retroJoin(roomId, user);
    }

    set({ user });
  },

  disconnect: () => {
    const { room } = get();
    if (room) {
      // We don't necessarily want to disconnect the whole socket if other parts of the app use it
      // But for retro, we might want to leave the room
      // socketService.emit("retro:leave", { roomId: room.id, userId: user?.id });
    }
    
    // Remove listeners
    socketService.off("retro:state");
    socketService.off("retro:users");
    socketService.off("retro:error");
    socketService.off("retro:deleted");
    socketService.off("retro:emoji");

    set({ room: null, user: null, error: null });
  },

  createRoom: (roomId: string, hostId: string, template: string) => {
    const { user } = get();
    if (user) {
      socketService.retroCreate(roomId, hostId, template, user);
    }
  },

  deleteRoom: () => {
    const { room, user } = get();
    if (room && user) {
      socketService.retroDeleteRoom(room.id, user.id);
    }
  },

  changeStage: (stage: RetroStage, durationMinutes?: number) => {
    const { room, user } = get();
    if (room && user) {
      socketService.retroChangeStage(room.id, user.id, stage, durationMinutes);
    }
  },

  addCard: (column: string, text: string, anonymous: boolean) => {
    const { room, user } = get();
    if (room && user) {
      socketService.retroAddCard(room.id, user.id, column, text, anonymous);
    }
  },

  editCard: (cardId: string, text: string) => {
    const { room, user } = get();
    if (room && user) {
      socketService.retroEditCard(room.id, user.id, cardId, text);
    }
  },

  vote: (cardId: string) => {
    const { room, user } = get();
    if (room && user) {
      socketService.retroVote(room.id, user.id, cardId);
    }
  },

  revokeVote: (cardId: string) => {
    const { room, user } = get();
    if (room && user) {
      socketService.retroRevokeVote(room.id, user.id, cardId);
    }
  },

  updateAction: (actionId: string, updates: Partial<RetroActionPoint>) => {
    const { room, user } = get();
    if (room && user) {
      socketService.retroUpdateAction(room.id, user.id, actionId, updates);
    }
  },

  toggleTimer: () => {
    const { room, user } = get();
    if (room && user) {
      socketService.retroToggleTimer(room.id, user.id);
    }
  },

  mergeCards: (sourceCardId: string, targetCardId: string) => {
    const { room, user } = get();
    if (room && user) {
      socketService.retroMergeCards(room.id, user.id, sourceCardId, targetCardId);
    }
  },

  sendEmoji: (emoji: string) => {
    const { room, user } = get();
    if (room && user) {
      socketService.retroSendEmoji(room.id, user.id, emoji);
    }
  },
}));
