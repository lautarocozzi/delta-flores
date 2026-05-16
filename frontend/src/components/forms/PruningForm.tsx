import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Scissors, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { PlantaDto } from "@/interfaces/Planta";
import { useToast } from "@/hooks/use-toast";

// Tipos para el evento de backend
interface BackendEvent {
  id: number;
  eventType: string;
  fecha: string;
  plantaIds: number[];
  tipoPoda?: string; // Para PruningEvent
}

const pruningSchema = z.object({
  planta_id: z.string().optional(),
  tipo_poda: z.enum(["APICAL", "FIM", "LST"], {
    required_error: "El tipo de poda es requerido",
  }),
});

type PruningFormData = z.infer<typeof pruningSchema>;

interface PruningFormProps {
  onBack: () => void;
  onClose: () => void;
  plantaId?: string;
  eventToEdit?: BackendEvent; // Prop opcional para modo edición
}

const TIPOS_PODA = [
  { value: "APICAL", label: "Poda Apical", description: "Corte del tallo principal" },
  { value: "FIM", label: "FIM (Fuck I Missed)", description: "Técnica de topping parcial" },
  { value: "LST", label: "LST (Low Stress Training)", description: "Entrenamiento de bajo estrés" },
];

export const PruningForm = ({ onBack, onClose, plantaId, eventToEdit }: PruningFormProps) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: plantas = [], isLoading: isLoadingPlantas } = useQuery<PlantaDto[]>({
    queryKey: ['plantas'],
    queryFn: apiService.getPlantas,
    enabled: !plantaId && !eventToEdit,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const createPruningMutation = useMutation({
    mutationFn: apiService.createPruningEvent,
    onSuccess: (data) => {
      toast({
        title: "¡Poda Registrada!",
        description: `Evento de poda tipo '${data.tipoPoda}' registrado para planta(s) ID(s): ${data.plantaIds.join(', ')}.`,
      });
      setIsSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['plantEvents'] });
      queryClient.invalidateQueries({ queryKey: ['plantas'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error al registrar la poda",
        description: error.message || "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
      });
    }
  });

  const updatePruningMutation = useMutation({
    mutationFn: ({ eventId, payload }: { eventId: string; payload: any }) =>
      apiService.updateEvent("pruning", eventId, payload),
    onSuccess: (data) => {
      toast({
        title: "¡Poda Actualizada!",
        description: `La poda (ID: ${data.id}) ha sido actualizada con éxito.`,
      });
      setIsSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['plantEvents'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error al actualizar la poda",
        description: error.message || "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
      });
    }
  });

  const form = useForm<PruningFormData>({
    resolver: zodResolver(pruningSchema),
    defaultValues: {
      planta_id: plantaId || eventToEdit?.plantaIds[0]?.toString() || "",
      tipo_poda: (eventToEdit?.tipoPoda as "APICAL" | "FIM" | "LST") || "APICAL", // Castear para zod enum
    },
  });

  useEffect(() => {
    if (plantaId) {
      form.setValue("planta_id", plantaId);
    } else if (eventToEdit) {
      form.setValue("planta_id", eventToEdit.plantaIds[0]?.toString() || "");
      form.setValue("tipo_poda", (eventToEdit.tipoPoda as "APICAL" | "FIM" | "LST") || "APICAL");
    }
  }, [plantaId, eventToEdit, form]);

  const onSubmit = (data: PruningFormData) => {
    const selectedPlantaId = plantaId || data.planta_id;

    if (!selectedPlantaId) {
      toast({
        variant: "destructive",
        title: "Selección Requerida",
        description: "Debes seleccionar una planta antes de registrar la poda.",
      });
      return;
    }

    const payload = {
      fecha: eventToEdit?.fecha || new Date().toISOString().split('T')[0],
      plantaIds: [parseInt(selectedPlantaId)],
      tipoPoda: data.tipo_poda,
    };

    if (eventToEdit) {
      updatePruningMutation.mutate({ eventId: eventToEdit.id.toString(), payload });
    } else {
      createPruningMutation.mutate(payload);
    }
  };

  const handleReset = () => {
    form.reset();
    setIsSubmitted(false);
  };

  const isPending = createPruningMutation.isPending || updatePruningMutation.isPending;

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-foreground">¡Poda {eventToEdit ? 'Actualizada' : 'Registrada'}!</h3>
          <p className="text-muted-foreground">
            El registro se ha guardado correctamente
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <Button onClick={handleReset} variant="outline" className="flex-1">
            <Scissors className="mr-2 h-4 w-4" />
            {eventToEdit ? 'Editar Otra' : 'Registrar Otra'}
          </Button>
          <Button onClick={onClose} className="flex-1">
            Cerrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h3 className="text-xl font-bold text-foreground">{eventToEdit ? 'Editar Poda' : 'Registrar Poda'}</h3>
          <p className="text-sm text-muted-foreground">Documenta las podas realizadas</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

          {!plantaId && !eventToEdit && (
            <FormField
              control={form.control}
              name="planta_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Planta</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una planta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingPlantas ? (
                        <SelectItem value="loading" disabled>Cargando plantas...</SelectItem>
                      ) : plantas.length > 0 ? (
                        plantas.map((planta) => (
                          <SelectItem key={planta.id} value={planta.id.toString()}>
                            {planta.nombre}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No hay plantas disponibles</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {eventToEdit && (
            <FormItem>
              <FormLabel>Planta</FormLabel>
              <FormControl>
                <Input value={eventToEdit.plantaIds[0]} disabled className="text-muted-foreground" />
              </FormControl>
              <FormDescription>ID de la planta a la que se aplica la poda.</FormDescription>
            </FormItem>
          )}

          <FormField
            control={form.control}
            name="tipo_poda"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Poda</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIPOS_PODA.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{tipo.label}</span>
                          <span className="text-xs text-muted-foreground">{tipo.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" size="lg" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Scissors className="mr-2 h-5 w-5" />
            )}
            {eventToEdit ? 'Guardar Cambios' : 'Registrar Poda'}
          </Button>
        </form>
      </Form>
    </div>
  );
};
