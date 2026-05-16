import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Droplets, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

// Tipos para el evento de backend (simplificado para Wateriung)
interface BackendEvent {
  id: number;
  eventType: string;
  fecha: string;
  plantaIds: number[];
  phAgua?: number;
  ecAgua?: number;
  tempAgua?: number;
}

const wateringSchema = z.object({
  planta_id: z.string().optional(),
  ph_agua: z.string().optional(),
  ec_agua: z.string().optional(),
  temp_agua: z.string().optional(),
});

type WateringFormData = z.infer<typeof wateringSchema>;

interface WateringFormProps {
  onBack: () => void;
  onClose: () => void;
  plantaId?: string; // Prop opcional para contexto pre-seleccionado (creación)
  eventToEdit?: BackendEvent; // Prop opcional para modo edición
}

export const WateringForm = ({ onBack, onClose, plantaId, eventToEdit }: WateringFormProps) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Si no hay plantaId y no estamos editando, cargamos todas las plantas para el selector
  const { data: plantas = [], isLoading: isLoadingPlantas } = useQuery<PlantaDto[]>({
    queryKey: ['plantas'],
    queryFn: apiService.getPlantas,
    enabled: !plantaId && !eventToEdit, // Solo cargar si no hay contexto y no estamos editando
  });

  const createWateringMutation = useMutation({
    mutationFn: apiService.createWateringEvent,
    onSuccess: (data) => {
      toast({
        title: "¡Riego Registrado!",
        description: `El riego para la planta (ID: ${data.plantaIds[0]}) ha sido registrado.`,
      });
      setIsSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['plantEvents'] });
      queryClient.invalidateQueries({ queryKey: ['plantas'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error al registrar el riego",
        description: error.message || "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
      });
    }
  });

  const updateWateringMutation = useMutation({
    mutationFn: ({ eventId, payload }: { eventId: string; payload: any }) =>
      apiService.updateEvent("watering", eventId, payload),
    onSuccess: (data) => {
      toast({
        title: "¡Riego Actualizado!",
        description: `El riego (ID: ${data.id}) ha sido actualizado con éxito.`,
      });
      setIsSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['plantEvents'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error al actualizar el riego",
        description: error.message || "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
      });
    }
  });

  const form = useForm<WateringFormData>({
    resolver: zodResolver(wateringSchema),
    defaultValues: {
      planta_id: plantaId || eventToEdit?.plantaIds[0]?.toString() || "",
      ph_agua: eventToEdit?.phAgua?.toString() || "",
      ec_agua: eventToEdit?.ecAgua?.toString() || "",
      temp_agua: eventToEdit?.tempAgua?.toString() || "",
    },
  });

  useEffect(() => {
    if (plantaId) {
      form.setValue("planta_id", plantaId);
    } else if (eventToEdit) {
      form.setValue("planta_id", eventToEdit.plantaIds[0]?.toString() || "");
      form.setValue("ph_agua", eventToEdit.phAgua?.toString() || "");
      form.setValue("ec_agua", eventToEdit.ecAgua?.toString() || "");
      form.setValue("temp_agua", eventToEdit.tempAgua?.toString() || "");
    }
  }, [plantaId, eventToEdit, form]);

  const onSubmit = (data: WateringFormData) => {
    const selectedPlantaId = plantaId || data.planta_id;

    if (!selectedPlantaId) {
      toast({
        variant: "destructive",
        title: "Selección Requerida",
        description: "Debes seleccionar una planta antes de registrar el riego.",
      });
      return;
    }

    const payload = {
      fecha: eventToEdit?.fecha || new Date().toISOString().split('T')[0],
      plantaIds: [parseInt(selectedPlantaId)],
      phAgua: data.ph_agua ? parseFloat(data.ph_agua) : 0.0,
      ecAgua: data.ec_agua ? parseFloat(data.ec_agua) : 0.0,
      tempAgua: data.temp_agua ? parseFloat(data.temp_agua) : 0.0,
    };

    if (eventToEdit) {
      updateWateringMutation.mutate({ eventId: eventToEdit.id.toString(), payload });
    } else {
      createWateringMutation.mutate(payload);
    }
  };

  const handleReset = () => {
    form.reset();
    setIsSubmitted(false);
  };

  const isPending = createWateringMutation.isPending || updateWateringMutation.isPending;

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-foreground">¡Riego {eventToEdit ? 'Actualizado' : 'Registrado'}!</h3>
          <p className="text-muted-foreground">
            El registro se ha guardado correctamente
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <Button onClick={handleReset} variant="outline" className="flex-1">
            <Droplets className="mr-2 h-4 w-4" />
            {eventToEdit ? 'Editar Otro' : 'Registrar Otro'}
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
          <h3 className="text-xl font-bold text-foreground">{eventToEdit ? 'Editar Riego' : 'Registrar Riego'}</h3>
          <p className="text-sm text-muted-foreground">Documenta el riego de tus plantas</p>
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
              <FormDescription>ID de la planta a la que se aplica el riego.</FormDescription>
            </FormItem>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="ph_agua"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>pH del Agua</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Ej: 6.5"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ec_agua"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Electroconductividad (EC)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Ej: 1.2"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="temp_agua"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Temperatura (°C)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Ej: 22"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" size="lg" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Droplets className="mr-2 h-5 w-5" />}
            {eventToEdit ? 'Guardar Cambios' : 'Registrar Riego'}
          </Button>
        </form>
      </Form>
    </div>
  );
};
