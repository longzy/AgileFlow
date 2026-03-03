import fs from "fs";
import path from "path";
import { RetroRoom, RetroStage, RetroCard, RetroActionPoint } from "../../shared/retro";

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
    const data = fs.readFileSync(RETRO_FILE, "utf-8");
    return JSON.parse(data);
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
  }
};
