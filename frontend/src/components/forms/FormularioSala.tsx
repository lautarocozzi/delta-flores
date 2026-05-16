import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { SalaDto, PlantaDto, ZonaDto } from '@/interfaces/Planta';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Home, Sun, MapPin, Thermometer, Grid3x3, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ── Módulos reutilizables ──────────────────────
import { sanitizedString, optionalSanitizedString, numericString, tipoAmbienteSchema } from '@/modules/sanitization';
import { FormInputField, FormSelectField, type SelectOption } from '@/modules/forms';
import { FormSection } from '@/modules/forms';

// ── Shared components ──────────────────────────
import { UnifiedSalaView } from '@/components/sala/UnifiedSalaView';
import { ZonaGridModal } from '@/components/sala/ZonaGridModal';

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

// ── Create zone form (simplified — no nombre) ──
interface CreateZonaForm {
  columnas: number;
  filas: number;
  posicionX: number;
  posicionY: number;
}

const EMPTY_CREATE_FORM: CreateZonaForm = {
  columnas: 4,
  filas: 4,
  posicionX: 0,
  posicionY: 0,
};

// ── ZonaSection subcomponent ─────────────────
const ZonaSection = ({ salaId }: { salaId: number }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedZonaId, setSelectedZonaId] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState<CreateZonaForm>(EMPTY_CREATE_FORM);
  const [editingZona, setEditingZona] = useState<ZonaDto | null>(null);
  const [editForm, setEditForm] = useState({ nombre: '', columnas: 4, filas: 4, posicionX: 0, posicionY: 0 });

  // Fetch zonas
  const { data: zonas = [], isLoading } = useQuery<ZonaDto[]>({
    queryKey: ['zonas', 'sala', salaId],
    queryFn: () => apiService.getZonasBySala(salaId),
  });

  // Fetch plantas for this sala
  const { data: plantasBySala = [] } = useQuery<PlantaDto[]>({
    queryKey: ['plantas', 'sala', salaId],
    queryFn: () => apiService.getPlantasBySala(salaId),
  });

  const invalidateZonas = () => {
    queryClient.invalidateQueries({ queryKey: ['zonas', 'sala', salaId] });
    queryClient.invalidateQueries({ queryKey: ['salas'] });
  };

  // Create zona
  const createMutation = useMutation({
    mutationFn: (data: CreateZonaForm) =>
      apiService.createZona({ ...data, nombre: '', salaId }),
    onSuccess: () => {
      toast({ title: 'Zona Creada', description: 'La zona fue creada correctamente.' });
      invalidateZonas();
      setShowCreateForm(false);
      setCreateForm(EMPTY_CREATE_FORM);
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'No se pudo crear la zona.' });
    },
  });

  // Update zona
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ZonaDto> }) => apiService.updateZona(id, data),
    onSuccess: () => {
      toast({ title: 'Zona Actualizada' });
      invalidateZonas();
      setEditingZona(null);
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'No se pudo actualizar la zona.' });
    },
  });

  // Delete zona
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteZona(id),
    onSuccess: () => {
      toast({ title: 'Zona Eliminada' });
      invalidateZonas();
      if (editingZona) setEditingZona(null);
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'No se pudo eliminar la zona.' });
    },
  });

  // Selected zona for modal
  const selectedZona = zonas.find((z) => z.id === selectedZonaId) ?? null;
  const selectedZonaPlantas = plantasBySala.filter((p) => p.zonaId === selectedZonaId);

  // Edit handlers
  const handleEditZona = (zona: ZonaDto) => {
    setEditingZona(zona);
    setEditForm({ nombre: zona.nombre, columnas: zona.columnas, filas: zona.filas, posicionX: zona.posicionX, posicionY: zona.posicionY });
  };

  const handleDeleteZona = (zona: ZonaDto) => {
    if (confirm(`¿Eliminar Zona ${zona.nombre}? Las plantas serán desasociadas.`)) {
      deleteMutation.mutate(zona.id);
    }
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
          {/* Map view */}
          {zonas.length > 0 ? (
            <UnifiedSalaView
              zonas={zonas}
              plantasBySala={plantasBySala}
              onZonaClick={setSelectedZonaId}
              onEditZona={handleEditZona}
              onDeleteZona={handleDeleteZona}
            />
          ) : !showCreateForm ? (
            <p className="text-sm text-muted-foreground mb-4">No hay zonas configuradas.</p>
          ) : null}

          {/* Create form (collapsible) */}
          {showCreateForm && (
            <div className="rounded-md border bg-muted/5 p-3 space-y-3 mt-3">
              <p className="text-xs text-muted-foreground">
                La letra se asignará automáticamente (A, B, C...)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Columnas</label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={createForm.columnas}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, columnas: Number(e.target.value) }))
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Filas</label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={createForm.filas}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, filas: Number(e.target.value) }))
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Posición X</label>
                  <Input
                    type="number"
                    min={0}
                    value={createForm.posicionX}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, posicionX: Number(e.target.value) }))
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Posición Y</label>
                  <Input
                    type="number"
                    min={0}
                    value={createForm.posicionY}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, posicionY: Number(e.target.value) }))
                    }
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCreateForm(false);
                    setCreateForm(EMPTY_CREATE_FORM);
                  }}
                >
                  <X className="w-4 h-4 mr-1" /> Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => createMutation.mutate(createForm)}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : null}
                  Crear Zona
                </Button>
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

          {/* Edit form overlay */}
          {editingZona && (
            <div className="mt-3 rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Editando Zona {editingZona.nombre}</h4>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingZona(null)}>
                  <X size={14} />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Nombre</label>
                  <Input type="text" value={editForm.nombre} onChange={e => setEditForm(prev => ({ ...prev, nombre: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Posición (X, Y)</label>
                  <div className="flex gap-1">
                    <Input type="number" min={0} value={editForm.posicionX} onChange={e => setEditForm(prev => ({ ...prev, posicionX: Number(e.target.value) }))} className="h-8 text-sm" />
                    <Input type="number" min={0} value={editForm.posicionY} onChange={e => setEditForm(prev => ({ ...prev, posicionY: Number(e.target.value) }))} className="h-8 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Columnas</label>
                  <Input type="number" min={1} max={20} value={editForm.columnas} onChange={e => setEditForm(prev => ({ ...prev, columnas: Number(e.target.value) }))} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Filas</label>
                  <Input type="number" min={1} max={20} value={editForm.filas} onChange={e => setEditForm(prev => ({ ...prev, filas: Number(e.target.value) }))} className="h-8 text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditingZona(null)}>Cancelar</Button>
                <Button size="sm" onClick={() => updateMutation.mutate({ id: editingZona!.id, data: { ...editForm, salaId } })} disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  Guardar
                </Button>
              </div>
            </div>
          )}

          {/* ZonaGridModal for selected zona */}
      {selectedZona && (
        <ZonaGridModal
          zona={selectedZona}
          plantas={selectedZonaPlantas}
          open={selectedZonaId !== null}
          onClose={() => setSelectedZonaId(null)}
          salaId={salaId}
        />
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
