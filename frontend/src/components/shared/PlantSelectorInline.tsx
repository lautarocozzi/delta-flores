import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { SalaDto, ZonaDto } from "@/schemas/DTOSchemas";
import { PlantaDto } from "@/interfaces/Planta";
import ZoneGrid from "@/components/plants/ZoneGrid";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2, MapPin, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Zone colors ──
const ZONE_COLORS = [
  { bg: "bg-blue-500/25", border: "border-blue-500", text: "text-blue-300", dot: "bg-blue-500" },
  { bg: "bg-emerald-500/25", border: "border-emerald-500", text: "text-emerald-300", dot: "bg-emerald-500" },
  { bg: "bg-amber-500/25", border: "border-amber-500", text: "text-amber-300", dot: "bg-amber-500" },
  { bg: "bg-violet-500/25", border: "border-violet-500", text: "text-violet-300", dot: "bg-violet-500" },
  { bg: "bg-rose-500/25", border: "border-rose-500", text: "text-rose-300", dot: "bg-rose-500" },
  { bg: "bg-cyan-500/25", border: "border-cyan-500", text: "text-cyan-300", dot: "bg-cyan-500" },
];

function getZoneColor(nombre: string) {
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  return ZONE_COLORS[Math.abs(hash) % ZONE_COLORS.length];
}

interface PlantSelectorInlineProps {
  onComplete: (plantIds: number[]) => void;
  onBack: () => void;
  onClose: () => void;
}

