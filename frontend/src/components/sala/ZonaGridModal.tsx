import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ZonaDto, PlantaDto, CepaDto } from "@/interfaces/Planta";
import { apiService } from "@/services/api";
import { X, Plus, RotateCcw, Loader2, Trash2, MapPin, Grid3x3, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface ZonaGridModalProps {
  zona: ZonaDto;
  plantas: PlantaDto[];
  open: boolean;
  onClose: () => void;
  salaId: number;
  salaNombre: string;
  zonas: ZonaDto[];
  allPlantasByZona: (zonaId: number) => PlantaDto[];
}

export function ZonaGridModal({ zona, plantas, open, onClose, salaId, salaNombre, zonas, allPlantasByZona }: ZonaGridModalProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Swap mode state
  const [swapMode, setSwapMode] = useState(false);
  const [swapFirst, setSwapFirst] = useState<PlantaDto | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);

  // Cell creation state — Dialog-based
  const [creatingCell, setCreatingCell] = useState<{ col: number; fila: number } | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPlantaCepaId, setNewPlantaCepaId] = useState<number | null>(null);
  const [newPlantaEtapa, setNewPlantaEtapa] = useState<string>("PLANTIN");
  const [isCreating, setIsCreating] = useState(false);
  const [isBatchCreating, setIsBatchCreating] = useState(false);

  // Fetch cepas for dropdown — MUST be before useMemo that references cepas
  const { data: cepas = [] } = useQuery<CepaDto[]>({
    queryKey: ["cepas", "sala", salaId],
    queryFn: () => apiService.getCepasBySala(salaId),
    staleTime: 1000 * 60 * 5,
  });

  // Auto-generate nombre from cepa + zone + position
  const autoNombre = useMemo(() => {
    if (!creatingCell) return "";
    const selectedCepa = cepas.find((c) => c.id === newPlantaCepaId);
    const abrev = selectedCepa?.abreviatura || "SN";
    return `${abrev}-${zona.nombre}-F${creatingCell.fila + 1}-C${creatingCell.col + 1}`;
  }, [creatingCell, newPlantaCepaId, cepas, zona.nombre]);

  // Auto-generate ubicacion from zone + position
  const autoUbicacion = useMemo(() => {
    if (!creatingCell) return "";
    return `${zona.nombre}-F${creatingCell.fila + 1}-C${creatingCell.col + 1}`;
  }, [creatingCell, zona.nombre]);

  // Build grid map: "col,fila" → PlantaDto
  const gridMap = useMemo(() => {
    const map = new Map<string, PlantaDto>();
    for (const p of plantas) {
      if (p.columnaEnZona != null && p.filaEnZona != null) {
        map.set(`${p.columnaEnZona},${p.filaEnZona}`, p);
      }
    }
    return map;
  }, [plantas]);

  // Reset state when modal closes or zona changes
  useEffect(() => {
    if (!open) {
      setSwapMode(false);
      setSwapFirst(null);
      setCreatingCell(null);
      setCreateDialogOpen(false);
    }
  }, [open, zona.id]);

  // Handle cell click
  const handleCellClick = (col: number, fila: number) => {
    const plant = gridMap.get(`${col},${fila}`);

    if (swapMode && plant) {
      if (swapFirst === null) {
        setSwapFirst(plant);
      } else if (swapFirst.id !== plant.id) {
        // Perform swap
        setIsSwapping(true);
        apiService
          .swapPlantasUbicacion(swapFirst.id, plant.id)
          .then(() => {
            toast({ title: "Plantas Intercambiadas", description: "Las posiciones fueron intercambiadas correctamente." });
            queryClient.invalidateQueries({ queryKey: ["plantas", "sala", salaId] });
            setSwapFirst(null);
          })
          .catch((error: any) => {
            toast({ variant: "destructive", title: "Error", description: error.message || "No se pudieron intercambiar las plantas." });
          })
          .finally(() => setIsSwapping(false));
      }
      return;
    }

    // Plant exists and not in swap mode → navigate to plant detail
    if (plant) {
      navigate(`/plant/${plant.id}`);
      return;
    }

    // Empty cell → open create dialog
    if (!plant) {
      setCreatingCell({ col, fila });
      setNewPlantaCepaId(null);
      setNewPlantaEtapa("PLANTIN");
      setCreateDialogOpen(true);
    }
  };

  // Handle create plant (from Dialog)
  const handleCreatePlant = () => {
    if (creatingCell == null || newPlantaCepaId == null) return;

    setIsCreating(true);
    apiService
      .createPlanta({
        nombre: autoNombre,
        cepaId: newPlantaCepaId,
        salaId,
        zonaId: zona.id,
        columnaEnZona: creatingCell.col,
        filaEnZona: creatingCell.fila,
        etapa: newPlantaEtapa,
      })
      .then(() => {
        toast({ title: "Planta Creada", description: "La planta fue creada correctamente." });
        queryClient.invalidateQueries({ queryKey: ["plantas", "sala", salaId] });
        setCreateDialogOpen(false);
        setCreatingCell(null);
      })
      .catch((error: any) => {
        toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo crear la planta." });
      })
      .finally(() => setIsCreating(false));
  };

  // Completar resto de la zona actual con la cepa y etapa seleccionadas
  const handleCompleteZona = () => {
    if (newPlantaCepaId == null) return;

    const selectedCepa = cepas.find((c) => c.id === newPlantaCepaId);
    const abrev = selectedCepa?.abreviatura || "SN";

    // Find all empty cells in the current zone
    const tasks: Promise<void>[] = [];
    for (let fila = 0; fila < zona.filas; fila++) {
      for (let col = 0; col < zona.columnas; col++) {
        if (!gridMap.has(`${col},${fila}`)) {
          tasks.push(
            apiService.createPlanta({
              nombre: `${abrev}-${zona.nombre}-F${fila + 1}-C${col + 1}`,
              cepaId: newPlantaCepaId,
              salaId,
              zonaId: zona.id,
              columnaEnZona: col,
              filaEnZona: fila,
              etapa: newPlantaEtapa,
            }).then(() => {})
          );
        }
      }
    }

    if (tasks.length === 0) {
      toast({ title: "Zona completa", description: "No hay celdas vacías en esta zona." });
      return;
    }

    setIsBatchCreating(true);
    Promise.allSettled(tasks).then((results) => {
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;
      toast({
        title: `Zona ${zona.nombre} completada`,
        description: `${succeeded} planta${succeeded !== 1 ? "s" : ""} creada${succeeded !== 1 ? "s" : ""}${failed > 0 ? `. ${failed} fallaron.` : "."}`,
        ...(failed > 0 ? { variant: "destructive" as const } : {}),
      });
      queryClient.invalidateQueries({ queryKey: ["plantas", "sala", salaId] });
      setCreateDialogOpen(false);
      setCreatingCell(null);
      setIsBatchCreating(false);
    });
  };

  // Completar resto de TODAS las zonas de la sala
  const handleCompleteSala = () => {
    if (newPlantaCepaId == null) return;

    const selectedCepa = cepas.find((c) => c.id === newPlantaCepaId);
    const abrev = selectedCepa?.abreviatura || "SN";

    const tasks: Promise<void>[] = [];
    for (const z of zonas) {
      const zPlantas = allPlantasByZona(z.id);
      const occupiedMap = new Map<string, boolean>();
      for (const p of zPlantas) {
        if (p.columnaEnZona != null && p.filaEnZona != null) {
          occupiedMap.set(`${p.columnaEnZona},${p.filaEnZona}`, true);
        }
      }

      for (let fila = 0; fila < z.filas; fila++) {
        for (let col = 0; col < z.columnas; col++) {
          if (!occupiedMap.has(`${col},${fila}`)) {
            tasks.push(
              apiService.createPlanta({
                nombre: `${abrev}-${z.nombre}-F${fila + 1}-C${col + 1}`,
                cepaId: newPlantaCepaId!,
                salaId,
                zonaId: z.id,
                columnaEnZona: col,
                filaEnZona: fila,
                etapa: newPlantaEtapa,
              }).then(() => {})
            );
          }
        }
      }
    }

    if (tasks.length === 0) {
      toast({ title: "Sala completa", description: "No hay celdas vacías en ninguna zona." });
      return;
    }

    setIsBatchCreating(true);
    Promise.allSettled(tasks).then((results) => {
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;
      toast({
        title: `${salaNombre} completada`,
        description: `${succeeded} planta${succeeded !== 1 ? "s" : ""} creada${succeeded !== 1 ? "s" : ""}${failed > 0 ? `. ${failed} fallaron.` : "."}`,
        ...(failed > 0 ? { variant: "destructive" as const } : {}),
      });
      queryClient.invalidateQueries({ queryKey: ["plantas", "sala", salaId] });
      setCreateDialogOpen(false);
      setCreatingCell(null);
      setIsBatchCreating(false);
    });
  };

  // Prevent rendering if not open
  // Note: Dialog open state is handled via the `open` prop below.
  // We return the component anyway so Dialog manages transitions properly.

  return (
    <>
      <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden flex flex-col max-h-[90vh] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
          {/* Header */}
          <div className="sticky top-0 z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b bg-background/80 backdrop-blur-sm px-4 sm:px-6 py-4 gap-3 pr-10">
            <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {/* Ocultar título en mobile */}
              <span className="text-lg font-bold whitespace-nowrap hidden sm:inline">
                Zona {zona.nombre} ({zona.columnas}×{zona.filas})
              </span>

              {/* Botones de acción, visibles siempre, con botón de cerrar adicional para mobile */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* Swap mode toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setSwapMode(!swapMode);
                    setSwapFirst(null);
                  }}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${swapMode
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  title={swapMode ? "Desactivar modo rotación" : "Activar modo rotación"}
                >
                  <RotateCcw size={14} />
                  <span>{swapMode ? "Rotando..." : "Rotar"}</span>
                </button>

                {/* Delete zone button */}
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`¿Eliminar Zona ${zona.nombre}? Esta acción no se puede deshacer.`)) {
                      apiService
                        .deleteZona(zona.id)
                        .then(() => {
                          toast({ title: "Zona Eliminada", description: "La zona fue eliminada correctamente." });
                          queryClient.invalidateQueries({ queryKey: ["zonas", "sala", salaId] });
                          queryClient.invalidateQueries({ queryKey: ["salas"] });
                          onClose();
                        })
                        .catch((error: any) => {
                          toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo eliminar la zona." });
                        });
                    }
                  }}
                  className="rounded-md p-1.5 hover:bg-destructive/10 text-destructive transition-colors"
                  title="Eliminar zona"
                >
                  <Trash2 size={16} />
                </button>

                {/* Botón de cerrar explícito para mobile */}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md p-1.5 hover:bg-muted text-muted-foreground transition-colors sm:hidden ml-auto"
                  title="Cerrar modal"
                >
                  <X size={16} />
                </button>
              </div>
            </DialogTitle>

            {/* Swap first plant indicator */}
            {swapFirst && (
              <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded truncate max-w-[200px]">
                Sel: {swapFirst.nombre}
              </span>
            )}
          </div>

          {/* Grid */}
          <div className="p-4 sm:p-6 overflow-x-auto overflow-y-auto flex-1 overscroll-contain">
            <div
              className="inline-grid gap-1.5"
              style={{
                gridTemplateColumns: `auto repeat(${zona.columnas}, minmax(65px, 1fr))`,
              }}
            >
              {/* Header row: column labels */}
              <div className="w-8" />
              {Array.from({ length: zona.columnas }, (_, col) => (
                <div
                  key={`col-${col}`}
                  className="text-center text-xs font-semibold text-muted-foreground py-1"
                >
                  C{col + 1}
                </div>
              ))}

              {/* Data rows */}
              {Array.from({ length: zona.filas }, (_, fila) => (
                <>
                  {/* Row label */}
                  <div
                    key={`row-label-${fila}`}
                    className="text-xs font-semibold text-muted-foreground flex items-center justify-center pr-2"
                  >
                    F{fila + 1}
                  </div>
                  {/* Cells */}
                  {Array.from({ length: zona.columnas }, (_, col) => {
                    const key = `${col},${fila}`;
                    const plant = gridMap.get(key);
                    const isSwapHighlighted = swapFirst?.id === plant?.id;

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleCellClick(col, fila)}
                        className={`aspect-square rounded-lg border p-1.5 flex flex-col items-center justify-center text-center transition-all min-h-[60px] ${plant
                            ? swapMode
                              ? isSwapHighlighted
                                ? "bg-green-900/50 border-primary ring-2 ring-primary cursor-pointer"
                                : "bg-green-900/30 border-green-600/50 hover:ring-2 hover:ring-primary/50 cursor-pointer"
                              : "bg-green-900/30 border-green-600/50"
                            : "bg-yellow-400/40 border-yellow-500/50 hover:bg-yellow-400/60 cursor-pointer"
                          }`}
                        title={plant ? `${plant.nombre} (${plant.etapa})` : "Vacío — click para agregar"}
                      >
                        {plant ? (
                          <>
                            <span className="text-xs font-medium truncate w-full leading-tight">
                              {plant.nombre}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate w-full">
                              {plant.etapa}
                            </span>
                          </>
                        ) : (
                          <Plus size={16} className="text-yellow-600" />
                        )}
                      </button>
                    );
                  })}
                </>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="hidden sm:block border-t px-4 sm:px-6 py-3 text-xs text-muted-foreground bg-muted/30">
            {plantas.length} planta{plantas.length !== 1 ? "s" : ""} en Zona {zona.nombre}
            {swapMode && (
              <span className="block sm:inline sm:ml-4 text-primary mt-1 sm:mt-0 font-medium">
                Modo rotación activo: seleccioná 2 plantas para intercambiar
              </span>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Plant Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Añadir Planta</DialogTitle>
            <DialogDescription>
              Ubicación: <span className="font-semibold text-foreground">{autoUbicacion}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold">Cepa</label>
              <Select value={newPlantaCepaId?.toString() ?? ""} onValueChange={(v) => setNewPlantaCepaId(Number(v))}>
                <SelectTrigger className="font-medium"><SelectValue placeholder="Seleccionar cepa..." /></SelectTrigger>
                <SelectContent>
                  {cepas.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.abreviatura ? `${c.abreviatura} — ` : ""}{c.geneticaParental}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold">Etapa</label>
              <Select value={newPlantaEtapa} onValueChange={setNewPlantaEtapa}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GERMINACION">Germinación</SelectItem>
                  <SelectItem value="PLANTIN">Plantín</SelectItem>
                  <SelectItem value="VEGETACION">Vegetación</SelectItem>
                  <SelectItem value="FLORACION">Floración</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Nombre (auto)</label>
              <div className="text-sm text-muted-foreground bg-muted/30 rounded-md px-3 py-2 border border-muted">
                {autoNombre || "—"}
              </div>
            </div>
            <div className="text-sm bg-muted/50 rounded-md p-2 flex items-center font-medium">
              <MapPin size={14} className="mr-1.5 shrink-0 text-primary" />
              <span className="text-primary">{autoUbicacion}</span>
            </div>

            {/* Batch fill buttons — shown when a cepa is selected */}
            {newPlantaCepaId !== null && (
              <div className="space-y-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={handleCompleteZona}
                  disabled={isBatchCreating}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                >
                  <Grid3x3 size={14} />
                  Completar resto de Zona {zona.nombre}
                </button>
                <button
                  type="button"
                  onClick={handleCompleteSala}
                  disabled={isBatchCreating}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                >
                  <Layers size={14} />
                  Completar resto de {salaNombre}
                </button>
              </div>
            )}
          </div>
          <DialogFooter>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              onClick={handleCreatePlant}
              disabled={isCreating || newPlantaCepaId == null}
            >
              {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Añadir
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
