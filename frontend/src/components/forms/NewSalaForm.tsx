import { useState, useRef, useCallback } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, CheckCircle, ArrowLeft, Loader2, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import type { Control, UseFormSetValue } from "react-hook-form";

// ─── Zone grid schema ────────────────────────────────────────
const zoneSchema = z.object({
  posicionX: z.coerce.number().min(0).max(100).refine(val => val % 5 === 0, "Debe ser múltiplo de 5").default(0),
  posicionY: z.coerce.number().min(0).max(100).refine(val => val % 5 === 0, "Debe ser múltiplo de 5").default(0),
  columnas: z.coerce.number().min(1, "Mínimo 1").max(20, "Máximo 20"),
  filas: z.coerce.number().min(1, "Mínimo 1").max(20, "Máximo 20"),
});

const newSalaConZonasSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  zonas: z.array(zoneSchema).max(25, "Máximo 25 zonas").optional().default([]),
});

type NewSalaConZonasData = z.infer<typeof newSalaConZonasSchema>;

interface NewSalaFormProps {
  onBack: () => void;
  onClose: () => void;
}

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
function getZoneLetter(index: number): string {
  // A=0, B=1, ... Z=25, AA=26, AB=27, etc.
  if (index < 26) return String.fromCharCode(65 + index);
  const first = Math.floor(index / 26) - 1;
  const second = index % 26;
  return String.fromCharCode(65 + first) + String.fromCharCode(65 + second);
}

