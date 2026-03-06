import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthSlice, createAuthSlice } from './slices/authSlice';
import { BoardSlice, createBoardSlice } from './slices/boardSlice';
import { IssueSlice, createIssueSlice } from './slices/issueSlice';
import { PlanningSlice, createPlanningSlice } from './slices/planningSlice';

type AppState = AuthSlice & BoardSlice & IssueSlice & PlanningSlice & {
  isLoading: boolean;
  error: string | null;
};

export const useStore = create<AppState>()(
  persist(
    (set, get, api) => ({
      ...createAuthSlice(set, get, api),
      ...createBoardSlice(set, get, api),
      ...createIssueSlice(set, get, api),
      ...createPlanningSlice(set, get, api),
      isLoading: false,
      error: null,
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({ currentUser: state.currentUser, selectedBoard: state.selectedBoard }),
    }
  )
);
