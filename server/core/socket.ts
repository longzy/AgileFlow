import { Server, Socket } from "socket.io";
import { setupRetroSocket } from "../modules/retro/retro.socket";

interface User {
  id: string;
  name: string;
  avatar: string;
}

interface ConnectedClient {
  socketId: string;
  user?: User;
  boardId?: string;
}

export function setupSocket(io: Server) {
  const rooms = new Map(); // roomId (issueId) -> { votes: [], revealed: false, consensus: null }
  const clients = new Map<string, ConnectedClient>(); // socketId -> Client Data
  const boards = new Map<string, { hostId: string }>(); // boardId -> Board State

  // Helper to broadcast users in a board
  const broadcastBoardUsers = (boardId: string) => {
    const users = Array.from(clients.values())
      .filter(c => c.boardId === boardId && c.user)
      .map(c => c.user!);
    
    // Deduplicate users by ID (in case same user has multiple tabs open)
    const uniqueUsersMap = new Map(users.map(u => [u.id, u]));
    const uniqueUsers = Array.from(uniqueUsersMap.values());

    io.to(`board:${boardId}`).emit("board_users", uniqueUsers);

    // Evaluate and broadcast host
    if (uniqueUsers.length === 0) {
      boards.delete(boardId);
    } else {
      let board = boards.get(boardId);
      if (!board || !uniqueUsers.some(u => u.id === board!.hostId)) {
        board = { hostId: uniqueUsers[0].id };
        boards.set(boardId, board);
      }
      io.to(`board:${boardId}`).emit("board_host", board.hostId);
    }
  };

  io.on("connection", (socket: Socket) => {
    console.log("User connected:", socket.id);
    clients.set(socket.id, { socketId: socket.id });

    // Setup retro socket handlers
    setupRetroSocket(io, socket);

    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      if (!rooms.has(roomId)) {
        rooms.set(roomId, { votes: [], revealed: false, consensus: null });
      }
      // Send current state to user
      socket.emit("room_state", rooms.get(roomId));
    });

    socket.on("join_board", ({ boardId, user }: { boardId: string, user: User }) => {
      const bId = String(boardId);
      console.log(`[Socket] join_board received: boardId=${bId}, user=${user.name} (${user.id})`);

      const client = clients.get(socket.id);
      if (client) {
        // If switching boards, leave previous one
        if (client.boardId && client.boardId !== bId) {
          socket.leave(`board:${client.boardId}`);
          // We will broadcast leave update later
          const prevBoardId = client.boardId;
          // Defer broadcast to ensure state is updated
          setTimeout(() => broadcastBoardUsers(prevBoardId), 100);
        }
        
        client.boardId = bId;
        client.user = user;
      }

      const roomName = `board:${bId}`;
      socket.join(roomName);
      console.log(`User ${user.name} (${socket.id}) joined board ${bId}`);
      
      // Broadcast updated user list to this board
      broadcastBoardUsers(bId);
    });

    socket.on("leave_board", (boardId) => {
      const roomName = `board:${boardId}`;
      socket.leave(roomName);
      
      const client = clients.get(socket.id);
      if (client && client.boardId === boardId) {
        client.boardId = undefined;
      }
      
      console.log(`User ${socket.id} left board ${boardId}`);
      broadcastBoardUsers(boardId);
    });

    socket.on("claim_host", ({ boardId, userId }) => {
      const board = boards.get(boardId);
      if (board) {
        board.hostId = userId;
        io.to(`board:${boardId}`).emit("board_host", userId);
      }
    });

    socket.on("update_issue", ({ boardId, issue }) => {
      const roomName = `board:${boardId}`;
      // Broadcast to everyone in the board room EXCEPT the sender
      socket.to(roomName).emit("issue_updated", issue);
    });

    socket.on("update_current_issue", ({ boardId, issueId }) => {
      const roomName = `board:${boardId}`;
      socket.to(roomName).emit("current_issue_updated", issueId);
    });

    socket.on("vote", ({ roomId, userId, points }) => {
      if (!rooms.has(roomId)) return;
      const room = rooms.get(roomId);
      
      // Update or add vote
      const existingVoteIndex = room.votes.findIndex((v: any) => v.userId === userId);
      if (existingVoteIndex >= 0) {
        room.votes[existingVoteIndex].points = points;
      } else {
        room.votes.push({ userId, points });
      }
      
      io.to(roomId).emit("room_state", room);
    });

    socket.on("reveal", (roomId) => {
      if (!rooms.has(roomId)) return;
      const room = rooms.get(roomId);
      room.revealed = true;
      
      // Calculate consensus
      const points = room.votes.map((v: any) => v.points);
      const uniquePoints = new Set(points);
      if (uniquePoints.size === 1 && points.length > 0) {
        room.consensus = points[0];
      } else {
        room.consensus = null;
      }

      io.to(roomId).emit("room_state", room);
    });

    socket.on("reset", (roomId) => {
      if (!rooms.has(roomId)) return;
      const room = rooms.get(roomId);
      room.votes = [];
      room.revealed = false;
      room.consensus = null;
      io.to(roomId).emit("room_state", room);
    });
    
    // Sync user presence (simple version) - DEPRECATED in favor of join_board
    socket.on("user_joined", (user) => {
      // socket.broadcast.emit("user_joined_broadcast", user);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      const client = clients.get(socket.id);
      if (client && client.boardId) {
        const boardId = client.boardId;
        clients.delete(socket.id); // Remove client
        broadcastBoardUsers(boardId); // Notify others
      } else {
        clients.delete(socket.id);
      }
    });
  });
}