// ─── Zone Item — manages its own drag state ───────────────────
function ZoneItem({
  index,
  control,
  setValue,
  onRemove,
}: {
  index: number;
  control: Control<NewSalaConZonasData>;
  setValue: UseFormSetValue<NewSalaConZonasData>;
  onRemove: () => void;
}) {
  // Read form values for this zone reactively
  const zone = useWatch({ control, name: `zonas.${index}` });

  // ─── Preview ref + click-to-place ────────────────────────
  const containerRef = useRef<HTMLDivElement | null>(null);

  if (!zone) return null;

  const color = ZONE_COLORS[index % ZONE_COLORS.length];

  // Proportional sizing: columns→width, rows→height
  const cellPct = 5;
  const zoneW = Math.max(10, (zone.columnas || 1) * cellPct);
  const zoneH = Math.max(10, (zone.filas || 1) * cellPct);

  // Click on preview → place zone centered at that position (snapped to multiples of 5)
  const handlePreviewClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;
    const snapTo5 = (val: number) => Math.round(val / 5) * 5;
    // Center the zone on the click point, snapped to grid
    const newX = snapTo5(Math.max(0, Math.min(100 - zoneW, clickX - zoneW / 2)));
    const newY = snapTo5(Math.max(0, Math.min(100 - zoneH, clickY - zoneH / 2)));
    setValue(`zonas.${index}.posicionX`, newX);
    setValue(`zonas.${index}.posicionY`, newY);
  };

  return (
    <div className="border border-border rounded-lg p-3 space-y-3">
      {/* Row 1: letter + columns + rows ABOVE preview */}
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium mr-1 shrink-0">
          Zona {getZoneLetter(index)}
        </span>
        <div className="flex-1 grid grid-cols-2 gap-2">
          <FormField
            control={control}
            name={`zonas.${index}.columnas`}
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
            name={`zonas.${index}.filas`}
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

      {/* Preview — SQUARE container, click to position zone */}
      <div
        ref={containerRef}
        className="relative w-full aspect-square bg-muted/40 border-2 border-dashed border-muted-foreground/30 rounded-lg overflow-hidden cursor-crosshair"
        onClick={handlePreviewClick}
      >
        {/* Grid overlay */}
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
        {/* Zone box */}
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

      {/* Row 2: auto-calculated position BELOW preview with less contrast */}
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

// ─── Main Component ───────────────────────────────────────────
export const NewSalaForm = ({ onBack, onClose }: NewSalaFormProps) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCreatingZonas, setIsCreatingZonas] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<NewSalaConZonasData>({
    resolver: zodResolver(newSalaConZonasSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      zonas: [],
    },
  });

  const { control, setValue, getValues } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "zonas",
  });

  // Watch zonas for count display
  const zonas = useWatch({ control, name: "zonas" });

  // ─── Mutation: create sala ─────────────────────────────────
  const createSalaMutation = useMutation({
    mutationFn: (data: { nombre: string; descripcion?: string }) =>
      apiService.createSala(data),
    onSuccess: async (sala) => {
      const zonasData = getValues("zonas");
      if (zonasData && zonasData.length > 0) {
        setIsCreatingZonas(true);
        try {
          await apiService.createZonasBatch(sala.id, zonasData);
        } catch (error: any) {
          toast({
            variant: "destructive",
            title: "Error al crear zonas",
            description: error.message || "La sala se creó pero las zonas fallaron. Podés agregarlas desde la sala.",
          });
        } finally {
          setIsCreatingZonas(false);
        }
      }
      finishSuccess(sala.nombre);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error al crear la sala",
        description: error.message || "Ocurrió un error inesperado.",
      });
    },
  });

  const finishSuccess = (nombre: string) => {
    toast({
      title: "¡Sala Creada!",
      description: `La sala '${nombre}' ha sido registrada.`,
    });
    setIsSubmitted(true);
    queryClient.invalidateQueries({ queryKey: ["salas"] });
  };

  const isLoading = createSalaMutation.isPending || isCreatingZonas;

  const onSubmit = (data: NewSalaConZonasData) => {
    createSalaMutation.mutate({
      nombre: data.nombre,
      descripcion: data.descripcion || undefined,
    });
  };

  const handleReset = () => {
    form.reset();
    setIsSubmitted(false);
  };

  // ─── Submitted view ─────────────────────────────────────────
  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-foreground">¡Sala Creada!</h3>
          <p className="text-muted-foreground">
            {zonas && zonas.length > 0
              ? `Tu sala con ${zonas.length} zona${zonas.length !== 1 ? "s" : ""} está lista.`
              : "Tu nuevo espacio de cultivo está listo."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <Button onClick={handleReset} variant="outline" className="flex-1">
            <Plus className="mr-2 h-4 w-4" />
            Crear Otra
          </Button>
          <Button onClick={onClose} className="flex-1">
            Volver
          </Button>
        </div>
      </div>
    );
  }

  // ─── Form ───────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h3 className="text-xl font-bold text-foreground">Nueva Sala</h3>
          <p className="text-sm text-muted-foreground">Define un nuevo espacio de cultivo con sus zonas</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Nombre */}
          <FormField
            control={control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de la Sala</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Descripción */}
          <FormField
            control={control}
            name="descripcion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea className="resize-none h-20" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Zonas section ────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <FormLabel className="text-base font-semibold">Zonas</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={fields.length >= 25}
                onClick={() =>
                  append({ posicionX: 0, posicionY: 0, columnas: 3, filas: 3 })
                }
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Agregar Zona
              </Button>
            </div>

            {fields.length === 0 && (
              <p className="text-xs text-muted-foreground py-2">
                Sin zonas — podés agregarlas después desde la sala.
              </p>
            )}

            {/* Zone list — each item manages its own drag state */}
            <div className="space-y-4">
              {fields.map((field, index) => (
                <ZoneItem
                  key={field.id}
                  index={index}
                  control={control}
                  setValue={setValue}
                  onRemove={() => remove(index)}
                />
              ))}
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-5 w-5" />
            )}
            {isCreatingZonas
              ? "Creando zonas..."
              : zonas && zonas.length > 0
              ? `Crear Sala con ${zonas.length} Zona${zonas.length !== 1 ? "s" : ""}`
              : "Crear Sala"}
          </Button>
        </form>
      </Form>
    </div>
  );
};
