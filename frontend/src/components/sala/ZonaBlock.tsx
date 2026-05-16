import { useMemo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { ZonaDto, PlantaDto } from "@/interfaces/Planta";

interface ZonaBlockProps {
  zona: ZonaDto;
  plantas: PlantaDto[];
  onClick: () => void;
  onEdit?: (zona: ZonaDto) => void;
  onDelete?: (zona: ZonaDto) => void;
}

// Matte color palette cycled by zone letter index
const ZONE_COLORS = [
  { bg: "bg-slate-500/60", border: "border-slate-400/50", text: "text-slate-100", accent: "bg-slate-400/30" },
  { bg: "bg-emerald-600/60", border: "border-emerald-400/50", text: "text-emerald-100", accent: "bg-emerald-400/30" },
  { bg: "bg-amber-600/60", border: "border-amber-400/50", text: "text-amber-100", accent: "bg-amber-400/30" },
  { bg: "bg-rose-600/60", border: "border-rose-400/50", text: "text-rose-100", accent: "bg-rose-400/30" },
  { bg: "bg-violet-600/60", border: "border-violet-400/50", text: "text-violet-100", accent: "bg-violet-400/30" },
  { bg: "bg-cyan-600/60", border: "border-cyan-400/50", text: "text-cyan-100", accent: "bg-cyan-400/30" },
  { bg: "bg-lime-600/60", border: "border-lime-400/50", text: "text-lime-100", accent: "bg-lime-400/30" },
  { bg: "bg-orange-600/60", border: "border-orange-400/50", text: "text-orange-100", accent: "bg-orange-400/30" },
  { bg: "bg-fuchsia-600/60", border: "border-fuchsia-400/50", text: "text-fuchsia-100", accent: "bg-fuchsia-400/30" },
  { bg: "bg-teal-600/60", border: "border-teal-400/50", text: "text-teal-100", accent: "bg-teal-400/30" },
];

function getZoneColorIndex(nombre: string): number {
  // Single letter zone: A=0, B=1, etc.
  if (nombre.length === 1) {
    const code = nombre.toUpperCase().charCodeAt(0);
    const letterIndex = code - 65; // 'A' = 65
    if (letterIndex >= 0 && letterIndex < 26) {
      return letterIndex % ZONE_COLORS.length;
    }
  }
  // Fallback: hash the name
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % ZONE_COLORS.length;
}

export function ZonaBlock({ zona, plantas, onClick, onEdit, onDelete }: ZonaBlockProps) {
  const color = ZONE_COLORS[getZoneColorIndex(zona.nombre)];

  // Build grid map: "col,fila" → PlantaDto
  const gridMap = useMemo(() => {
    const map = new Map<string, PlantaDto>();
    for (const p of plantas) {
      if (p.columnaEnZona != null && p.filaEnZona != null) {
        map.set(`${p.columnaEnZona},${p.filaEnZona}`, p);
      }
    }
    return map;
  }, [plantas, zona]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col h-full w-full rounded-lg border backdrop-blur-xl ${color.border} ${color.bg} p-2 shadow-lg transition-all hover:scale-[1.02] hover:ring-2 hover:ring-white/30 cursor-pointer text-left`}
      title={`Zona ${zona.nombre} — Click para ver el grid completo`}
    >
      {/* Edit & Delete icons — only shown if callbacks provided */}
      {(onEdit || onDelete) && (
        <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit(zona); }}
              className="rounded p-0.5 hover:bg-white/20"
              title="Editar zona"
            >
              <Pencil size={12} className="text-white/70" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(zona); }}
              className="rounded p-0.5 hover:bg-white/20"
              title="Eliminar zona"
            >
              <Trash2 size={12} className="text-white/70" />
            </button>
          )}
        </div>
      )}

      {/* Grid preview — proportional cells with centered dots */}
      <div
        className="grid gap-px flex-1"
        style={{
          gridTemplateColumns: `repeat(${zona.columnas}, 1fr)`,
          gridTemplateRows: `repeat(${zona.filas}, 1fr)`,
        }}
      >
        {Array.from({ length: zona.filas }, (_, fila) =>
          Array.from({ length: zona.columnas }, (_, col) => {
            const key = `${col},${fila}`;
            const plant = gridMap.get(key);
            return (
              <div
                key={key}
                className="flex items-center justify-center rounded-sm transition-colors"
                title={plant ? `${plant.nombre} (${plant.etapa})` : "Vacío"}
              >
                <div
                  className={`rounded-full ${plant
                    ? "bg-green-400/80 w-2 h-2 sm:w-2.5 sm:h-2.5"
                    : "bg-yellow-400/60 w-1.5 h-1.5 sm:w-2 sm:h-2"
                    }`}
                />
              </div>
            );
          })
        )}
      </div>
    </button>
  );
}
