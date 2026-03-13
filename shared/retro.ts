export type RetroStage = "WRITING" | "REVIEW" | "VOTING" | "ACTION" | "DONE";

export interface RetroCard {
  id: string;
  column: string;
  text: string;
  authorId: string;
  anonymous: boolean;
  parentId?: string;
}

export interface RetroActionPoint {
  id: string;
  cardId?: string;
  description: string;
  owner?: string;
  dueDate?: string;
  status: "todo" | "in-progress" | "done";
}

export interface RetroUser {
  id: string;
  name: string;
  avatar?: string;
}

export interface RetroRoom {
  id: string;
  hostId: string;
  template: string;
  stage: RetroStage;
  createdAt: number; // Timestamp
  endTime?: number | null;
  timerPausedAt?: number | null;
  cards: RetroCard[];
  votes: Record<string, string[]>; // userId -> array of cardIds
  actionPoints: RetroActionPoint[];
  users: RetroUser[];
}
