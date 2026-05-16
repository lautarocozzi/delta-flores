import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Leaf, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
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

// Definición para NutrienteDto del backend
interface NutrienteDto {
  id: number;
  titulo: string;
  descripcion?: string;
}

// Tipos para el evento de backend
interface BackendEvent {
  id: number;
  eventType: string;
  fecha: string;
  plantaIds: number[];
  nutriente?: NutrienteDto; // Para NutrientEvent
}

const nutrientsSchema = z.object({
  planta_id: z.string().optional(),
  nutriente_id: z.string().min(1, "Debes seleccionar un nutriente"),
});

type NutrientsFormData = z.infer<typeof nutrientsSchema>;

interface NutrientsFormProps {
  onBack: () => void;
  onClose: () => void;
  plantaId?: string;
  eventToEdit?: BackendEvent; // Prop opcional para modo edición
}

export const NutrientsForm = ({ onBack, onClose, plantaId, eventToEdit }: NutrientsFormProps) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: plantas = [], isLoading: isLoadingPlantas } = useQuery<PlantaDto[]>({
    queryKey: ['plantas'],
    queryFn: apiService.getPlantas,
    enabled: !plantaId && !eventToEdit,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const { data: nutrientes = [], isLoading: isLoadingNutrientes } = useQuery<NutrienteDto[]>({
    queryKey: ['nutrientes'],
    queryFn: apiService.getNutrientes,
    enabled: !eventToEdit, // Siempre cargamos nutrientes si no estamos en modo edición (o si no hay evento para pre-cargar)
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const createNutrientMutation = useMutation({
    mutationFn: apiService.createNutrientEvent,
    onSuccess: (data) => {
      toast({
        title: "¡Nutrientes Registrados!",
        description: `Aplicación de nutriente (ID: ${data.nutriente.id}) registrada para planta(s) ID(s): ${data.plantaIds.join(', ')}.`,
      });
      setIsSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['plantEvents'] });
      queryClient.invalidateQueries({ queryKey: ['plantas'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error al registrar los nutrientes",
        description: error.message || "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
      });
    }
  });

  const updateNutrientMutation = useMutation({
    mutationFn: ({ eventId, payload }: { eventId: string; payload: any }) =>
      apiService.updateEvent("nutrient", eventId, payload),
    onSuccess: (data) => {
      toast({
        title: "¡Nutrientes Actualizados!",
        description: `La aplicación de nutriente (ID: ${data.id}) ha sido actualizada con éxito.`,
      });
      setIsSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['plantEvents'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error al actualizar los nutrientes",
        description: error.message || "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
      });
    }
  });

  const form = useForm<NutrientsFormData>({
    resolver: zodResolver(nutrientsSchema),
    defaultValues: {
      planta_id: plantaId || eventToEdit?.plantaIds[0]?.toString() || "",
      nutriente_id: eventToEdit?.nutriente?.id?.toString() || "",
    },
  });

  useEffect(() => {
    if (plantaId) {
      form.setValue("planta_id", plantaId);
    } else if (eventToEdit) {
      form.setValue("planta_id", eventToEdit.plantaIds[0]?.toString() || "");
      form.setValue("nutriente_id", eventToEdit.nutriente?.id?.toString() || "");
    }
  }, [plantaId, eventToEdit, form]);

  const onSubmit = (data: NutrientsFormData) => {
    const selectedPlantaId = plantaId || data.planta_id;

    if (!selectedPlantaId) {
      toast({
        variant: "destructive",
        title: "Selección Requerida",
        description: "Debes seleccionar una planta.",
      });
      return;
    }

    if (!data.nutriente_id) {
      toast({
        variant: "destructive",
        title: "Nutriente Requerido",
        description: "Debes seleccionar un nutriente aplicado.",
      });
      return;
    }

    const payload = {
      fecha: eventToEdit?.fecha || new Date().toISOString().split('T')[0],
      plantaIds: [parseInt(selectedPlantaId)],
      nutriente: { id: parseInt(data.nutriente_id) },
    };

    if (eventToEdit) {
      updateNutrientMutation.mutate({ eventId: eventToEdit.id.toString(), payload });
    } else {
      createNutrientMutation.mutate(payload);
    }
  };

  const handleReset = () => {
    form.reset();
    setIsSubmitted(false);
  };

  const isPending = createNutrientMutation.isPending || updateNutrientMutation.isPending;

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-foreground">¡Nutrientes {eventToEdit ? 'Actualizados' : 'Registrados'}!</h3>
          <p className="text-muted-foreground">
            El registro se ha guardado correctamente
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <Button onClick={handleReset} variant="outline" className="flex-1">
            <Leaf className="mr-2 h-4 w-4" />
            {eventToEdit ? 'Editar Otros' : 'Registrar Otros'}
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
          <h3 className="text-xl font-bold text-foreground">{eventToEdit ? 'Editar Nutrientes' : 'Añadir Nutrientes'}</h3>
          <p className="text-sm text-muted-foreground">Registra la aplicación de nutrientes</p>
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
              <FormDescription>ID de la planta a la que se aplican los nutrientes.</FormDescription>
            </FormItem>
          )}

          <FormField
            control={form.control}
            name="nutriente_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nutriente Aplicado</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un nutriente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingNutrientes ? (
                      <SelectItem value="loading" disabled>Cargando nutrientes...</SelectItem>
                    ) : nutrientes.length > 0 ? (
                      nutrientes.map((nutriente) => (
                        <SelectItem key={nutriente.id} value={nutriente.id.toString()}>
                          {nutriente.titulo} {nutriente.descripcion ? `(${nutriente.descripcion})` : ''}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No hay nutrientes registrados</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Selecciona el producto nutriente que estás aplicando.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" size="lg" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Leaf className="mr-2 h-5 w-5" />
            )}
            {eventToEdit ? 'Guardar Cambios' : 'Registrar Nutrientes'}
          </Button>
        </form>
      </Form>
    </div>
  );
};
