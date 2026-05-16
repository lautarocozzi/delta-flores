import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Camera, CheckCircle, ArrowLeft, Upload, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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

// Tipos para el evento de backend
interface BackendEvent {
  id: number;
  eventType: string;
  fecha: string;
  plantaIds: number[];
  description?: string; // Para PhotoEvent
  mediaUrls?: string[]; // Para PhotoEvent
}

const photoSchema = z.object({
  planta_id: z.string().optional(),
  description: z.string().optional(),
});

type PhotoFormData = z.infer<typeof photoSchema>;

interface PhotoFormProps {
  onBack: () => void;
  onClose: () => void;
  plantaId?: string;
  eventToEdit?: BackendEvent; // Prop opcional para modo edición
}

export const PhotoForm = ({ onBack, onClose, plantaId, eventToEdit }: PhotoFormProps) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref para resetear input file

  const { data: plantas = [], isLoading: isLoadingPlantas } = useQuery<PlantaDto[]>({
    queryKey: ['plantas'],
    queryFn: apiService.getPlantas,
    enabled: !plantaId && !eventToEdit,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const createPhotoMutation = useMutation({
    mutationFn: apiService.createPhotoEvent,
    onSuccess: (data) => {
      toast({
        title: "¡Foto Registrada!",
        description: `La imagen para la planta (ID: ${data.plantaIds[0]}) ha sido registrada.`,
      });
      setIsSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['plantEvents'] });
      queryClient.invalidateQueries({ queryKey: ['plantas'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error al registrar la foto",
        description: error.message || "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
      });
    }
  });

  const updatePhotoMutation = useMutation({
    mutationFn: ({ eventId, formData }: { eventId: string; formData: FormData }) =>
      apiService.updateEvent("photo", eventId, formData),
    onSuccess: (data) => {
      toast({
        title: "¡Foto Actualizada!",
        description: `La foto (ID: ${data.id}) ha sido actualizada con éxito.`,
      });
      setIsSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['plantEvents'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error al actualizar la foto",
        description: error.message || "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
      });
    }
  });

  const form = useForm<PhotoFormData>({
    resolver: zodResolver(photoSchema),
    defaultValues: {
      planta_id: plantaId || eventToEdit?.plantaIds[0]?.toString() || "",
      description: eventToEdit?.description || "",
    },
  });

  useEffect(() => {
    if (plantaId) {
      form.setValue("planta_id", plantaId);
    } else if (eventToEdit) {
      form.setValue("planta_id", eventToEdit.plantaIds[0]?.toString() || "");
      form.setValue("description", eventToEdit.description || "");
      // No se pre-carga el archivo seleccionado, solo la descripción
    }
  }, [plantaId, eventToEdit, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setSelectedFile(null);
      setPreviewUrl("");
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = (data: PhotoFormData) => {
    const selectedPlantaId = plantaId || data.planta_id;

    if (!selectedPlantaId) {
      toast({
        variant: "destructive",
        title: "Selección Requerida",
        description: "Debes seleccionar una planta antes de guardar la foto.",
      });
      return;
    }

    // Para creación, se requiere un archivo
    if (!eventToEdit && !selectedFile) {
      toast({
        variant: "destructive",
        title: "Imagen Requerida",
        description: "Debes seleccionar una imagen para subir.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("fecha", eventToEdit?.fecha || new Date().toISOString().split('T')[0]);
    formData.append("plantaIds", selectedPlantaId);
    formData.append("description", data.description || "");

    if (selectedFile) {
      formData.append("files", selectedFile);
    } else if (eventToEdit?.mediaUrls) {
      // Si no hay archivo nuevo y estamos editando, podemos volver a enviar las URLs existentes si el backend lo espera
      // O el backend debería mantener los archivos existentes si no se envían nuevos.
      // Por simplicidad, si no hay archivo nuevo, no se envía "files" en el FormData para la actualización.
    }

    if (eventToEdit) {
      updatePhotoMutation.mutate({ eventId: eventToEdit.id.toString(), formData });
    } else {
      createPhotoMutation.mutate(formData);
    }
  };

  const handleReset = () => {
    form.reset();
    setIsSubmitted(false);
    setSelectedFile(null);
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isPending = createPhotoMutation.isPending || updatePhotoMutation.isPending;

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-foreground">¡Foto {eventToEdit ? 'Actualizada' : 'Registrada'}!</h3>
          <p className="text-muted-foreground">
            La imagen se ha guardado correctamente
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <Button onClick={handleReset} variant="outline" className="flex-1">
            <Camera className="mr-2 h-4 w-4" />
            {eventToEdit ? 'Editar Otra' : 'Agregar Otra'}
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
          <h3 className="text-xl font-bold text-foreground">{eventToEdit ? 'Editar Foto' : 'Tomar Foto'}</h3>
          <p className="text-sm text-muted-foreground">Documenta visualmente el progreso</p>
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
              <FormDescription>ID de la planta a la que se asocia la foto.</FormDescription>
            </FormItem>
          )}

          {eventToEdit?.mediaUrls && eventToEdit.mediaUrls.length > 0 && (
            <FormItem>
              <FormLabel>Imagen Actual</FormLabel>
              <div className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl bg-muted/50 border-border">
                <img
                  src={eventToEdit.mediaUrls[0]}
                  alt="Current Photo"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <FormDescription>Esta es la imagen actualmente registrada para el evento.</FormDescription>
            </FormItem>
          )}

          <div className="space-y-2">
            <FormLabel>Nueva Imagen (Opcional)</FormLabel>
            <div className="flex flex-col items-center justify-center w-full">
              <label
                htmlFor="photo-upload"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors border-border"
              >
                {(previewUrl && selectedFile) ? (
                  <img
                    src={previewUrl}
                    alt="Preview Nueva Imagen"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click para subir</span> o arrastra y suelta
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG o WEBP (MAX. 5MB)
                    </p>
                  </div>
                )}
                <input
                  id="photo-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                  multiple={false}
                  ref={fileInputRef}
                />
              </label>
              {(previewUrl && selectedFile) && (
                <Button type="button" variant="ghost" size="sm" onClick={handleClearFile} className="mt-2">
                  Quitar Nueva Imagen
                </Button>
              )}
            </div>
            <FormDescription>
              Sube una nueva foto para reemplazar o actualizar la existente.
            </FormDescription>
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción (Opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe lo que se observa en la foto..."
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" size="lg" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Camera className="mr-2 h-5 w-5" />
            )}
            {eventToEdit ? 'Guardar Cambios' : 'Guardar Foto'}
          </Button>
        </form>
      </Form>
    </div>
  );
};