export function PlantSelectorInline({ onComplete, onBack, onClose }: PlantSelectorInlineProps) {
  const [selectedSala, setSelectedSala] = useState<SalaDto | null>(null);
  const [expandedZoneId, setExpandedZoneId] = useState<number | null>(null);

  // Selection state
  const [selectAll, setSelectAll] = useState(false);
  const [selectedZoneIds, setSelectedZoneIds] = useState<Set<number>>(new Set());
  const [selectedPlantIds, setSelectedPlantIds] = useState<Set<number>>(new Set());

  // ── Queries ──
  const { data: salas = [], isLoading: loadingSalas } = useQuery<SalaDto[]>({
    queryKey: ["salas"],
    queryFn: apiService.getSalas,
  });

  const { data: zonas = [], isLoading: loadingZonas } = useQuery<ZonaDto[]>({
    queryKey: ["zonas", "sala", selectedSala?.id],
    queryFn: () => apiService.getZonasBySala(selectedSala!.id),
    enabled: !!selectedSala,
  });

  // All plants in the sala (for "select all" and zone mapping)
  const { data: allSalaPlants = [], isLoading: loadingAllPlants } = useQuery<PlantaDto[]>({
    queryKey: ["plantas", "sala", selectedSala?.id],
    queryFn: () => apiService.getPlantasBySala(selectedSala!.id),
    enabled: !!selectedSala,
  });

  // Plants in the expanded zone (for individual selection)
  const { data: expandedZonePlants = [], isLoading: loadingExpandedPlants } = useQuery<PlantaDto[]>({
    queryKey: ["plantas", "zona", expandedZoneId],
    queryFn: () => apiService.getPlantasByZona(expandedZoneId!),
    enabled: !!expandedZoneId,
  });

  // Map zoneId → plantIds
  const zoneToPlants = useMemo(() => {
    const map = new Map<number, number[]>();
    for (const planta of allSalaPlants) {
      if (planta.zonaId) {
        const existing = map.get(planta.zonaId) || [];
        existing.push(planta.id);
        map.set(planta.zonaId, existing);
      }
    }
    return map;
  }, [allSalaPlants]);

  // Build occupiedCells for expanded zone
  const occupiedCells = useMemo(() => {
    const map: Record<string, { plantaNombre: string; plantaId: number }> = {};
    for (const planta of expandedZonePlants) {
      if (planta.zonaId === expandedZoneId && planta.columnaEnZona != null && planta.filaEnZona != null) {
        const key = `${planta.zonaId}-${planta.columnaEnZona}-${planta.filaEnZona}`;
        map[key] = { plantaNombre: planta.nombre, plantaId: planta.id };
      }
    }
    return map;
  }, [expandedZonePlants, expandedZoneId]);

  const expandedZone = zonas.find((z) => z.id === expandedZoneId);

  // ── Selection helpers ──
  const getAllPlantIds = useCallback(() => allSalaPlants.map((p) => p.id), [allSalaPlants]);

  const getZonePlantIds = useCallback((zoneId: number) => zoneToPlants.get(zoneId) || [], [zoneToPlants]);

  const toggleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedZoneIds(new Set());
      setSelectedPlantIds(new Set());
    }
  };

  const toggleZone = (zoneId: number, checked: boolean) => {
    setSelectAll(false);
    setSelectedZoneIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(zoneId);
      else next.delete(zoneId);
      return next;
    });
    // Clear individual plant selections when toggling zones
    setSelectedPlantIds(new Set());
  };

  const togglePlant = (plantId: number) => {
    setSelectAll(false);
    setSelectedZoneIds(new Set());
    setSelectedPlantIds((prev) => {
      const next = new Set(prev);
      if (next.has(plantId)) next.delete(plantId);
      else next.add(plantId);
      return next;
    });
  };

  // Build final selection
  const getSelectedPlantIds = (): number[] => {
    if (selectAll) return getAllPlantIds();
    if (selectedZoneIds.size > 0) {
      const ids: number[] = [];
      for (const zoneId of selectedZoneIds) ids.push(...getZonePlantIds(zoneId));
      return ids;
    }
    if (selectedPlantIds.size > 0) return Array.from(selectedPlantIds);
    return [];
  };

  const handleConfirm = () => {
    const ids = getSelectedPlantIds();
    if (ids.length > 0) onComplete(ids);
  };

  const totalSelected = selectAll
    ? allSalaPlants.length
    : selectedZoneIds.size > 0
      ? Array.from(selectedZoneIds).reduce((sum, zid) => sum + getZonePlantIds(zid).length, 0)
      : selectedPlantIds.size;

  // ── Step 1: Sala selection ──
  if (!selectedSala) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="text-lg font-bold">Elegí la Sala</h3>
            <p className="text-sm text-muted-foreground">Seleccioná dónde está la planta</p>
          </div>
        </div>

        {loadingSalas ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" size={24} /></div>
        ) : salas.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No tenés salas creadas.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {salas.map((sala) => (
              <Button key={sala.id} variant="outline" className="h-auto flex-col gap-1.5 py-4" onClick={() => setSelectedSala(sala)}>
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium text-sm">{sala.nombre}</span>
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Step 2: Zone map with switches ──
  if (!expandedZoneId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedSala(null)} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h3 className="text-lg font-bold">{selectedSala.nombre}</h3>
            <p className="text-sm text-muted-foreground">Elegí qué plantas aplicar</p>
          </div>
        </div>

        {loadingZonas || loadingAllPlants ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" size={24} /></div>
        ) : zonas.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Esta sala no tiene zonas configuradas.</p>
        ) : (
          <>
            {/* Select all switch */}
            <div className="flex items-center justify-between rounded-lg border p-3 bg-primary/5">
              <div>
                <p className="font-medium text-sm">Todas las plantas</p>
                <p className="text-xs text-muted-foreground">{allSalaPlants.length} plantas en la sala</p>
              </div>
              <Switch checked={selectAll} onCheckedChange={toggleSelectAll} />
            </div>

            {/* Zone map */}
            <div className="relative w-full aspect-square max-w-[350px] mx-auto bg-muted/40 border-2 border-dashed rounded-lg overflow-hidden border-border">
              {zonas.map((zona) => {
                const color = getZoneColor(zona.nombre);
                const zoneW = Math.max(15, (zona.columnas / 20) * 100);
                const zoneH = Math.max(15, (zona.filas / 20) * 100);
                const isZoneSelected = selectedZoneIds.has(zona.id);
                const plantCount = getZonePlantIds(zona.id).length;

                return (
                  <div
                    key={zona.id}
                    className={cn(
                      "absolute rounded-lg border-2 flex flex-col items-center justify-center",
                      "cursor-pointer transition-all hover:scale-105",
                      color.bg, color.border,
                      isZoneSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                    )}
                    style={{ left: `${zona.posicionX}%`, top: `${zona.posicionY}%`, width: `${zoneW}%`, height: `${zoneH}%` }}
                    onClick={() => setExpandedZoneId(zona.id)}
                  >
                    <span className={cn("text-xs font-bold", color.text)}>{zona.nombre}</span>
                    <span className="text-[10px] text-muted-foreground">{plantCount}p</span>
                  </div>
                );
              })}
            </div>

            {/* Per-zone switches */}
            <div className="space-y-2">
              {zonas.map((zona) => {
                const color = getZoneColor(zona.nombre);
                const plantCount = getZonePlantIds(zona.id).length;
                return (
                  <div key={zona.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", color.dot)} />
                      <div>
                        <p className="text-sm font-medium">Zona {zona.nombre}</p>
                        <p className="text-xs text-muted-foreground">{plantCount} plantas</p>
                      </div>
                    </div>
                    <Switch
                      checked={selectAll || selectedZoneIds.has(zona.id)}
                      onCheckedChange={(checked) => toggleZone(zona.id, checked)}
                      disabled={selectAll}
                    />
                  </div>
                );
              })}
            </div>

            {/* Confirm button */}
            {totalSelected > 0 && (
              <Button className="w-full" onClick={handleConfirm}>
                <Check className="mr-2 h-4 w-4" />
                Seleccionar {totalSelected} planta{totalSelected !== 1 ? "s" : ""}
              </Button>
            )}
          </>
        )}
      </div>
    );
  }

  // ── Step 3: Expanded zone with individual plant selection ──
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setExpandedZoneId(null)} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h3 className="text-lg font-bold">Zona {expandedZone?.nombre}</h3>
          <p className="text-sm text-muted-foreground">Elegí plantas específicas</p>
        </div>
        {selectedPlantIds.size > 0 && (
          <Button size="sm" onClick={handleConfirm}>
            <Check className="mr-1 h-4 w-4" /> ({selectedPlantIds.size})
          </Button>
        )}
      </div>

      {loadingExpandedPlants ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" size={24} /></div>
      ) : expandedZonePlants.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No hay plantas en esta zona.</p>
      ) : (
        <>
          {/* ZoneGrid with plants */}
          <div className="overflow-x-auto">
            <ZoneGrid
              zonas={expandedZone ? [expandedZone] : []}
              occupiedCells={occupiedCells}
              editable={false}
              onPlantClick={(plantaId) => togglePlant(plantaId)}
            />
          </div>

          {/* Plant list with checkboxes */}
          <div className="space-y-1">
            {expandedZonePlants.map((planta) => (
              <label
                key={planta.id}
                className={cn(
                  "flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer transition-colors",
                  selectedPlantIds.has(planta.id) ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedPlantIds.has(planta.id)}
                  onChange={() => togglePlant(planta.id)}
                  className="rounded border-border"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{planta.nombre}</p>
                  <p className="text-xs text-muted-foreground">{planta.etapa}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Confirm */}
          {selectedPlantIds.size > 0 && (
            <Button className="w-full" onClick={handleConfirm}>
              <Check className="mr-2 h-4 w-4" />
              Seleccionar {selectedPlantIds.size} planta{selectedPlantIds.size !== 1 ? "s" : ""}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
