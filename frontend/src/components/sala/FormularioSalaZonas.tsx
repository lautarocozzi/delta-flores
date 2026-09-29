import { useState, useRef, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { SalaDto, ZonaDto } from "@/schemas/DTOSchemas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, X, MapPin, Grid3x3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ZoneItemEditor } from "@/components/sala/ZoneItemEditor";

// ── Zone schema ────────────────────────────────
const zonaItemSchema = z.object({
  posicionX: z.coerce.number().min(0).max(100).refine((v) => v % 5 === 0, "Debe ser múltiplo de 5").default(0),
  posicionY: z.coerce.number().min(0).max(100).refine((v) => v % 5 === 0, "Debe ser múltiplo de 5").default(0),
  columnas: z.coerce.number().int("Debe ser un número entero").min(1).max(20),
  filas: z.coerce.number().int("Debe ser un número entero").min(1).max(20),
});
type ZonaItemData = z.infer<typeof zonaItemSchema>;

const zonaArraySchema = z.object({ zonas: z.array(zonaItemSchema) });
type ZonaArrayData = z.infer<typeof zonaArraySchema>;

// ── Colors ─────────────────────────────────────
const ZONE_COLORS = [
  { bg: "bg-blue-500/25", border: "border-blue-500", text: "text-blue-300" },
  { bg: "bg-emerald-500/25", border: "border-emerald-500", text: "text-emerald-300" },
  { bg: "bg-amber-500/25", border: "border-amber-500", text: "text-amber-300" },
  { bg: "bg-violet-500/25", border: "border-violet-500", text: "text-violet-300" },
  { bg: "bg-rose-500/25", border: "border-rose-500", text: "text-rose-300" },
  { bg: "bg-cyan-500/25", border: "border-cyan-500", text: "text-cyan-300" },
];

function getZoneColorIndex(nombre: string): number {
  if (nombre.length === 1) {
    const code = nombre.toUpperCase().charCodeAt(0);
    const idx = code - 65;
    if (idx >= 0 && idx < 26) return idx % ZONE_COLORS.length;
  }
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % ZONE_COLORS.length;
}

// ── Existing zone preview (click-to-position) ──
function ExistingZonePreview({ zona, onPositionChange }: { zona: ZonaDto; onPositionChange: (id: number, x: number, y: number) => void }) {
  const color = ZONE_COLORS[getZoneColorIndex(zona.nombre)];
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [editing, setEditing] = useState(false);
  const cellPct = 5;
  const zoneW = Math.max(10, (zona.columnas || 1) * cellPct);
  const zoneH = Math.max(10, (zona.filas || 1) * cellPct);

  const handleClick = (e: React.MouseEvent) => {
    if (!editing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;
    const snap = (v: number) => Math.round(v / 5) * 5;
    const newX = snap(Math.max(0, Math.min(100 - zoneW, clickX - zoneW / 2)));
    const newY = snap(Math.max(0, Math.min(100 - zoneH, clickY - zoneH / 2)));
    onPositionChange(zona.id, newX, newY);
    setEditing(false);
  };

  return (
    <div className="border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Zona {zona.nombre} ({zona.columnas}×{zona.filas})</span>
          <Button variant={editing ? "default" : "ghost"} size="sm" type="button" className="h-6 text-xs" onClick={() => setEditing((p) => !p)}>
            <MapPin className="w-3 h-3 mr-1" />
            {editing ? "Listo" : "Mover"}
          </Button>
        </div>
        <span className="text-xs text-muted-foreground/60">X:{zona.posicionX}% Y:{zona.posicionY}%</span>
      </div>
      <div
        ref={containerRef}
        className={`relative w-full aspect-square bg-muted/40 border-2 border-dashed rounded-lg overflow-hidden transition-colors ${editing ? "border-primary cursor-crosshair" : "border-muted-foreground/30"}`}
        onClick={handleClick}
      >
        <div className={`absolute rounded-md border-2 ${color.bg} ${color.border} ${color.text} flex items-center justify-center text-xs font-medium overflow-hidden pointer-events-none transition-all duration-100`}
          style={{ left: `${zona.posicionX}%`, top: `${zona.posicionY}%`, width: `${zoneW}%`, height: `${zoneH}%` }}>
          <span className="truncate text-center leading-tight px-0.5">
            {zona.nombre}<br /><span className="opacity-60 text-[10px]">{zona.columnas}×{zona.filas}</span>
          </span>
        </div>
      </div>
      {editing && <p className="text-xs text-primary text-center font-medium">Click en el preview para reposicionar</p>}
    </div>
  );
}

// ── Inline zone editor ─────────────────────────
function ExistingZoneEditor({ zona, salaId, onClose, onSaved }: { zona: ZonaDto; salaId: number; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ nombre: zona.nombre, columnas: zona.columnas, filas: zona.filas, posicionX: zona.posicionX, posicionY: zona.posicionY });

  const updateMutation = useMutation({
    mutationFn: (data: typeof form) => apiService.updateZona(zona.id, { ...data, salaId }),
    onSuccess: () => { toast({ title: "Zona Actualizada" }); onSaved(); onClose(); },
    onError: (e: any) => { toast({ variant: "destructive", title: "Error", description: e.message }); },
  });

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Editando Zona {zona.nombre}</h4>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} type="button"><X size={14} /></Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-xs text-muted-foreground mb-1 block">Columnas</label><Input type="number" min={1} max={20} value={form.columnas} onChange={(e) => setForm((p) => ({ ...p, columnas: Number(e.target.value) }))} className="h-8 text-sm" /></div>
        <div><label className="text-xs text-muted-foreground mb-1 block">Filas</label><Input type="number" min={1} max={20} value={form.filas} onChange={(e) => setForm((p) => ({ ...p, filas: Number(e.target.value) }))} className="h-8 text-sm" /></div>
        <div><label className="text-xs text-muted-foreground mb-1 block">Posición X</label><Input type="number" min={0} max={100} step={5} value={form.posicionX} onChange={(e) => setForm((p) => ({ ...p, posicionX: Number(e.target.value) }))} className="h-8 text-sm" /></div>
        <div><label className="text-xs text-muted-foreground mb-1 block">Posición Y</label><Input type="number" min={0} max={100} step={5} value={form.posicionY} onChange={(e) => setForm((p) => ({ ...p, posicionY: Number(e.target.value) }))} className="h-8 text-sm" /></div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" type="button" onClick={onClose}>Cancelar</Button>
        <Button size="sm" type="button" onClick={() => {
          const result = zonaItemSchema.safeParse(form);
          if (!result.success) {
            toast({ variant: "destructive", title: "Datos inválidos", description: result.error.errors.map(e => e.message).join(". ") });
            return;
          }
          updateMutation.mutate({ ...result.data, nombre: zona.nombre });
        }} disabled={updateMutation.isPending}>
          {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Guardar
        </Button>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────
interface FormularioSalaZonasProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sala: SalaDto;
}

export function FormularioSalaZonas({ open, onOpenChange, sala }: FormularioSalaZonasProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingZonaId, setEditingZonaId] = useState<number | null>(null);

  const zoneForm = useForm<ZonaArrayData>({ resolver: zodResolver(zonaArraySchema), defaultValues: { zonas: [] } });
  const { control: zoneControl, setValue: zoneSetValue } = zoneForm;
  const { fields: zoneFields, append: zoneAppend, remove: zoneRemove } = useFieldArray({ control: zoneControl, name: "zonas" });

  // US-23: Reset UI states when dialog opens or sala changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (open) {
      setShowCreateForm(false);
      setEditingZonaId(null);
      zoneForm.reset({ zonas: [] });
    }
  }, [open, sala.id]);

  const { data: zonas = [], isLoading } = useQuery<ZonaDto[]>({
    queryKey: ["zonas", "sala", sala.id],
    queryFn: () => apiService.getZonasBySala(sala.id),
    enabled: open,
  });

  const invalidateZonas = () => {
    queryClient.invalidateQueries({ queryKey: ["zonas", "sala", sala.id] });
    queryClient.invalidateQueries({ queryKey: ["salas"] });
  };

  const repositionMutation = useMutation({
    mutationFn: ({ id, posicionX, posicionY }: { id: number; posicionX: number; posicionY: number }) => {
      const zona = zonas.find((z) => z.id === id);
      if (!zona) return Promise.reject(new Error("Zona no encontrada"));
      return apiService.updateZona(id, { nombre: zona.nombre, posicionX, posicionY, columnas: zona.columnas, filas: zona.filas, salaId: sala.id });
    },
    onSuccess: invalidateZonas,
    onError: (e: any) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const batchCreateMutation = useMutation({
    mutationFn: (items: ZonaItemData[]) => apiService.createZonasBatch(sala.id, items),
    onSuccess: () => {
      toast({ title: "Zonas Creadas", description: "Las zonas fueron creadas correctamente." });
      invalidateZonas();
      setShowCreateForm(false);
      zoneForm.reset({ zonas: [] });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const editingZona = zonas.find((z) => z.id === editingZonaId) ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Zonas — {sala.nombre}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando zonas...
          </div>
        ) : (
          <div className="space-y-3">
            {zonas.length > 0 && (
              <div className="grid grid-cols-1 gap-3">
                {zonas.map((zona) => (
                  <div key={zona.id}>
                    {editingZonaId === zona.id ? (
                      <ExistingZoneEditor zona={zona} salaId={sala.id} onClose={() => setEditingZonaId(null)} onSaved={invalidateZonas} />
                    ) : (
                      <ExistingZonePreview zona={zona} onPositionChange={(id, x, y) => repositionMutation.mutate({ id, posicionX: x, posicionY: y })} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {zonas.length === 0 && !showCreateForm && (
              <p className="text-sm text-muted-foreground">No hay zonas configuradas.</p>
            )}

            {showCreateForm && (
              <div className="rounded-md border bg-muted/5 p-3 space-y-3">
                <p className="text-xs text-muted-foreground">Click en el preview para ubicar cada zona. La letra se asigna automáticamente.</p>
                <div className="space-y-4">
                  {zoneFields.map((field, index) => (
                    <ZoneItemEditor key={field.id} index={index + zonas.length} control={zoneControl} setValue={zoneSetValue} zonePath={`zonas.${index}`} onRemove={() => zoneRemove(index)} />
                  ))}
                </div>
                <div className="flex justify-between gap-2">
                  <Button variant="outline" size="sm" type="button" disabled={zoneFields.length >= 25} onClick={() => zoneAppend({ posicionX: 0, posicionY: 0, columnas: 3, filas: 3 })}>
                    <Plus className="w-4 h-4 mr-1" /> Agregar Zona
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" type="button" onClick={() => { setShowCreateForm(false); zoneForm.reset({ zonas: [] }); }}>
                      <X className="w-4 h-4 mr-1" /> Cancelar
                    </Button>
                    <Button size="sm" type="button" onClick={() => zoneForm.handleSubmit((data) => batchCreateMutation.mutate(data.zonas))()} disabled={batchCreateMutation.isPending || zoneFields.length === 0}>
                      {batchCreateMutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                      Crear {zoneFields.length > 0 ? `${zoneFields.length} Zona${zoneFields.length !== 1 ? "s" : ""}` : "Zona"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {!showCreateForm && (
              <Button variant="outline" size="sm" className="w-full" onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-1" /> Agregar Zona
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
