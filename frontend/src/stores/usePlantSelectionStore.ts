import { create } from 'zustand';
import { PlantaDto } from '@/interfaces/Planta';

interface PlantSelectionState {
    // Selected plant IDs
    selectedPlantIds: number[];

    // Selected plants data (for display purposes)
    selectedPlants: PlantaDto[];

    // Actions
    togglePlant: (plant: PlantaDto) => void;
    selectAll: (plants: PlantaDto[]) => void;
    clearSelection: () => void;
    isSelected: (plantId: number) => boolean;

    // Batch operation state
    pendingAction: string | null;
    setPendingAction: (action: string | null) => void;
}

const MAX_SELECTION = 50;

export const usePlantSelectionStore = create<PlantSelectionState>((set, get) => ({
    selectedPlantIds: [],
    selectedPlants: [],
    pendingAction: null,

    togglePlant: (plant: PlantaDto) => {
        const { selectedPlantIds, selectedPlants } = get();
        const isCurrentlySelected = selectedPlantIds.includes(plant.id);

        if (isCurrentlySelected) {
            // Remove from selection
            set({
                selectedPlantIds: selectedPlantIds.filter(id => id !== plant.id),
                selectedPlants: selectedPlants.filter(p => p.id !== plant.id),
            });
        } else {
            // Add to selection (with limit check)
            if (selectedPlantIds.length >= MAX_SELECTION) {
                console.warn(`Maximum selection limit reached (${MAX_SELECTION})`);
                return;
            }
            set({
                selectedPlantIds: [...selectedPlantIds, plant.id],
                selectedPlants: [...selectedPlants, plant],
            });
        }
    },

    selectAll: (plants: PlantaDto[]) => {
        // Limit to MAX_SELECTION
        const limitedPlants = plants.slice(0, MAX_SELECTION);
        set({
            selectedPlantIds: limitedPlants.map(p => p.id),
            selectedPlants: limitedPlants,
        });
    },

    clearSelection: () => {
        set({
            selectedPlantIds: [],
            selectedPlants: [],
            pendingAction: null,
        });
    },

    isSelected: (plantId: number) => {
        return get().selectedPlantIds.includes(plantId);
    },

    setPendingAction: (action: string | null) => {
        set({ pendingAction: action });
    },
}));
