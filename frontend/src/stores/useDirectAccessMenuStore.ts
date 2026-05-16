import { create } from 'zustand';

interface DirectAccessMenuStore {
  isOpen: boolean;
  selectedTool: string | null;
  openMenu: () => void;
  closeMenu: () => void;
  openMenuAndSelectTool: (tool: string) => void;
}

export const useDirectAccessMenuStore = create<DirectAccessMenuStore>((set) => ({
  isOpen: false,
  selectedTool: null,
  openMenu: () => set({ isOpen: true }),
  closeMenu: () => set({ isOpen: false, selectedTool: null }),
  openMenuAndSelectTool: (tool) => set({ isOpen: true, selectedTool: tool }),
}));
