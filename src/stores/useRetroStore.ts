import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { RetroRoom, RetroStage, RetroCard, RetroActionPoint } from "@/shared/retro";

interface User {
  id: string;
  name: string;
  avatar: string;
}

interface RetroState {
  socket: Socket | null;
  room: RetroRoom | null;
  user: User | null;
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
}

export const useRetroStore = create<RetroState>((set, get) => ({
  socket: null,
  room: null,
  user: null,
  error: null,

  connect: (roomId: string, user: User, isCreating?: boolean, template?: string) => {
    const socket = io();
    
    socket.on("connect", () => {
      if (isCreating && template) {
        socket.emit("retro:create", { roomId, hostId: user.id, template, user });
      } else {
        socket.emit("retro:join", { roomId, user });
      }
    });

    socket.on("retro:state", (room: RetroRoom) => {
      set({ room, error: null });
    });

    socket.on("retro:error", (error: string) => {
      set({ error });
    });

    set({ socket, user });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
    }
    set({ socket: null, room: null, user: null, error: null });
  },

  createRoom: (roomId: string, hostId: string, template: string) => {
    const { socket, user } = get();
    if (socket && user) {
      socket.emit("retro:create", { roomId, hostId, template, user });
    }
  },

  changeStage: (stage: RetroStage, durationMinutes?: number) => {
    const { socket, room, user } = get();
    if (socket && room && user) {
      socket.emit("retro:change_stage", { roomId: room.id, userId: user.id, stage, durationMinutes });
    }
  },

  addCard: (column: string, text: string, anonymous: boolean) => {
    const { socket, room, user } = get();
    if (socket && room && user) {
      socket.emit("retro:add_card", { roomId: room.id, userId: user.id, column, text, anonymous });
    }
  },

  editCard: (cardId: string, text: string) => {
    const { socket, room, user } = get();
    if (socket && room && user) {
      socket.emit("retro:edit_card", { roomId: room.id, userId: user.id, cardId, text });
    }
  },

  vote: (cardId: string) => {
    const { socket, room, user } = get();
    if (socket && room && user) {
      socket.emit("retro:vote", { roomId: room.id, userId: user.id, cardId });
    }
  },

  revokeVote: (cardId: string) => {
    const { socket, room, user } = get();
    if (socket && room && user) {
      socket.emit("retro:revoke_vote", { roomId: room.id, userId: user.id, cardId });
    }
  },

  updateAction: (actionId: string, updates: Partial<RetroActionPoint>) => {
    const { socket, room, user } = get();
    if (socket && room && user) {
      socket.emit("retro:update_action", { roomId: room.id, userId: user.id, actionId, updates });
    }
  },

  toggleTimer: () => {
    const { socket, room, user } = get();
    if (socket && room && user) {
      socket.emit("retro:toggle_timer", { roomId: room.id, userId: user.id });
    }
  },

  mergeCards: (sourceCardId: string, targetCardId: string) => {
    const { socket, room, user } = get();
    if (socket && room && user) {
      socket.emit("retro:merge_cards", { roomId: room.id, userId: user.id, sourceCardId, targetCardId });
    }
  },
}));
