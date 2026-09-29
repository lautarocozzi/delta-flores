import { useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { SalaDto, ZonaDto } from '@/interfaces/Planta';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Home, Sun, MapPin, Thermometer, Grid3x3, Plus, X, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ── Módulos reutilizables ──────────────────────
import { sanitizedString, optionalSanitizedString, numericString, tipoAmbienteSchema } from '@/modules/sanitization';
import { FormInputField, FormSelectField, type SelectOption } from '@/modules/forms';
import { FormSection } from '@/modules/forms';

// ── Shared components ──────────────────────────
import { ZoneItemEditor, getZoneLetter } from '@/components/sala/ZoneItemEditor';

// ── Schema del formulario con sanitización ─────
const salaFormSchema = z.object({
  nombre: sanitizedString({ min: 1, max: 100, capitalize: true }),
  descripcion: optionalSanitizedString({ max: 500 }),
  tipoAmbiente: tipoAmbienteSchema,
  horasLuz: z
    .string()
    .optional()
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
  humedad: numericString({ label: 'Humedad', nullable: true, min: 0, max: 100 }),
  temperaturaAmbiente: numericString({
    label: 'Temperatura',
    nullable: true,
    min: -10,
    max: 60,
  }),
  imagenUrl: z
    .string()
    .url('URL inválida')
    .nullable()
    .optional()
    .or(z.literal('')),
});

type SalaFormData = z.infer<typeof salaFormSchema>;

// ── Opciones para selects ──────────────────────
const TIPO_AMBIENTE_OPTIONS: SelectOption[] = [
  { value: 'INTERIOR', label: 'Interior', icon: Home, iconColor: 'text-blue-400' },
  { value: 'EXTERIOR', label: 'Exterior', icon: Sun, iconColor: 'text-orange-400' },
];

// ── Helpers ────────────────────────────────────
const toSalaPayload = (data: SalaFormData) => ({
  nombre: data.nombre,
  descripcion: data.descripcion ?? null,
  horasLuz: data.horasLuz ?? null,
  humedad: data.humedad ?? null,
  temperaturaAmbiente: data.temperaturaAmbiente ?? null,
  tipoAmbiente: data.tipoAmbiente ?? null,
  imagenUrl: data.imagenUrl || null,
});

// ── Props ──────────────────────────────────────
interface FormularioSalaProps {
  mode: 'create' | 'edit';
  initialData?: SalaDto;
  onSuccess: () => void;
}

// ── Zona form schema (for useFieldArray) ─────
const zonaItemSchema = z.object({
  posicionX: z.coerce.number().min(0).max(100).refine(val => val % 5 === 0, "Debe ser múltiplo de 5").default(0),
  posicionY: z.coerce.number().min(0).max(100).refine(val => val % 5 === 0, "Debe ser múltiplo de 5").default(0),
  columnas: z.coerce.number().min(1).max(20),
  filas: z.coerce.number().min(1).max(20),
});
type ZonaItemData = z.infer<typeof zonaItemSchema>;

const zonaArraySchema = z.object({
  zonas: z.array(zonaItemSchema),
});
type ZonaArrayData = z.infer<typeof zonaArraySchema>;

// ── Zone colors for existing zones ────────────────────────────
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
    const letterIndex = code - 65;
    if (letterIndex >= 0 && letterIndex < 26) return letterIndex % ZONE_COLORS.length;
  }
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % ZONE_COLORS.length;
}

