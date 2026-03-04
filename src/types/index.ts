export type Stage = "WRITING" | "REVIEW" | "VOTING" | "ACTION" | "DONE";

export interface User {
  id: string;
  name: string;
  avatar?: string;
  isHost: boolean;
}

export interface Issue {
  id: string;
  key: string;
  summary: string;
  description?: string;
  status: string;
  estimated: boolean;
  storyPoints?: number;
  priority?: string;
  assignee?: User;
  progress?: number;
  type?: 'Story' | 'Task' | 'Bug';
}

export type IssueStatus = 'todo' | 'in-progress' | 'done' | 'pending';

export interface Card {
  id: string;
  content: string;
  columnId: string;
  userId: string;
  createdAt: number;
  votes: string[]; // array of userIds who voted
}

export interface Vote {
  cardId: string;
  userId: string;
  timestamp: number;
}

export interface ActionItem {
  id: string;
  description: string;
  owner?: string;
  dueDate?: number;
  status: "todo" | "done";
  sourceCardId?: string;
}

export interface Column {
  id: string;
  title: string;
  color: string;
  type: "positive" | "negative" | "neutral" | "action";
}

export interface Template {
  id: string;
  name: string;
  columns: Column[];
}

export interface Room {
  id: string;
  templateId: string;
  stage: Stage;
  stageEndTime?: number; // timestamp for auto-switch
  users: User[];
  cards: Card[];
  votes: Vote[]; // flattened votes for easier counting
  actionItems: ActionItem[];
  createdAt: number;
  updatedAt: number;
}

// Socket Events
export interface ServerToClientEvents {
  "room:state": (room: Room) => void;
  "room:error": (error: { message: string }) => void;
}

export interface ClientToServerEvents {
  "room:join": (payload: { roomId: string; user: Omit<User, "isHost"> }) => void;
  "card:add": (payload: { roomId: string; card: Omit<Card, "id" | "createdAt" | "votes"> }) => void;
  "card:update": (payload: { roomId: string; cardId: string; content: string }) => void;
  "card:delete": (payload: { roomId: string; cardId: string }) => void;
  "vote:add": (payload: { roomId: string; cardId: string }) => void;
  "vote:remove": (payload: { roomId: string; cardId: string }) => void;
  "stage:next": (payload: { roomId: string }) => void; // Host only
  "action:add": (payload: { roomId: string; action: Omit<ActionItem, "id"> }) => void;
  "action:update": (payload: { roomId: string; actionId: string; updates: Partial<ActionItem> }) => void;
}
