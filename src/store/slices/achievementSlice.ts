import { StateCreator } from 'zustand';
import { Achievement } from '../../types';
import { AppState } from '../useStore';

export interface AchievementSlice {
  achievements: Achievement[];
  fetchAchievements: () => Promise<void>;
}

export const createAchievementSlice: StateCreator<
  AppState,
  [],
  [],
  AchievementSlice
> = (set, get) => ({
  achievements: [],
  fetchAchievements: async () => {
    try {
      const { selectedGroup, currentUser } = get();
      const response = await fetch(`/api/achievements?group=${encodeURIComponent(selectedGroup)}&userId=${currentUser?.id || ''}`);
      if (response.ok) {
        const data = await response.json();
        set({ achievements: data });
      }
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    }
  },
});