// ── ExistingZonePreview — preview with toggle click-to-position ──
const ExistingZonePreview = ({
  zona,
  index,
  onPositionChange,
}: {
  zona: ZonaDto;
  index: number;
  onPositionChange: (id: number, posicionX: number, posicionY: number) => void;
}) => {
  const color = ZONE_COLORS[getZoneColorIndex(zona.nombre)];
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [editingPosition, setEditingPosition] = useState(false);
  const cellPct = 5;
  const zoneW = Math.max(10, (zona.columnas || 1) * cellPct);
  const zoneH = Math.max(10, (zona.filas || 1) * cellPct);

  const handlePreviewClick = (e: React.MouseEvent) => {
    if (!editingPosition || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;
    const snapTo5 = (val: number) => Math.round(val / 5) * 5;
    const newX = snapTo5(Math.max(0, Math.min(100 - zoneW, clickX - zoneW / 2)));
    const newY = snapTo5(Math.max(0, Math.min(100 - zoneH, clickY - zoneH / 2)));
    onPositionChange(zona.id, newX, newY);
    setEditingPosition(false);
  };

  return (
    <div className="border border-border rounded-lg p-3 space-y-3">
      {/* Zone label + Editar Posición */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            Zona {zona.nombre} ({zona.columnas}×{zona.filas})
          </span>
          <Button
            variant={editingPosition ? 'default' : 'ghost'}
            size="sm"
            type="button"
            className="h-6 text-xs"
            onClick={() => setEditingPosition(prev => !prev)}
          >
            <MapPin className="w-3 h-3 mr-1" />
            {editingPosition ? 'Listo' : 'Editar Posición'}
          </Button>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
          <span>X: {zona.posicionX}%</span>
          <span>Y: {zona.posicionY}%</span>
        </div>
      </div>

      {/* Preview */}
      <div
        ref={containerRef}
        className={`relative w-full aspect-square bg-muted/40 border-2 border-dashed rounded-lg overflow-hidden transition-colors ${
          editingPosition
            ? 'border-primary cursor-crosshair'
            : 'border-muted-foreground/30'
        }`}
        onClick={handlePreviewClick}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: `${100 / Math.max(zona.columnas, 1)}% ${100 / Math.max(zona.filas, 1)}%`,
          }}
        />
        <div
          className={`absolute rounded-md border-2 ${color.bg} ${color.border} ${color.text} flex items-center justify-center text-xs font-medium overflow-hidden pointer-events-none transition-all duration-100`}
          style={{
            left: `${zona.posicionX}%`,
            top: `${zona.posicionY}%`,
            width: `${zoneW}%`,
            height: `${zoneH}%`,
          }}
        >
          <span className="truncate text-center leading-tight px-0.5">
            {zona.nombre}
            <br />
            <span className="opacity-60 text-[10px]">
              {zona.columnas}×{zona.filas}
            </span>
          </span>
        </div>
      </div>

      {editingPosition && (
        <p className="text-xs text-primary text-center font-medium">
          Click en el preview para reposicionar
        </p>
      )}
    </div>
  );
};

// ── ExistingZoneEditor — inline editor for a saved zone ───────
const ExistingZoneEditor = ({
  zona,
  onClose,
  salaId,
  onSaved,
}: {
  zona: ZonaDto;
  onClose: () => void;
  salaId: number;
  onSaved: () => void;
}) => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    nombre: zona.nombre,
    columnas: zona.columnas,
    filas: zona.filas,
    posicionX: zona.posicionX,
    posicionY: zona.posicionY,
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof form) => apiService.updateZona(zona.id, { ...data, salaId }),
    onSuccess: () => {
      toast({ title: 'Zona Actualizada' });
      onSaved();
      onClose();
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'No se pudo actualizar la zona.' });
    },
  });

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Editando Zona {zona.nombre}</h4>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} type="button">
          <X size={14} />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Columnas</label>
          <Input type="number" min={1} max={20} value={form.columnas} onChange={e => setForm(prev => ({ ...prev, columnas: Number(e.target.value) }))} className="h-8 text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Filas</label>
          <Input type="number" min={1} max={20} value={form.filas} onChange={e => setForm(prev => ({ ...prev, filas: Number(e.target.value) }))} className="h-8 text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Posición X</label>
          <Input type="number" min={0} max={100} step={5} value={form.posicionX} onChange={e => setForm(prev => ({ ...prev, posicionX: Number(e.target.value) }))} className="h-8 text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Posición Y</label>
          <Input type="number" min={0} max={100} step={5} value={form.posicionY} onChange={e => setForm(prev => ({ ...prev, posicionY: Number(e.target.value) }))} className="h-8 text-sm" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" type="button" onClick={onClose}>Cancelar</Button>
        <Button size="sm" type="button" onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}>
          {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
          Guardar
        </Button>
      </div>
    </div>
  );
};

