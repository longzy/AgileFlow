import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return;
    
    this.socket = io({
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    this.socket.on("connect", () => {
      console.log("Connected to WebSocket");
    });

    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  get isConnected() {
    return this.socket?.connected || false;
  }

  // Generic emit method
  emit(event: string, data?: any) {
    if (!this.socket?.connected) {
      console.warn(`Socket not connected. Cannot emit event: ${event}`);
      return;
    }
    this.socket.emit(event, data);
  }

  // Generic on method
  on(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) {
      this.connect();
    }
    this.socket?.on(event, callback);
  }

  // Generic off method
  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  // Planning methods
  joinRoom(roomId: string) {
    this.emit("join_room", roomId);
  }

  joinBoard(boardId: string, user: any) {
    this.emit("join_board", { boardId, user });
  }

  leaveBoard(boardId: string) {
    this.emit("leave_board", boardId);
  }

  updateIssue(boardId: string, issue: any) {
    this.emit("update_issue", { boardId, issue });
  }

  updateCurrentIssue(boardId: string, issueId: string | null) {
    this.emit("update_current_issue", { boardId, issueId });
  }

  claimHost(boardId: string, userId: string) {
    this.emit("claim_host", { boardId, userId });
  }

  vote(roomId: string, userId: string, points: number) {
    this.emit("vote", { roomId, userId, points });
  }

  reveal(roomId: string) {
    this.emit("reveal", roomId);
  }

  reset(roomId: string) {
    this.emit("reset", roomId);
  }
  
  userJoined(user: any) {
    this.emit("user_joined", user);
  }

  // Retro methods
  retroJoin(roomId: string, user: any) {
    this.emit("retro:join", { roomId, user });
  }

  retroCreate(roomId: string, hostId: string, template: string, user: any) {
    this.emit("retro:create", { roomId, hostId, template, user });
  }

  retroDeleteRoom(roomId: string, userId: string) {
    this.emit("retro:delete_room", { roomId, userId });
  }

  retroChangeStage(roomId: string, userId: string, stage: string, durationMinutes?: number) {
    this.emit("retro:change_stage", { roomId, userId, stage, durationMinutes });
  }

  retroAddCard(roomId: string, userId: string, column: string, text: string, anonymous: boolean) {
    this.emit("retro:add_card", { roomId, userId, column, text, anonymous });
  }

  retroEditCard(roomId: string, userId: string, cardId: string, text: string) {
    this.emit("retro:edit_card", { roomId, userId, cardId, text });
  }

  retroVote(roomId: string, userId: string, cardId: string) {
    this.emit("retro:vote", { roomId, userId, cardId });
  }

  retroRevokeVote(roomId: string, userId: string, cardId: string) {
    this.emit("retro:revoke_vote", { roomId, userId, cardId });
  }

  retroUpdateAction(roomId: string, userId: string, actionId: string, updates: any) {
    this.emit("retro:update_action", { roomId, userId, actionId, updates });
  }

  retroToggleTimer(roomId: string, userId: string) {
    this.emit("retro:toggle_timer", { roomId, userId });
  }

  retroMergeCards(roomId: string, userId: string, sourceCardId: string, targetCardId: string) {
    this.emit("retro:merge_cards", { roomId, userId, sourceCardId, targetCardId });
  }

  retroSendEmoji(roomId: string, userId: string, emoji: string) {
    this.emit("retro:emoji", { roomId, userId, emoji });
  }
}

export const socketService = new SocketService();
