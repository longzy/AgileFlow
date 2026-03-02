import { Server } from "socket.io";

export function setupSocket(io: Server) {
  const rooms = new Map(); // roomId -> { votes: [], revealed: false, consensus: null }

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      if (!rooms.has(roomId)) {
        rooms.set(roomId, { votes: [], revealed: false, consensus: null });
      }
      // Send current state to user
      socket.emit("room_state", rooms.get(roomId));
    });

    socket.on("join_board", (boardId) => {
      const roomName = `board:${boardId}`;
      socket.join(roomName);
      console.log(`User ${socket.id} joined board ${boardId}`);
    });

    socket.on("leave_board", (boardId) => {
      const roomName = `board:${boardId}`;
      socket.leave(roomName);
      console.log(`User ${socket.id} left board ${boardId}`);
    });

    socket.on("update_issue", ({ boardId, issue }) => {
      const roomName = `board:${boardId}`;
      // Broadcast to everyone in the board room EXCEPT the sender
      socket.to(roomName).emit("issue_updated", issue);
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
    
    // Sync user presence (simple version)
    socket.on("user_joined", (user) => {
      socket.broadcast.emit("user_joined_broadcast", user);
    });
  });
}
