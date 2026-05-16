import { useState } from "react";
import { ZonaDto } from "@/interfaces/Planta";
import { ZonaBlock } from "./ZonaBlock";
import { usePlantas } from "@/hooks/usePlantas";

const CELL_PCT = 5; // 5% per cell → 20×20 grid = 100%

interface UnifiedSalaViewProps {
  zonas: ZonaDto[];
  salaId: number;
  onZonaClick: (zonaId: number) => void;
  onEditZona?: (zona: ZonaDto) => void;
  onDeleteZona?: (zona: ZonaDto) => void;
}

export function UnifiedSalaView({ zonas, salaId, onZonaClick, onEditZona, onDeleteZona }: UnifiedSalaViewProps) {
  const [hoveredZonaId, setHoveredZonaId] = useState<number | null>(null);
  const { byZona } = usePlantas(salaId);

  if (zonas.length === 0) {
    return (
      <div className="relative w-full rounded-2xl border border-white/20 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Mapa de Zonas</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-muted-foreground">No hay zonas configuradas en esta sala.</p>
          <p className="text-xs text-muted-foreground mt-1">Agregá una zona para ver el mapa.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-2xl border border-white/20 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Mapa de Zonas</h3>

      <div className="relative w-full aspect-square bg-muted/40 rounded-lg overflow-hidden">
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: `${CELL_PCT}% ${CELL_PCT}%`,
          }}
        />

        {/* Zones */}
        {zonas.map((zona) => {
          const plantas = byZona(zona.id);
          return (
            <div
              key={zona.id}
              className="absolute"
              style={{
                left: `${zona.posicionX}%`,
                top: `${zona.posicionY}%`,
                width: `${zona.columnas * CELL_PCT}%`,
                height: `${zona.filas * CELL_PCT}%`,
                zIndex: hoveredZonaId === zona.id ? 20 : 10,
              }}
              onMouseEnter={() => setHoveredZonaId(zona.id)}
              onMouseLeave={() => setHoveredZonaId(null)}
            >
              <ZonaBlock
                zona={zona}
                plantas={plantas}
                onClick={() => onZonaClick(zona.id)}
                onEdit={onEditZona}
                onDelete={onDeleteZona}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}