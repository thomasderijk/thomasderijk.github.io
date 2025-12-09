import { create } from 'zustand';

interface ProjectSortState {
  isRandomized: boolean;
  toggleRandomize: () => void;
  resetSort: () => void;
}

export const useProjectSort = create<ProjectSortState>((set) => ({
  isRandomized: true, // Default to randomized on load
  toggleRandomize: () => set((state) => ({ isRandomized: !state.isRandomized })),
  resetSort: () => set({ isRandomized: true }), // Reset to randomized instead of sorted
}));
