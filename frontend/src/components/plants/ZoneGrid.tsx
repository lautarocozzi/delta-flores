import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ZonaDto } from "@/interfaces/Planta";
import { Plus, Leaf } from "lucide-react";

// ─── Types ────────────────────────────────────────────────

export interface SelectedCell {
  zonaId: number;
  columna: number;
  fila: number;
}

export interface CellClickPayload {
  zonaId: number;
  columna: number;
  fila: number;
  zonaNombre: string;
}

interface ZoneGridProps {
  zonas: ZonaDto[];
  occupiedCells?: Record<string, { plantaNombre: string; plantaId: number }>;
  onCellSelect?: (cell: CellClickPayload) => void;
  selectedCell?: SelectedCell | null;
  editable?: boolean;
  salaNombre?: string;
}

// ─── Helpers ──────────────────────────────────────────────

/** Generate the cell key used for occupiedCells lookup and React keys. */
function cellKey(zonaId: number, col: number, fila: number): string {
  return `${zonaId}-${col}-${fila}`;
}

/** Total width of a zone in grid units (columna cuenta desde 0). */
function zoneWidthPx(columnas: number, cellSize: number, gap: number): number {
  return columnas * cellSize + (columnas - 1) * gap;
}

function zoneHeightPx(filas: number, cellSize: number, gap: number): number {
  return filas * cellSize + (filas - 1) * gap;
}

// ─── Cell Component ───────────────────────────────────────

interface CellProps {
  zonaId: number;
  columna: number;
  fila: number;
  zonaNombre: string;
  isOccupied: boolean;
  plantaNombre?: string;
  plantaId?: number;
  isSelected: boolean;
  editable: boolean;
  onCellSelect?: (cell: CellClickPayload) => void;
}

const Cell = React.memo(function Cell({
  zonaId,
  columna,
  fila,
  zonaNombre,
  isOccupied,
  plantaNombre,
  plantaId,
  isSelected,
  editable,
  onCellSelect,
}: CellProps) {
  const handleClick = () => {
    if (isOccupied) return;
    if (!editable || !onCellSelect) return;
    onCellSelect({ zonaId, columna, fila, zonaNombre });
  };

  // Occupied cell — show plant name abbreviation
  if (isOccupied) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center justify-center rounded-md border",
              "bg-muted/40 border-border/50 cursor-default select-none",
              "h-full w-full text-xs text-muted-foreground",
            )}
          >
            <span className="truncate px-1 font-mono">
              {plantaNombre || "—"}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p>{plantaNombre}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Selected cell
  if (isSelected) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md border-2",
          "border-primary bg-primary/10 ring-2 ring-primary/30",
          "h-full w-full cursor-pointer transition-all",
        )}
        onClick={handleClick}
      >
        <Leaf size={14} className="text-primary" />
      </div>
    );
  }

  // Free cell
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-md border border-dashed",
        "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5",
        "h-full w-full cursor-pointer transition-colors",
        !editable && "cursor-default hover:border-muted-foreground/25 hover:bg-transparent",
      )}
      onClick={handleClick}
    >
      {editable && <Plus size={14} className="text-muted-foreground/40" />}
    </div>
  );
});

// ─── Zone Section Component ───────────────────────────────

interface ZoneSectionProps {
  zona: ZonaDto;
  occupiedCells: Record<string, { plantaNombre: string; plantaId: number }>;
  selectedCell?: SelectedCell | null;
  editable: boolean;
  onCellSelect?: (cell: CellClickPayload) => void;
  cellSize: number;
  gap: number;
}

