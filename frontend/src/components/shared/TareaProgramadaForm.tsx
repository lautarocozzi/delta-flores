import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarDays, X, Save, Loader2, Users, User } from 'lucide-react';
import { apiService } from '@/services/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { ColaboradorInfoDto } from '@/schemas/DTOSchemas';

const TareaFormSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido'),
  descripcion: z.string().optional().default(''),
  recurrencia: z.enum(['NINGUNA', 'DIARIA', 'SEMANAL', 'MENSUAL']),
  fechaProgramada: z.string().min(1, 'La fecha es requerida'),
});

type TareaFormData = z.infer<typeof TareaFormSchema>;

interface TareaProgramadaFormProps {
  onClose: () => void;
  salaId?: number | null;
  plantaId?: number | null;
}

export default function TareaProgramadaForm({ onClose, salaId, plantaId }: TareaProgramadaFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSalaId, setSelectedSalaId] = useState<number | null>(salaId ?? null);
  const [selectedColaboradorId, setSelectedColaboradorId] = useState<number | null>(null);

  // Fetch collaborators
  const { data: colaboradores = [] } = useQuery({
    queryKey: ['misColaboradores'],
    queryFn: () => apiService.getMisColaboradores(),
  });

  // Group collaborators by sala
  const salasConColaboradores = useMemo(() => {
    const map = new Map<number, { salaNombre: string; colaboradores: ColaboradorInfoDto[] }>();
    for (const col of colaboradores) {
      if (!map.has(col.salaId)) {
        map.set(col.salaId, { salaNombre: col.salaNombre, colaboradores: [] });
      }
      map.get(col.salaId)!.colaboradores.push(col);
    }
    return Array.from(map.entries());
  }, [colaboradores]);

  // Filter collaborators by selected sala
  const filteredColaboradores = useMemo(() => {
    if (!selectedSalaId) return [];
    return colaboradores.filter(c => c.salaId === selectedSalaId);
  }, [colaboradores, selectedSalaId]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TareaFormData>({
    resolver: zodResolver(TareaFormSchema),
    defaultValues: {
      titulo: '',
      descripcion: '',
      recurrencia: 'SEMANAL',
      fechaProgramada: new Date().toISOString().slice(0, 16),
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: TareaFormData) =>
      apiService.createTarea({
        ...data,
        salaAsociadaId: selectedSalaId ?? salaId ?? null,
        plantaAsociadaId: plantaId ?? null,
        colaboradorAsignadoId: selectedColaboradorId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tareas'] });
      toast({ title: 'Tarea programada creada' });
      onClose();
    },
    onError: () => toast({ variant: 'destructive', title: 'Error al crear la tarea' }),
    onSettled: () => setIsSubmitting(false),
  });

  const onSubmit = (data: TareaFormData) => {
    setIsSubmitting(true);
    createMutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-background-surface rounded-xl border border-accent-green/30 shadow-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-text-primary font-semibold text-lg">
            <CalendarDays className="w-5 h-5 text-accent-green" />
            Nueva Tarea Programada
          </div>
          <button onClick={onClose} className="p-1 hover:bg-accent-green/10 rounded-lg">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Título */}
          <div>
            <label className="block text-xs text-text-secondary mb-1">Título *</label>
            <input
              {...register('titulo')}
              className="w-full bg-background-base border border-accent-green/20 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-green/60"
              placeholder="Ej: Regar plantas de la Sala"
            />
            {errors.titulo && <span className="text-red-400 text-xs mt-1">{errors.titulo.message}</span>}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs text-text-secondary mb-1">Descripción</label>
            <textarea
              {...register('descripcion')}
              rows={2}
              className="w-full bg-background-base border border-accent-green/20 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-green/60"
              placeholder="Detalles de la tarea..."
            />
          </div>

          {/* Recurrencia + Fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Recurrencia</label>
              <select
                {...register('recurrencia')}
                className="w-full bg-background-base border border-accent-green/20 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-green/60"
              >
                <option value="NINGUNA">Una vez</option>
                <option value="DIARIA">Diaria</option>
                <option value="SEMANAL">Semanal</option>
                <option value="MENSUAL">Mensual</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-text-secondary mb-1">Fecha y hora *</label>
              <input
                {...register('fechaProgramada')}
                type="datetime-local"
                className="w-full bg-background-base border border-accent-green/20 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-green/60"
              />
              {errors.fechaProgramada && <span className="text-red-400 text-xs mt-1">{errors.fechaProgramada.message}</span>}
            </div>
          </div>

          {/* Asignar a Colaborador */}
          {salasConColaboradores.length > 0 && (
            <div className="border border-accent-green/20 rounded-lg p-3 space-y-3">
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <Users className="w-4 h-4" />
                Asignar a colaborador (opcional)
              </div>

              {/* Sala selector */}
              <div>
                <label className="block text-xs text-text-secondary mb-1">Sala</label>
                <select
                  value={selectedSalaId?.toString() ?? ''}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    setSelectedSalaId(val);
                    setSelectedColaboradorId(null);
                  }}
                  className="w-full bg-background-base border border-accent-green/20 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-green/60"
                >
                  <option value="">Sin sala (para mí)</option>
                  {salasConColaboradores.map(([id, { salaNombre }]) => (
                    <option key={id} value={id}>{salaNombre}</option>
                  ))}
                </select>
              </div>

              {/* Colaborador selector */}
              {selectedSalaId && filteredColaboradores.length > 0 && (
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Colaborador</label>
                  <select
                    value={selectedColaboradorId?.toString() ?? ''}
                    onChange={(e) => setSelectedColaboradorId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-background-base border border-accent-green/20 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-green/60"
                  >
                    <option value="">Para mí (creador)</option>
                    {filteredColaboradores.map((col) => (
                      <option key={col.userId} value={col.userId}>
                        {col.userNombre && col.userApellido
                          ? `${col.userNombre} ${col.userApellido} (${col.userUsername})`
                          : col.userUsername}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedSalaId && filteredColaboradores.length === 0 && (
                <p className="text-xs text-text-secondary italic">
                  Esta sala no tiene colaboradores asignados
                </p>
              )}
            </div>
          )}

          {/* Sala/Planta info */}
          {(salaId || plantaId) && (
            <div className="bg-accent-green/5 border border-accent-green/20 rounded-lg px-3 py-2 text-xs text-text-secondary">
              {salaId && <div>Sala asociada: sí</div>}
              {plantaId && <div>Planta asociada: sí</div>}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-background-base border border-accent-green/20 rounded-lg text-sm text-text-secondary hover:bg-accent-green/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-accent-green/20 border border-accent-green/40 rounded-lg text-sm text-accent-green hover:bg-accent-green/30 transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar tarea
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
