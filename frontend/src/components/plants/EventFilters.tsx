import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EventFiltersProps {
    selectedType: string;
    onTypeChange: (type: string) => void;
    eventCounts: Record<string, number>;
}

const EVENT_TYPES = [
    { value: "todos", label: "Todos los eventos", icon: "📋" },
    { value: "WATERING", label: "Riegos", icon: "💧" },
    { value: "NOTE", label: "Notas", icon: "📝" },
    { value: "NUTRIENT", label: "Nutrientes", icon: "🌱" },
    { value: "PRUNING", label: "Podas", icon: "✂️" },
    { value: "DEFOLIATION", label: "Defoliaciones", icon: "🍂" },
    { value: "STAGE_CHANGE", label: "Cambios Etapa", icon: "🔄" },
    { value: "MEASUREMENT", label: "Mediciones", icon: "📏" },
];

export const EventFilters = ({ selectedType, onTypeChange, eventCounts }: EventFiltersProps) => {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="space-y-4">
                    {/* Select Dropdown */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Filtrar por tipo:</label>
                        <Select value={selectedType} onValueChange={onTypeChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                {EVENT_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.icon} {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Quick Filter Badges */}
                    <div>
                        <p className="text-sm text-muted-foreground mb-2">Accesos rápidos:</p>
                        <div className="flex flex-wrap gap-2">
                            {EVENT_TYPES.filter(t => t.value !== "todos").map((type) => {
                                const count = eventCounts[type.value] || 0;
                                const isActive = selectedType === type.value;

                                if (count === 0) return null;

                                return (
                                    <Badge
                                        key={type.value}
                                        variant={isActive ? "default" : "outline"}
                                        className="cursor-pointer hover:bg-primary/80 transition-colors"
                                        onClick={() => onTypeChange(type.value)}
                                    >
                                        {type.icon} {type.label} ({count})
                                    </Badge>
                                );
                            })}
                        </div>
                    </div>

                    {/* Total Count */}
                    <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">
                            Total eventos: <strong>{Object.values(eventCounts).reduce((a, b) => a + b, 0)}</strong>
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
