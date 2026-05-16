import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import type { PlantaDto } from "@/interfaces/Planta";

interface UsePlantasResult {
  plantas: PlantaDto[];
  isLoading: boolean;
  byZona: (zonaId: number) => PlantaDto[];
  getByUbicacion: (zonaNombre: string, fila: number, col: number) => PlantaDto | undefined;
}

export function usePlantas(salaId: number | null): UsePlantasResult {
  const { data: plantas = [], isLoading } = useQuery<PlantaDto[]>({
    queryKey: ["plantas", "sala", salaId],
    queryFn: () => apiService.getPlantasBySala(salaId!),
    enabled: !!salaId,
    staleTime: 1000 * 60 * 5,
  });

  const byZonaMap = useMemo(() => {
    const map = new Map<number, PlantaDto[]>();
    for (const p of plantas) {
      if (p.zonaId != null) {
        if (!map.has(p.zonaId)) map.set(p.zonaId, []);
        map.get(p.zonaId)!.push(p);
      }
    }
    return map;
  }, [plantas]);

  const byZona = useMemo(
    () => (zonaId: number) => byZonaMap.get(zonaId) ?? [],
    [byZonaMap],
  );

  const getByUbicacion = useMemo(
    () =>
      (zonaNombre: string, fila: number, col: number): PlantaDto | undefined => {
        const ubicacion = `${zonaNombre}-F${fila + 1}-C${col + 1}`;
        return plantas.find((p) => p.ubicacion === ubicacion);
      },
    [plantas],
  );

  return { plantas, isLoading, byZona, getByUbicacion };
}