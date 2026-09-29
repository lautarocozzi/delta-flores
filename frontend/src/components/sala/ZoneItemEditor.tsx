import { useRef } from "react";
import { useWatch } from "react-hook-form";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import type { Control, UseFormSetValue, FieldValues, Path } from "react-hook-form";

// ─── Zone Colors ──────────────────────────────────────────────
const ZONE_COLORS = [
  { bg: "bg-blue-500/25", border: "border-blue-500", text: "text-blue-300" },
  { bg: "bg-emerald-500/25", border: "border-emerald-500", text: "text-emerald-300" },
  { bg: "bg-amber-500/25", border: "border-amber-500", text: "text-amber-300" },
  { bg: "bg-violet-500/25", border: "border-violet-500", text: "text-violet-300" },
  { bg: "bg-rose-500/25", border: "border-rose-500", text: "text-rose-300" },
  { bg: "bg-cyan-500/25", border: "border-cyan-500", text: "text-cyan-300" },
];

// ─── Auto zone letter ─────────────────────────────────────────
export function getZoneLetter(index: number): string {
  if (index < 26) return String.fromCharCode(65 + index);
  const first = Math.floor(index / 26) - 1;
  const second = index % 26;
  return String.fromCharCode(65 + first) + String.fromCharCode(65 + second);
}

// ─── Zone shape expected by ZoneItem ──────────────────────────
export interface ZoneValues {
  posicionX: number;
  posicionY: number;
  columnas: number;
  filas: number;
}

// ─── ZoneItem — drag-to-position editor ──────────────────────
interface ZoneItemProps<T extends FieldValues> {
  index: number;
  control: Control<T>;
  setValue: UseFormSetValue<T>;
  zonePath: Path<T>; // e.g. "zonas.0"
  onRemove: () => void;
}

export function ZoneItemEditor<T extends FieldValues>({
  index,
  control,
  setValue,
  zonePath,
  onRemove,
}: ZoneItemProps<T>) {
  const zone = useWatch({ control, name: zonePath as any }) as ZoneValues | undefined;
  const containerRef = useRef<HTMLDivElement | null>(null);

  if (!zone) return null;

  const color = ZONE_COLORS[index % ZONE_COLORS.length];
  const cellPct = 5;
  const zoneW = Math.max(10, (zone.columnas || 1) * cellPct);
  const zoneH = Math.max(10, (zone.filas || 1) * cellPct);

  const handlePreviewClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;
    const snapTo5 = (val: number) => Math.round(val / 5) * 5;
    const newX = snapTo5(Math.max(0, Math.min(100 - zoneW, clickX - zoneW / 2)));
    const newY = snapTo5(Math.max(0, Math.min(100 - zoneH, clickY - zoneH / 2)));
    setValue(`${zonePath}.posicionX` as any, newX);
    setValue(`${zonePath}.posicionY` as any, newY);
  };

  return (
    <div className="border border-border rounded-lg p-3 space-y-3">
      {/* Row 1: letter + columns + rows */}
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium mr-1 shrink-0">
          Zona {getZoneLetter(index)}
        </span>
        <div className="flex-1 grid grid-cols-2 gap-2">
          <FormField
            control={control}
            name={`${zonePath}.columnas` as any}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="number" min={1} max={20} className="h-8 text-sm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`${zonePath}.filas` as any}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="number" min={1} max={20} className="h-8 text-sm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Preview — click to position zone */}
      <div
        ref={containerRef}
        className="relative w-full aspect-square bg-muted/40 border-2 border-dashed border-muted-foreground/30 rounded-lg overflow-hidden cursor-crosshair"
        onClick={handlePreviewClick}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: `${100 / Math.max(zone.columnas, 1)}% ${100 / Math.max(zone.filas, 1)}%`,
          }}
        />
        <div
          className={`absolute rounded-md border-2 ${color.bg} ${color.border} ${color.text} flex items-center justify-center text-xs font-medium overflow-hidden transition-all duration-100 select-none pointer-events-none`}
          style={{
            left: `${zone.posicionX}%`,
            top: `${zone.posicionY}%`,
            width: `${zoneW}%`,
            height: `${zoneH}%`,
          }}
        >
          <span className="truncate text-center leading-tight px-0.5">
            {getZoneLetter(index)}
            <br />
            <span className="opacity-60 text-[10px]">
              {zone.columnas}×{zone.filas}
            </span>
          </span>
        </div>
      </div>

      {/* Position readout */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground/60">
        <span className="flex items-center gap-1">
          X: <span className="font-mono">{zone.posicionX}%</span>
        </span>
        <span className="flex items-center gap-1">
          Y: <span className="font-mono">{zone.posicionY}%</span>
        </span>
        <span className="text-muted-foreground/30">—</span>
        <span className="text-muted-foreground/40">
          Zona {getZoneLetter(index)} · click en el preview para ubicar
        </span>
      </div>
    </div>
  );
}
