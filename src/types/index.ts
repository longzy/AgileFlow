export type User = {
  id: string;
  name: string;
  avatar: string;
};

export type IssueStatus = 'backlog' | 'todo' | 'in-progress' | 'paused' | 'done';

export type Issue = {
  id: string;
  key: string;
  summary: string;
  description?: string;
  assigneeId?: string;
  assignee?: User;
  status: IssueStatus;
  storyPoints?: number;
  estimated: boolean;
  progress?: number;
  priority?: 'High' | 'Medium' | 'Low';
};

export type Sprint = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

export type Vote = {
  userId: string;
  points: number | null;
};

export type Board = {
  id: string;
  name: string;
  type: string;
};