const ZoneSection = React.memo(function ZoneSection({
  zona,
  occupiedCells,
  selectedCell,
  editable,
  onCellSelect,
  cellSize,
  gap,
}: ZoneSectionProps) {
  const { id, nombre, columnas, filas } = zona;

  const rows = useMemo(() => {
    const result: React.ReactNode[] = [];
    for (let fila = 0; fila < filas; fila++) {
      for (let col = 0; col < columnas; col++) {
        const key = cellKey(id, col, fila);
        const occupant = occupiedCells[key];
        const isOccupied = !!occupant;
        const isSelected =
          selectedCell?.zonaId === id &&
          selectedCell?.columna === col &&
          selectedCell?.fila === fila;

        result.push(
          <Cell
            key={key}
            zonaId={id}
            columna={col}
            fila={fila}
            zonaNombre={nombre}
            isOccupied={isOccupied}
            plantaNombre={occupant?.plantaNombre}
            plantaId={occupant?.plantaId}
            isSelected={isSelected}
            editable={editable}
            onCellSelect={onCellSelect}
          />,
        );
      }
    }
    return result;
  }, [id, nombre, columnas, filas, occupiedCells, selectedCell, editable, onCellSelect]);

  return (
    <div
      className="absolute rounded-lg border border-border/60 bg-card/50 backdrop-blur-sm p-2"
      style={{
        left: zona.posicionX,
        top: zona.posicionY,
      }}
    >
      {/* Zone header */}
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {nombre}
        </span>
        <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono">
          {columnas}x{filas}
        </Badge>
      </div>

      {/* Grid */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${columnas}, ${cellSize}px)`,
          gap: `${gap}px`,
          width: zoneWidthPx(columnas, cellSize, gap),
          height: zoneHeightPx(filas, cellSize, gap),
        }}
      >
        {rows}
      </div>
    </div>
  );
});

// ─── Main ZoneGrid Component ──────────────────────────────

const CELL_SIZE = 48;
const GRID_GAP = 4;
const CONTAINER_PADDING = 32; // extra padding around zones

function ZoneGrid({
  zonas,
  occupiedCells = {},
  onCellSelect,
  selectedCell,
  editable = false,
  salaNombre,
}: ZoneGridProps) {
  // Calculate container dimensions based on zone positions + sizes
  const containerDimensions = useMemo(() => {
    if (zonas.length === 0) {
      return { width: 600, height: 400 };
    }

    let maxRight = 0;
    let maxBottom = 0;

    for (const zona of zonas) {
      const right = zona.posicionX + zoneWidthPx(zona.columnas, CELL_SIZE, GRID_GAP) + 16; // +16 for padding inside zone
      const bottom = zona.posicionY + 32 + zoneHeightPx(zona.filas, CELL_SIZE, GRID_GAP) + 16; // +32 for header

      if (right > maxRight) maxRight = right;
      if (bottom > maxBottom) maxBottom = bottom;
    }

    return {
      width: Math.max(maxRight + CONTAINER_PADDING, 600),
      height: Math.max(maxBottom + CONTAINER_PADDING, 200),
    };
  }, [zonas]);

  if (zonas.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 p-12 text-center">
        <div>
          <Leaf className="mx-auto mb-2 text-muted-foreground/50" size={32} />
          <p className="text-sm text-muted-foreground">
            No hay zonas configuradas para esta sala
          </p>
          {editable && (
            <p className="text-xs text-muted-foreground/60 mt-1">
              Crea una zona para comenzar
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {salaNombre && (
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">{salaNombre}</h3>
          <span className="text-xs text-muted-foreground">
            ({zonas.length} {zonas.length === 1 ? "zona" : "zonas"})
          </span>
        </div>
      )}

      <div
        className="relative rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm overflow-auto"
        style={{
          minHeight: containerDimensions.height,
          minWidth: containerDimensions.width,
        }}
      >
        {zonas.map((zona) => (
          <ZoneSection
            key={zona.id}
            zona={zona}
            occupiedCells={occupiedCells}
            selectedCell={selectedCell}
            editable={editable}
            onCellSelect={onCellSelect}
            cellSize={CELL_SIZE}
            gap={GRID_GAP}
          />
        ))}
      </div>
    </div>
  );
}

export default React.memo(ZoneGrid);
