import { Server, Socket } from "socket.io";
import { retroRepo } from "../repositories/retro";
import { RetroRoom, RetroStage, RetroCard, RetroActionPoint } from "../../shared/retro";
import crypto from "crypto";

// Run cleanup on startup
// retroRepo.cleanup();

interface User {
  id: string;
  name: string;
  avatar: string;
}

const TEMPLATES = {
  "start-stop-continue": ["Start", "Stop", "Continue"],
  "went-well-improve-action": ["Went Well", "To Improve", "Action"],
  "mad-sad-glad": ["Mad", "Sad", "Glad"],
};

export function setupRetroSocket(io: Server, socket: Socket) {
  // Join Room
  socket.on("retro:join", ({ roomId, user }: { roomId: string; user: User }) => {
    socket.join(`retro:${roomId}`);
    let room = retroRepo.getRoom(roomId);
    
    if (!room) {
      socket.emit("retro:error", "Room not found");
      return;
    }

    // Add user to room if not already present
    if (!room.users) room.users = [];
    if (!room.users.find(u => u.id === user.id)) {
      room.users.push(user);
      retroRepo.saveRoom(room);
    }

    // Store session data for disconnect handling
    socket.data.userId = user.id;
    socket.data.roomId = roomId;

    // Send current state to the user and broadcast to others
    socket.emit("retro:state", room);
    io.to(`retro:${roomId}`).emit("retro:state", room);
  });

  // Create Room
  socket.on("retro:create", ({ roomId, hostId, template, user }: { roomId: string; hostId: string; template: string; user: User }) => {
    if (!TEMPLATES[template as keyof typeof TEMPLATES]) {
      socket.emit("retro:error", "Invalid template");
      return;
    }

    const newRoom: RetroRoom = {
      id: roomId,
      hostId,
      template,
      stage: "WRITING",
      createdAt: Date.now(),
      cards: [],
      votes: {},
      actionPoints: [],
      users: [user], // Initialize with host
    };

    retroRepo.saveRoom(newRoom);
    socket.join(`retro:${roomId}`);
    
    // Store session data
    socket.data.userId = user.id;
    socket.data.roomId = roomId;

    socket.emit("retro:state", newRoom);
  });

  // Handle Disconnect
  socket.on("disconnect", () => {
    const { roomId, userId } = socket.data;
    if (roomId && userId) {
      const room = retroRepo.getRoom(roomId);
      if (room && room.users) {
        room.users = room.users.filter(u => u.id !== userId);
        retroRepo.saveRoom(room);
        io.to(`retro:${roomId}`).emit("retro:state", room);
      }
    }
  });

  // Delete Room (Manual)
  socket.on("retro:delete_room", ({ roomId, userId }: { roomId: string; userId: string }) => {
    const room = retroRepo.getRoom(roomId);
    if (!room) return;
    if (room.hostId !== userId) {
      socket.emit("retro:error", "Only host can delete room");
      return;
    }

    retroRepo.deleteRoom(roomId);
    io.to(`retro:${roomId}`).emit("retro:deleted");
    // Force disconnect all clients in room
    io.in(`retro:${roomId}`).disconnectSockets();
  });

  // Change Stage
  socket.on("retro:change_stage", ({ roomId, userId, stage, durationMinutes }: { roomId: string; userId: string; stage: RetroStage; durationMinutes?: number }) => {
    const room = retroRepo.getRoom(roomId);
    if (!room) return;
    if (room.hostId !== userId) {
      socket.emit("retro:error", "Only host can change stage");
      return;
    }

    room.stage = stage;
    
    if (stage === "WRITING" || stage === "VOTING") {
      if (durationMinutes) {
        room.endTime = Date.now() + durationMinutes * 60 * 1000;
      } else {
        room.endTime = null;
      }
    } else {
      room.endTime = null;
    }

    // If transitioning to ACTION, auto-generate action points from top 2 voted cards
    if (stage === "ACTION" && room.actionPoints.length === 0) {
      const voteCounts: Record<string, number> = {};
      Object.values(room.votes).forEach(userVotes => {
        userVotes.forEach(cardId => {
          voteCounts[cardId] = (voteCounts[cardId] || 0) + 1;
        });
      });

      const sortedCards = [...room.cards].sort((a, b) => (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0));
      const topCards = sortedCards.slice(0, 2);

      room.actionPoints = topCards.map(card => ({
        id: crypto.randomUUID(),
        cardId: card.id,
        description: card.text,
        status: "todo",
      }));
    }

    retroRepo.saveRoom(room);
    io.to(`retro:${roomId}`).emit("retro:state", room);
  });

  // Add Card
  socket.on("retro:add_card", ({ roomId, userId, column, text, anonymous }: { roomId: string; userId: string; column: string; text: string; anonymous: boolean }) => {
    const room = retroRepo.getRoom(roomId);
    if (!room) return;
    if (room.stage !== "WRITING") {
      socket.emit("retro:error", "Can only add cards during WRITING stage");
      return;
    }

    const newCard: RetroCard = {
      id: crypto.randomUUID(),
      column,
      text,
      authorId: userId,
      anonymous,
    };

    room.cards.push(newCard);
    retroRepo.saveRoom(room);
    io.to(`retro:${roomId}`).emit("retro:state", room);
  });

  // Edit Card
  socket.on("retro:edit_card", ({ roomId, userId, cardId, text }: { roomId: string; userId: string; cardId: string; text: string }) => {
    const room = retroRepo.getRoom(roomId);
    if (!room) return;
    if (room.stage !== "WRITING" && room.stage !== "REVIEW") {
      socket.emit("retro:error", "Can only edit cards during WRITING or REVIEW stage");
      return;
    }

    const card = room.cards.find(c => c.id === cardId);
    if (!card) return;
    if (card.authorId !== userId) {
      socket.emit("retro:error", "Can only edit your own cards");
      return;
    }

    card.text = text;
    retroRepo.saveRoom(room);
    io.to(`retro:${roomId}`).emit("retro:state", room);
  });

  // Vote
  socket.on("retro:vote", ({ roomId, userId, cardId }: { roomId: string; userId: string; cardId: string }) => {
    const room = retroRepo.getRoom(roomId);
    if (!room) return;
    if (room.stage !== "VOTING") {
      socket.emit("retro:error", "Can only vote during VOTING stage");
      return;
    }

    if (!room.votes[userId]) {
      room.votes[userId] = [];
    }

    const userVotes = room.votes[userId];
    if (userVotes.length >= 3) {
      socket.emit("retro:error", "Maximum 3 votes allowed");
      return;
    }

    if (userVotes.includes(cardId)) {
      socket.emit("retro:error", "Cannot vote for the same card twice");
      return;
    }

    userVotes.push(cardId);
    retroRepo.saveRoom(room);
    io.to(`retro:${roomId}`).emit("retro:state", room);
  });

  // Revoke Vote
  socket.on("retro:revoke_vote", ({ roomId, userId, cardId }: { roomId: string; userId: string; cardId: string }) => {
    const room = retroRepo.getRoom(roomId);
    if (!room) return;
    if (room.stage !== "VOTING") {
      socket.emit("retro:error", "Can only revoke votes during VOTING stage");
      return;
    }

    if (!room.votes[userId]) return;

    room.votes[userId] = room.votes[userId].filter(id => id !== cardId);
    retroRepo.saveRoom(room);
    io.to(`retro:${roomId}`).emit("retro:state", room);
  });

  // Update Action Point
  socket.on("retro:update_action", ({ roomId, userId, actionId, updates }: { roomId: string; userId: string; actionId: string; updates: Partial<RetroActionPoint> }) => {
    const room = retroRepo.getRoom(roomId);
    if (!room) return;
    if (room.stage !== "ACTION") {
      socket.emit("retro:error", "Can only update action points during ACTION stage");
      return;
    }
    if (room.hostId !== userId) {
      socket.emit("retro:error", "Only host can update action points");
      return;
    }

    const action = room.actionPoints.find(a => a.id === actionId);
    if (!action) return;

    Object.assign(action, updates);
    retroRepo.saveRoom(room);
    io.to(`retro:${roomId}`).emit("retro:state", room);
  });

  // Toggle Timer
  socket.on("retro:toggle_timer", ({ roomId, userId }: { roomId: string; userId: string }) => {
    const room = retroRepo.getRoom(roomId);
    if (!room) return;
    if (room.hostId !== userId) {
      socket.emit("retro:error", "Only host can toggle timer");
      return;
    }

    if (room.timerPausedAt) {
      // Resume
      if (room.endTime) {
        const remaining = room.endTime - room.timerPausedAt;
        room.endTime = Date.now() + remaining;
        room.timerPausedAt = null;
      }
    } else {
      // Pause
      if (room.endTime) {
        room.timerPausedAt = Date.now();
      }
    }

    retroRepo.saveRoom(room);
    io.to(`retro:${roomId}`).emit("retro:state", room);
  });

  // Merge Cards
  socket.on("retro:merge_cards", ({ roomId, userId, sourceCardId, targetCardId }: { roomId: string; userId: string; sourceCardId: string; targetCardId: string }) => {
    const room = retroRepo.getRoom(roomId);
    if (!room) return;
    if (room.stage !== "REVIEW") {
      socket.emit("retro:error", "Can only merge cards during REVIEW stage");
      return;
    }
    if (room.hostId !== userId) {
      socket.emit("retro:error", "Only host can merge cards");
      return;
    }

    const sourceCard = room.cards.find(c => c.id === sourceCardId);
    const targetCard = room.cards.find(c => c.id === targetCardId);

    if (!sourceCard || !targetCard) return;
    if (sourceCard.column !== targetCard.column) {
      socket.emit("retro:error", "Cannot merge cards from different columns");
      return;
    }
    if (sourceCard.id === targetCard.id) return;

    // If target is already a child, merge into its parent instead
    if (targetCard.parentId) {
      sourceCard.parentId = targetCard.parentId;
    } else {
      sourceCard.parentId = targetCard.id;
    }

    retroRepo.saveRoom(room);
    io.to(`retro:${roomId}`).emit("retro:state", room);
  });
}
