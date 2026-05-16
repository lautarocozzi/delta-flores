import { useState, useMemo, useCallback } from "react";
import ZoneGrid from "./ZoneGrid";
import type { ZonaDto, PlantaDto } from "@/interfaces/Planta";
import type { CellClickPayload, SelectedCell } from "./ZoneGrid";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, List, Grid3x3, Save, X, Loader2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────

interface LocationEditorProps {
  planta: PlantaDto;
  zonas: ZonaDto[];
  occupiedCells: Record<string, { plantaNombre: string; plantaId: number }>;
  onSave: (ubicacion: { zonaId: number; columna: number; fila: number }) => Promise<void>;
  onCancel?: () => void;
}

type EditorMode = "visual" | "select";

// ─── Helpers ──────────────────────────────────────────────

function formatUbicacionPreview(
  zonaNombre: string,
  columna: number,
  fila: number,
): string {
  return `${zonaNombre}-F${fila + 1}-C${columna + 1}`;
}

// ─── Component ────────────────────────────────────────────

export function LocationEditor({
  planta,
  zonas,
  occupiedCells,
  onSave,
  onCancel,
}: LocationEditorProps) {
  const [mode, setMode] = useState<EditorMode>("visual");
  const [saving, setSaving] = useState(false);

  // Selected cell state (visual mode)
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);

  // Select mode state
  const [selectedZonaId, setSelectedZonaId] = useState<string>("");
  const [selectedColumna, setSelectedColumna] = useState<string>("");
  const [selectedFila, setSelectedFila] = useState<string>("");

  // ── Handlers ────────────────────────────────────────────

  const handleCellSelect = useCallback((cell: CellClickPayload) => {
    setSelectedCell({ zonaId: cell.zonaId, columna: cell.columna, fila: cell.fila });
    // Also sync select mode
    setSelectedZonaId(cell.zonaId.toString());
    setSelectedColumna(cell.columna.toString());
    setSelectedFila(cell.fila.toString());
  }, []);

  const handleSelectZona = useCallback((zonaId: string) => {
    setSelectedZonaId(zonaId);
    setSelectedColumna("");
    setSelectedFila("");
    // Sync visual mode
    setSelectedCell(null);
  }, []);

  const handleSave = useCallback(async () => {
    const zonaId = selectedCell
      ? selectedCell.zonaId
      : selectedZonaId
        ? Number(selectedZonaId)
        : null;
    const columna = selectedCell
      ? selectedCell.columna
      : selectedColumna
        ? Number(selectedColumna)
        : null;
    const fila = selectedCell
      ? selectedCell.fila
      : selectedFila
        ? Number(selectedFila)
        : null;

    if (!zonaId || !columna || !fila) return;

    setSaving(true);
    try {
      await onSave({ zonaId, columna, fila });
    } finally {
      setSaving(false);
    }
  }, [selectedCell, selectedZonaId, selectedColumna, selectedFila, onSave]);

  // ── Derived state ──────────────────────────────────────

  const selectedZona = useMemo(() => {
    const id = selectedCell?.zonaId ?? (selectedZonaId ? Number(selectedZonaId) : null);
    return zonas.find((z) => z.id === id) ?? null;
  }, [zonas, selectedCell, selectedZonaId]);

  const columna = selectedCell?.columna ?? (selectedColumna ? Number(selectedColumna) : null);
  const fila = selectedCell?.fila ?? (selectedFila ? Number(selectedFila) : null);

  const hasSelection = selectedZona !== null && columna !== null && fila !== null;
  const isValidCell =
    hasSelection && selectedZona !== null &&
    columna! >= 0 && columna! < selectedZona.columnas &&
    fila! >= 0 && fila! < selectedZona.filas;

  const isCellOccupied =
    hasSelection &&
    occupiedCells[`${selectedZona!.id}-${columna!}-${fila!}`] !== undefined;

  // Dynamic column/fila options for select mode
  const columnaOptions = useMemo(() => {
    if (!selectedZona) return [];
    return Array.from({ length: selectedZona.columnas }, (_, i) => i);
  }, [selectedZona]);

  const filaOptions = useMemo(() => {
    if (!selectedZona) return [];
    return Array.from({ length: selectedZona.filas }, (_, i) => i);
  }, [selectedZona]);

  // ── Validation ──────────────────────────────────────────

  const canSave = hasSelection && isValidCell && !isCellOccupied && !saving;

  // ── Render ──────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-primary" />
          <h3 className="text-sm font-semibold">
            {planta.nombre}
          </h3>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-1 rounded-lg border p-0.5">
          <Button
            variant={mode === "visual" ? "default" : "ghost"}
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setMode("visual")}
          >
            <Grid3x3 size={14} />
            Visual
          </Button>
          <Button
            variant={mode === "select" ? "default" : "ghost"}
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setMode("select")}
          >
            <List size={14} />
            Select
          </Button>
        </div>
      </div>

      {/* ── Visual Grid Mode ───────────────────────────── */}
      {mode === "visual" && (
        <div className="max-h-[400px] overflow-auto rounded-lg border">
          <ZoneGrid
            zonas={zonas}
            occupiedCells={occupiedCells}
            onCellSelect={handleCellSelect}
            selectedCell={selectedCell}
            editable
          />
        </div>
      )}

      {/* ── Select Mode ────────────────────────────────── */}
      {mode === "select" && (
        <div className="space-y-3 rounded-lg border border-border/50 p-4">
          {/* Zona */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Zona</Label>
            <Select value={selectedZonaId} onValueChange={handleSelectZona}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Seleccionar zona" />
              </SelectTrigger>
              <SelectContent>
                {zonas.map((z) => (
                  <SelectItem key={z.id} value={z.id.toString()}>
                    {z.nombre} ({z.columnas}x{z.filas})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Columna */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Columna</Label>
            <Select
              value={selectedColumna}
              onValueChange={setSelectedColumna}
              disabled={!selectedZona}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={selectedZona ? "Seleccionar columna" : "Primero selecciona zona"} />
              </SelectTrigger>
              <SelectContent>
                {columnaOptions.map((c) => (
                  <SelectItem key={c} value={c.toString()}>
                    Columna {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fila */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Fila</Label>
            <Select
              value={selectedFila}
              onValueChange={setSelectedFila}
              disabled={!selectedZona}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={selectedZona ? "Seleccionar fila" : "Primero selecciona zona"} />
              </SelectTrigger>
              <SelectContent>
                {filaOptions.map((f) => (
                  <SelectItem key={f} value={f.toString()}>
                    Fila {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* ── Preview ────────────────────────────────────── */}
      {hasSelection && selectedZona && (
        <div className="rounded-lg border border-border/40 bg-muted/30 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Ubicación generada</span>
            <Badge variant="outline" className="text-[10px] font-mono">
              {selectedZona.nombre}: ({columna}, {fila})
            </Badge>
          </div>
          <code className="block text-sm font-mono text-primary bg-primary/5 rounded px-2 py-1.5">
            {formatUbicacionPreview(
              selectedZona.nombre,
              columna!,
              fila!,
            )}
          </code>
          {isCellOccupied && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <X size={12} />
              Esta celda ya está ocupada — elegí otra
            </p>
          )}
        </div>
      )}

      {/* ── Actions ────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
        {onCancel && (
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!canSave}
        >
          {saving ? (
            <Loader2 size={14} className="mr-1 animate-spin" />
          ) : (
            <Save size={14} className="mr-1" />
          )}
          Guardar ubicación
        </Button>
      </div>
    </div>
  );
}
