import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { usePlantas } from "@/hooks/usePlantas";
import type { ZonaDto, PlantaDto } from "@/interfaces/Planta";

interface SalaZoneContextValue {
  salaId: number;
  zonas: ZonaDto[];
  zonasLoading: boolean;
  plantas: PlantaDto[];
  plantasLoading: boolean;
  byZona: (zonaId: number) => PlantaDto[];
  getByUbicacion: (zonaNombre: string, fila: number, col: number) => PlantaDto | undefined;
  /** All possible grid positions for a zone */
  getGridPositions: (zona: ZonaDto) => Array<{ col: number; fila: number; ubicacion: string }>;
  /** Grid positions that are NOT occupied */
  getAvailablePositions: (zona: ZonaDto) => Array<{ col: number; fila: number; ubicacion: string }>;
  /** Invalidate zonas + plantas cache (after mutations) */
  invalidate: () => void;
}

const SalaZoneContext = createContext<SalaZoneContextValue | null>(null);

export function SalaZoneProvider({ salaId, children }: { salaId: number; children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: zonas = [], isLoading: zonasLoading } = useQuery<ZonaDto[]>({
    queryKey: ["zonas", "sala", salaId],
    queryFn: () => apiService.getZonasBySala(salaId),
    staleTime: 1000 * 60 * 5,
  });

  const { plantas, isLoading: plantasLoading, byZona, getByUbicacion } = usePlantas(salaId);

  const getGridPositions = useMemo(
    () =>
      (zona: ZonaDto): Array<{ col: number; fila: number; ubicacion: string }> => {
        const positions: Array<{ col: number; fila: number; ubicacion: string }> = [];
        for (let fila = 0; fila < zona.filas; fila++) {
          for (let col = 0; col < zona.columnas; col++) {
            positions.push({
              col,
              fila,
              ubicacion: `${zona.nombre}-F${fila + 1}-C${col + 1}`,
            });
          }
        }
        return positions;
      },
    [],
  );

  const getAvailablePositions = useMemo(
    () =>
      (zona: ZonaDto): Array<{ col: number; fila: number; ubicacion: string }> => {
        const zonaPlantas = byZona(zona.id);
        const occupied = new Set(
          zonaPlantas
            .filter((p) => p.columnaEnZona != null && p.filaEnZona != null)
            .map((p) => `${p.columnaEnZona},${p.filaEnZona}`),
        );
        const positions: Array<{ col: number; fila: number; ubicacion: string }> = [];
        for (let fila = 0; fila < zona.filas; fila++) {
          for (let col = 0; col < zona.columnas; col++) {
            if (!occupied.has(`${col},${fila}`)) {
              positions.push({
                col,
                fila,
                ubicacion: `${zona.nombre}-F${fila + 1}-C${col + 1}`,
              });
            }
          }
        }
        return positions;
      },
    [byZona],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps -- queryClient is stable, salaId is a rarely-changing prop
  const invalidate = useMemo(
    () => () => {
      queryClient.invalidateQueries({ queryKey: ["zonas", "sala", salaId] });
      queryClient.invalidateQueries({ queryKey: ["plantas", "sala", salaId] });
      queryClient.invalidateQueries({ queryKey: ["cepas", "sala", salaId] });
    },
    [queryClient, salaId],
  );

  const value = useMemo<SalaZoneContextValue>(
    () => ({
      salaId,
      zonas,
      zonasLoading,
      plantas,
      plantasLoading,
      byZona,
      getByUbicacion,
      getGridPositions,
      getAvailablePositions,
      invalidate,
    }),
    [salaId, zonas, zonasLoading, plantas, plantasLoading, byZona, getByUbicacion, getGridPositions, getAvailablePositions, invalidate],
  );

  return <SalaZoneContext.Provider value={value}>{children}</SalaZoneContext.Provider>;
}

export function useSalaZone(): SalaZoneContextValue {
  const ctx = useContext(SalaZoneContext);
  if (!ctx) {
    throw new Error("useSalaZone must be used within a SalaZoneProvider");
  }
  return ctx;
}