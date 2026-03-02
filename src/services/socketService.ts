import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect() {
    if (this.socket) return;
    
    this.socket = io();
    
    this.socket.on("connect", () => {
      console.log("Connected to WebSocket");
    });

    this.socket.on("room_state", (state) => {
      this.emit("room_state", state);
    });
    
    this.socket.on("user_joined_broadcast", (user) => {
      this.emit("user_joined", user);
    });

    this.socket.on("issue_updated", (issue) => {
      this.emit("issue_updated", issue);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRoom(roomId: string) {
    this.socket?.emit("join_room", roomId);
  }

  joinBoard(boardId: string) {
    this.socket?.emit("join_board", boardId);
  }

  leaveBoard(boardId: string) {
    this.socket?.emit("leave_board", boardId);
  }

  updateIssue(boardId: string, issue: any) {
    this.socket?.emit("update_issue", { boardId, issue });
  }

  vote(roomId: string, userId: string, points: number) {
    this.socket?.emit("vote", { roomId, userId, points });
  }

  reveal(roomId: string) {
    this.socket?.emit("reveal", roomId);
  }

  reset(roomId: string) {
    this.socket?.emit("reset", roomId);
  }
  
  userJoined(user: any) {
    this.socket?.emit("user_joined", user);
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      this.listeners.set(event, callbacks.filter(cb => cb !== callback));
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }
}

export const socketService = new SocketService();
