import { Leaf, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlantaDto } from "@/interfaces/Planta";
import { usePlantSelectionStore } from "@/stores/usePlantSelectionStore";

interface PlantSelectableChipProps {
    plant: PlantaDto;
    onClick?: () => void;
}

export const PlantSelectableChip = ({ plant, onClick }: PlantSelectableChipProps) => {
    const { isSelected, togglePlant } = usePlantSelectionStore();
    const selected = isSelected(plant.id);

    const handleClick = () => {
        togglePlant(plant);
        onClick?.();
    };

    return (
        <button
            type="button"
            role="option"
            aria-selected={selected}
            onClick={handleClick}
            className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                "border-2 w-full justify-start",
                selected
                    ? "bg-primary/20 border-primary text-primary-foreground"
                    : "bg-card border-border hover:border-primary/50 text-foreground"
            )}
        >
            {/* Checkbox indicator */}
            <div
                className={cn(
                    "flex items-center justify-center w-5 h-5 rounded border-2 transition-colors",
                    selected
                        ? "bg-primary border-primary"
                        : "border-muted-foreground/50"
                )}
            >
                {selected && <Check className="w-3 h-3 text-primary-foreground" />}
            </div>

            {/* Plant icon */}
            <Leaf className={cn(
                "w-4 h-4",
                selected ? "text-primary" : "text-green-500"
            )} />

            {/* Plant name */}
            <span className="truncate">{plant.nombre}</span>
        </button>
    );
};
