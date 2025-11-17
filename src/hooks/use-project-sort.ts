import { create } from 'zustand';

interface ProjectSortState {
  isRandomized: boolean;
  toggleRandomize: () => void;
  resetSort: () => void;
}

export const useProjectSort = create<ProjectSortState>((set) => ({
  isRandomized: false,
  toggleRandomize: () => set((state) => ({ isRandomized: !state.isRandomized })),
  resetSort: () => set({ isRandomized: false }),
}));
