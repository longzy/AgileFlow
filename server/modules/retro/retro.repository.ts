import fs from "fs";
import path from "path";
import { RetroRoom, RetroStage, RetroCard, RetroActionPoint } from "../../../shared/retro";

const DATA_DIR = path.join(process.cwd(), "data");
const RETRO_FILE = path.join(DATA_DIR, "retro.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure retro.json exists
if (!fs.existsSync(RETRO_FILE)) {
  fs.writeFileSync(RETRO_FILE, JSON.stringify({ rooms: {} }, null, 2));
}

interface RetroData {
  rooms: Record<string, RetroRoom>;
}

function readData(): RetroData {
  try {
    if (!fs.existsSync(RETRO_FILE)) {
      return { rooms: {} };
    }
    const fileContent = fs.readFileSync(RETRO_FILE, "utf-8");
    if (!fileContent.trim()) {
      return { rooms: {} };
    }
    const data = JSON.parse(fileContent);
    if (!data || typeof data !== 'object') {
      return { rooms: {} };
    }
    if (!data.rooms) {
      data.rooms = {};
    }
    return data;
  } catch (error) {
    console.error("Error reading retro data:", error);
    return { rooms: {} };
  }
}

function writeData(data: RetroData) {
  try {
    fs.writeFileSync(RETRO_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing retro data:", error);
  }
}

export const retroRepo = {
  getRoom(roomId: string): RetroRoom | null {
    const data = readData();
    return data.rooms[roomId] || null;
  },

  saveRoom(room: RetroRoom) {
    const data = readData();
    data.rooms[room.id] = room;
    writeData(data);
  },

  deleteRoom(roomId: string) {
    const data = readData();
    delete data.rooms[roomId];
    writeData(data);
  },

  cleanup() {
    const data = readData();
    if (!data.rooms) return;

    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const THIRTY_DAYS = 30 * ONE_DAY;

    let deletedCount = 0;
    Object.keys(data.rooms).forEach(roomId => {
      const room = data.rooms[roomId];
      // Backfill createdAt if missing
      if (!room.createdAt) {
        room.createdAt = now;
      }

      const age = now - room.createdAt;

      // 1. Delete empty rooms older than 24h (no cards, no actions)
      if (age > ONE_DAY && room.cards.length === 0 && room.actionPoints.length === 0) {
        delete data.rooms[roomId];
        deletedCount++;
        return;
      }

      // 2. Delete very old rooms (> 30 days) even if they have content
      // (Optional: In a real app, you might archive these instead)
      if (age > THIRTY_DAYS) {
        delete data.rooms[roomId];
        deletedCount++;
        return;
      }
    });

    if (deletedCount > 0) {
      console.log(`[Retro] Cleaned up ${deletedCount} old/empty rooms.`);
      writeData(data);
    }
  }
};
