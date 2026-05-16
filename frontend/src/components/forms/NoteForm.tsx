import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FileText, CheckCircle, ArrowLeft, Loader2, Upload, XCircle, Mic, Square, Trash2 } from "lucide-react";
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

// Tipos para el evento de backend
interface BackendEvent {
  id: number;
  eventType: string;
  fecha: string;
  plantaIds: number[];
  text?: string; // Para NoteEvent
  mediaUrls?: string[]; // Para NoteEvent y PhotoEvent
}

const noteSchema = z.object({
  planta_id: z.string().optional(),
  contenido: z.string().min(1, "La nota no puede estar vacía"),
});

type NoteFormData = z.infer<typeof noteSchema>;

interface NoteFormProps {
  onBack: () => void;
  onClose: () => void;
  plantaId?: string;
  eventToEdit?: BackendEvent; // Prop opcional para modo edición
}

export const NoteForm = ({ onBack, onClose, plantaId, eventToEdit }: NoteFormProps) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop()); // Stop mic
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone", err);
      toast({
        variant: "destructive",
        title: "Error de Micrófono",
        description: "No se pudo acceder al micrófono.",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const { data: plantas = [], isLoading: isLoadingPlantas } = useQuery<PlantaDto[]>({
    queryKey: ['plantas'],
    queryFn: apiService.getPlantas,
    enabled: !plantaId && !eventToEdit,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const createNoteMutation = useMutation({
    mutationFn: apiService.createNoteEvent,
    onSuccess: (data) => {
      toast({
        title: "¡Nota Guardada!",
        description: `La nota para la planta (ID: ${data.plantaIds[0]}) ha sido registrada.`,
      });
      setIsSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['plantEvents'] });
      queryClient.invalidateQueries({ queryKey: ['plantas'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error al guardar la nota",
        description: error.message || "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
      });
    }
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ eventId, formData }: { eventId: string; formData: FormData }) =>
      apiService.updateEvent("note", eventId, formData),
    onSuccess: (data) => {
      toast({
        title: "¡Nota Actualizada!",
        description: `La nota (ID: ${data.id}) ha sido actualizada con éxito.`,
      });
      setIsSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['plantEvents'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error al actualizar la nota",
        description: error.message || "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
      });
    }
  });

  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      planta_id: plantaId || eventToEdit?.plantaIds[0]?.toString() || "",
      contenido: eventToEdit?.text || "",
    },
  });

  useEffect(() => {
    if (plantaId) {
      form.setValue("planta_id", plantaId);
    } else if (eventToEdit) {
      form.setValue("planta_id", eventToEdit.plantaIds[0]?.toString() || "");
      form.setValue("contenido", eventToEdit.text || "");
    }
  }, [plantaId, eventToEdit, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const handleClearSelectedFiles = () => {
    setSelectedFiles(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = (data: NoteFormData) => {
    const selectedPlantaId = plantaId || data.planta_id;

    if (!selectedPlantaId) {
      toast({
        variant: "destructive",
        title: "Selección Requerida",
        description: "Debes seleccionar una planta antes de guardar la nota.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("fecha", eventToEdit?.fecha || new Date().toISOString().split('T')[0]);
    formData.append("plantaIds", selectedPlantaId);
    formData.append("text", data.contenido);

    if (selectedFiles) {
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append("files", selectedFiles[i]);
      }
    }

    if (audioBlob) {
      // Create a File object from the Blob
      const audioFile = new File([audioBlob], `nota-voz-${Date.now()}.webm`, { type: 'audio/webm' });
      formData.append("files", audioFile);
    }

    if (eventToEdit) {
      // Para edición, el backend espera @ModelAttribute y @RequestParam(value="newFiles")
      // Reutilizamos el mismo formData, pero el controlador lo interpretará como newFiles
      updateNoteMutation.mutate({ eventId: eventToEdit.id.toString(), formData });
    } else {
      createNoteMutation.mutate(formData);
    }
  };

  const handleReset = () => {
    form.reset();
    setSelectedFiles(null);
    setAudioBlob(null);
    setIsRecording(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsSubmitted(false);
  };

  const isPending = createNoteMutation.isPending || updateNoteMutation.isPending;

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-foreground">¡Nota {eventToEdit ? 'Actualizada' : 'Guardada'}!</h3>
          <p className="text-muted-foreground">
            El registro se ha guardado correctamente
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <Button onClick={handleReset} variant="outline" className="flex-1">
            <FileText className="mr-2 h-4 w-4" />
            {eventToEdit ? 'Editar Otra' : 'Crear Otra'}
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
          <h3 className="text-xl font-bold text-foreground">{eventToEdit ? 'Editar Nota' : 'Nueva Nota'}</h3>
          <p className="text-sm text-muted-foreground">Registra observaciones y comentarios</p>
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
              <FormDescription>ID de la planta a la que se aplica la nota.</FormDescription>
            </FormItem>
          )}

          <FormField
            control={form.control}
            name="contenido"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contenido de la Nota</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Escribe tus observaciones aquí..."
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Documenta cualquier observación importante sobre la planta.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {eventToEdit?.mediaUrls && eventToEdit.mediaUrls.length > 0 && (
            <FormItem>
              <FormLabel>Archivos Adjuntos Actuales</FormLabel>
              <div className="flex flex-wrap gap-2">
                {eventToEdit.mediaUrls.map((url, index) => (
                  <div key={index} className="relative p-1 border rounded-md text-xs text-muted-foreground flex items-center">
                    <span className="mr-1">{url.substring(url.lastIndexOf('/') + 1)}</span>
                  </div>
                ))}
              </div>
              <FormDescription>Estos archivos ya están asociados a la nota.</FormDescription>
            </FormItem>
          )}

          {/* Audio Recorder Section */}
          <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
            <FormLabel className="flex items-center gap-2"><Mic className="w-4 h-4" /> Nota de Voz</FormLabel>

            {!audioBlob ? (
              <div className="flex items-center gap-3">
                {!isRecording ? (
                  <Button type="button" variant="secondary" size="sm" onClick={startRecording} className="w-full sm:w-auto">
                    <Mic className="mr-2 h-4 w-4 text-destructive" /> Grabar Audio
                  </Button>
                ) : (
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-sm font-medium animate-pulse text-destructive">Grabando... {recordingTime}s</span>
                    <Button type="button" variant="destructive" size="sm" onClick={stopRecording}>
                      <Square className="mr-2 h-4 w-4 fill-current" /> Detener
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <audio src={URL.createObjectURL(audioBlob)} controls className="h-8 w-48" />
                <Button type="button" variant="ghost" size="icon" onClick={() => setAudioBlob(null)} title="Descartar grabación">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            )}
          </div>


          <FormItem>
            <FormLabel>Adjuntar Nuevos Archivos (Opcional)</FormLabel>
            <FormControl>
              <div className="flex items-center space-x-2">
                <Input type="file" multiple onChange={handleFileChange} className="flex-1" ref={fileInputRef} />
                <Button type="button" variant="outline" size="icon" onClick={handleClearSelectedFiles} disabled={!selectedFiles}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </FormControl>
            <FormDescription>
              Puedes adjuntar nuevas imágenes o documentos relevantes a esta nota.
            </FormDescription>
            <FormMessage />
          </FormItem>

          <Button type="submit" className="w-full" size="lg" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-5 w-5" />
            )}
            {eventToEdit ? 'Guardar Cambios' : 'Guardar Nota'}
          </Button>
        </form>
      </Form>
    </div>
  );
};