// ── ZonaSection subcomponent ─────────────────
const ZonaSection = ({ salaId }: { salaId: number }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingZonaId, setEditingZonaId] = useState<number | null>(null);

  // useFieldArray for batch zone creation
  const zoneForm = useForm<ZonaArrayData>({
    resolver: zodResolver(zonaArraySchema),
    defaultValues: { zonas: [] },
  });
  const { control: zoneControl, setValue: zoneSetValue, getValues: zoneGetValues } = zoneForm;
  const { fields: zoneFields, append: zoneAppend, remove: zoneRemove } = useFieldArray({
    control: zoneControl,
    name: "zonas",
  });

  // Fetch zonas
  const { data: zonas = [], isLoading } = useQuery<ZonaDto[]>({
    queryKey: ['zonas', 'sala', salaId],
    queryFn: () => apiService.getZonasBySala(salaId),
  });

  const invalidateZonas = () => {
    queryClient.invalidateQueries({ queryKey: ['zonas', 'sala', salaId] });
    queryClient.invalidateQueries({ queryKey: ['salas'] });
  };

  // Reposition zona (click-to-position on existing preview)
  const repositionMutation = useMutation({
    mutationFn: ({ id, posicionX, posicionY }: { id: number; posicionX: number; posicionY: number }) => {
      const zona = zonas.find(z => z.id === id);
      return apiService.updateZona(id, { nombre: zona?.nombre, posicionX, posicionY, columnas: zona?.columnas ?? 1, filas: zona?.filas ?? 1, salaId });
    },
    onSuccess: () => {
      invalidateZonas();
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'No se pudo reposicionar la zona.' });
    },
  });

  // Batch create zonas
  const batchCreateMutation = useMutation({
    mutationFn: (items: ZonaItemData[]) => apiService.createZonasBatch(salaId, items),
    onSuccess: () => {
      toast({ title: 'Zonas Creadas', description: 'Las zonas fueron creadas correctamente.' });
      invalidateZonas();
      setShowCreateForm(false);
      zoneForm.reset({ zonas: [] });
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'No se pudieron crear las zonas.' });
    },
  });

  // Delete zona
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteZona(id),
    onSuccess: () => {
      toast({ title: 'Zona Eliminada' });
      invalidateZonas();
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'No se pudo eliminar la zona.' });
    },
  });

  // Zone being edited inline
  const editingZona = zonas.find((z) => z.id === editingZonaId) ?? null;

  const handleDeleteZona = (zona: ZonaDto) => {
    if (confirm(`¿Eliminar Zona ${zona.nombre}? Las plantas serán desasociadas.`)) {
      deleteMutation.mutate(zona.id);
    }
  };

  // Handle batch create from zone form
  const handleBatchCreate = () => {
    const items = zoneGetValues("zonas");
    if (!items || items.length === 0) return;
    batchCreateMutation.mutate(items);
  };

  return (
    <FormSection icon={Grid3x3} title="Zonas">
      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando zonas...
        </div>
      ) : (
        <>
          {/* Existing zones — individual previews */}
          {zonas.length > 0 && (
            <div className="grid grid-cols-1 gap-3">
              {zonas.map((zona, i) => (
                <div key={zona.id}>
                  {editingZonaId === zona.id ? (
                    <ExistingZoneEditor
                      zona={zona}
                      salaId={salaId}
                      onClose={() => setEditingZonaId(null)}
                      onSaved={invalidateZonas}
                    />
                  ) : (
                    <ExistingZonePreview
                      zona={zona}
                      index={i}
                      onPositionChange={(id, posicionX, posicionY) =>
                        repositionMutation.mutate({ id, posicionX, posicionY })
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {zonas.length === 0 && !showCreateForm && (
            <p className="text-sm text-muted-foreground mb-4">No hay zonas configuradas.</p>
          )}

          {/* Create form (drag-and-drop grid) */}
          {showCreateForm && (
            <div className="rounded-md border bg-muted/5 p-3 space-y-3 mt-3">
              <p className="text-xs text-muted-foreground">
                Click en el preview para ubicar cada zona. La letra se asigna automáticamente.
              </p>

              {/* Zone list */}
              <div className="space-y-4">
                {zoneFields.map((field, index) => (
                  <ZoneItemEditor
                    key={field.id}
                    index={index + zonas.length}
                    control={zoneControl}
                    setValue={zoneSetValue}
                    zonePath={`zonas.${index}`}
                    onRemove={() => zoneRemove(index)}
                  />
                ))}
              </div>

              <div className="flex justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  disabled={zoneFields.length >= 25}
                  onClick={() => zoneAppend({ posicionX: 0, posicionY: 0, columnas: 3, filas: 3 })}
                >
                  <Plus className="w-4 h-4 mr-1" /> Agregar Zona
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      zoneForm.reset({ zonas: [] });
                    }}
                  >
                    <X className="w-4 h-4 mr-1" /> Cancelar
                  </Button>
                  <Button
                    size="sm"
                    type="button"
                    onClick={handleBatchCreate}
                    disabled={batchCreateMutation.isPending || zoneFields.length === 0}
                  >
                    {batchCreateMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : null}
                    Crear {zoneFields.length > 0 ? `${zoneFields.length} Zona${zoneFields.length !== 1 ? 's' : ''}` : 'Zona'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Add zone button */}
          {!showCreateForm && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="w-4 h-4 mr-1" /> Agregar Zona
            </Button>
          )}
        </>
      )}
    </FormSection>
  );
};

// ── Componente ─────────────────────────────────
export const FormularioSala = ({ mode, initialData, onSuccess }: FormularioSalaProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SalaFormData>({
    resolver: zodResolver(salaFormSchema),
    defaultValues: {
      nombre: initialData?.nombre ?? '',
      descripcion: initialData?.descripcion ?? '',
      tipoAmbiente: initialData?.tipoAmbiente ?? undefined,
      horasLuz: initialData?.horasLuz ?? '',
      humedad: initialData?.humedad?.toString() ?? '',
      temperaturaAmbiente: initialData?.temperaturaAmbiente?.toString() ?? '',
      imagenUrl: initialData?.imagenUrl ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: SalaFormData) => {
      const payload = toSalaPayload(data);
      return mode === 'create'
        ? apiService.createSala(payload)
        : apiService.updateSala(initialData!.id, payload);
    },
    onSuccess: () => {
      toast({
        title: mode === 'create' ? 'Sala Creada' : 'Sala Actualizada',
        description: `La sala ha sido ${mode === 'create' ? 'creada' : 'actualizada'} correctamente.`,
      });
      queryClient.invalidateQueries({ queryKey: ['salas'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Ocurrió un error inesperado.',
      });
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
        className="space-y-6"
      >
        {/* ── Información General ── */}
        <FormSection icon={MapPin} title="Información General">
          <FormInputField
            control={form.control}
            name="nombre"
            label="Nombre"
            placeholder="Ej: Sala de Vegetativo"
            required
          />

          <FormInputField
            control={form.control}
            name="descripcion"
            label="Descripción"
            placeholder="Ej: Sala principal de crecimiento"
            optional
          />

          <FormSelectField
            control={form.control}
            name="tipoAmbiente"
            label="Tipo de Ambiente"
            options={TIPO_AMBIENTE_OPTIONS}
            placeholder="Selecciona el tipo..."
          />

          <FormInputField
            control={form.control}
            name="imagenUrl"
            label="URL de Imagen"
            placeholder="https://ejemplo.com/imagen.jpg"
            optional
          />
        </FormSection>

        {/* ── Condiciones de Cultivo ── */}
        <FormSection icon={Thermometer} title="Condiciones de Cultivo">
          <FormInputField
            control={form.control}
            name="horasLuz"
            label="Horas de Luz"
            placeholder="Ej: 18/6"
            description="Formato: horas luz / horas oscuridad"
            optional
          />

          <div className="grid grid-cols-2 gap-4">
            <FormInputField
              control={form.control}
              name="humedad"
              label="Humedad (%)"
              type="number"
              placeholder="Ej: 65"
              optional
            />

            <FormInputField
              control={form.control}
              name="temperaturaAmbiente"
              label="Temperatura (°C)"
              type="number"
              placeholder="Ej: 24"
              optional
            />
          </div>
        </FormSection>

        {/* ── Zonas (solo en modo edición) ── */}
        {mode === 'edit' && initialData && <ZonaSection salaId={initialData.id} />}

        {/* ── Acciones ── */}
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending && (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          )}
          {mode === 'create' ? 'Crear Sala' : 'Guardar Cambios'}
        </Button>
      </form>
    </Form>
  );
};
