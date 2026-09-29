import React, { useMemo } from 'react';
import { Filter, Droplets, Scissors, StickyNote, Image, Sprout, FlaskConical, Calendar as CalendarIcon, Building2, Leaf, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { PlantaDto, SalaDto } from "@/interfaces/Planta";

const EVENT_TYPES = [
  { value: 'Todos', icon: Filter, label: 'Todos' },
  { value: 'WATERING', icon: Droplets, label: 'Riego' },
  { value: 'PRUNING', icon: Scissors, label: 'Poda' },
  { value: 'NUTRIENT', icon: FlaskConical, label: 'Nutriente' },
  { value: 'STAGE_CHANGE', icon: Sprout, label: 'Etapa' },
  { value: 'PHOTO', icon: Image, label: 'Foto' },
  { value: 'NOTE', icon: StickyNote, label: 'Nota' },
];

interface MasterFilterBarProps {
  filters: {
    type: string;
    sala: string;
    plantId: string;
    dateRange?: DateRange;
  };
  setFilters: React.Dispatch<React.SetStateAction<any>>;
  salas: SalaDto[];
  plantas: PlantaDto[];
}

export function MasterFilterBar({ filters, setFilters, salas, plantas }: MasterFilterBarProps) {
  const availablePlants = useMemo(() => {
    if (filters.sala === 'Todas' || !salas.length || !plantas.length) return plantas;
    const selectedSala = salas.find((s) => s.id.toString() === filters.sala);
    return plantas.filter((p) => p.sala?.id === selectedSala?.id);
  }, [filters.sala, salas, plantas]);

  React.useEffect(() => {
    if (filters.plantId !== 'Todas' && !availablePlants.some((p) => p.id.toString() === filters.plantId)) {
      setFilters((f: any) => ({ ...f, plantId: 'Todas' }));
    }
  }, [availablePlants, filters.plantId, setFilters]);

  const hasActiveFilters = filters.type !== 'Todos' || filters.sala !== 'Todas' || filters.plantId !== 'Todas' || filters.dateRange?.from;

  const clearFilters = () => {
    setFilters({ type: 'Todos', sala: 'Todas', plantId: 'Todas' });
  };

  return (
    <div className="mb-6 space-y-3">
      {/* Event type chips */}
      <div className="flex flex-wrap gap-1.5">
        {EVENT_TYPES.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => setFilters((f: any) => ({ ...f, type: value }))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filters.type === value
                ? 'bg-primary/20 text-primary border border-primary/40'
                : 'bg-muted/50 text-muted-foreground border border-transparent hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Secondary filters row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Sala filter */}
        <Select value={filters.sala} onValueChange={(value) => setFilters((f: any) => ({ ...f, sala: value, plantId: 'Todas' }))}>
          <SelectTrigger className="w-auto h-8 text-xs bg-muted/30 border-border/50">
            <Building2 className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Sala" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas</SelectItem>
            {salas.map((sala) => (
              <SelectItem key={sala.id} value={sala.id.toString()}>{sala.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Planta filter */}
        <Select value={filters.plantId} onValueChange={(value) => setFilters((f: any) => ({ ...f, plantId: value }))}>
          <SelectTrigger className="w-auto h-8 text-xs bg-muted/30 border-border/50">
            <Leaf className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Planta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas</SelectItem>
            {availablePlants.map((plant) => (
              <SelectItem key={plant.id} value={plant.id.toString()}>{plant.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date range */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={`flex items-center gap-1.5 px-3 h-8 rounded-md text-xs border transition-colors ${
              filters.dateRange?.from
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted'
            }`}>
              <CalendarIcon className="w-3.5 h-3.5" />
              {filters.dateRange?.from ? (
                filters.dateRange.to ? (
                  <span>{format(filters.dateRange.from, "dd/MM")} - {format(filters.dateRange.to, "dd/MM")}</span>
                ) : (
                  <span>{format(filters.dateRange.from, "dd/MM")}</span>
                )
              ) : (
                <span className="hidden sm:inline">Fecha</span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={filters.dateRange}
              onSelect={(range) => setFilters((f: any) => ({ ...f, dateRange: range }))}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-2 h-8 rounded-md text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Limpiar</span>
          </button>
        )}
      </div>
    </div>
  );
}
