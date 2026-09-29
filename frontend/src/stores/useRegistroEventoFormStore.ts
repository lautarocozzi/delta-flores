import { create } from 'zustand';

interface RegistroEventoFormStore {
  isOpen: boolean;
  selectedTool: string | null;
  contextPlantaId: number | null;
  openMenu: () => void;
  closeMenu: () => void;
  openMenuAndSelectTool: (tool: string) => void;
  openMenuWithPlanta: (plantaId: number) => void;
}

export const useRegistroEventoFormStore = create<RegistroEventoFormStore>((set) => ({
  isOpen: false,
  selectedTool: null,
  contextPlantaId: null,
  openMenu: () => set({ isOpen: true }),
  closeMenu: () => set({ isOpen: false, selectedTool: null, contextPlantaId: null }),
  openMenuAndSelectTool: (tool) => set({ isOpen: true, selectedTool: tool }),
  openMenuWithPlanta: (plantaId) => set({ isOpen: true, contextPlantaId: plantaId }),
}));
