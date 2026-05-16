import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    FileText, Camera, Droplets, Scissors, Leaf, RefreshCw,
    Mic, Square, Trash2, CheckCircle, Loader2, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Validaciones
const entrySchema = z.object({
    eventType: z.enum(["NOTE", "PHOTO", "WATERING", "PRUNING", "NUTRIENT", "STAGE_CHANGE"]),
    fecha: z.string(),
    // Note/Photo
    observacion: z.string().optional(),
    // Watering
    phAgua: z.string().optional(),
    ecAgua: z.string().optional(),
    // Pruning
    tipoPoda: z.string().optional(),
    // Nutrient - Solo requerido si eventType es NUTRIENT
    nutriente_id: z.string().optional(),
    // Stage Change
    nuevaEtapa: z.string().optional(),
}).superRefine((data, ctx) => {
    // Validación condicional: nutriente_id requerido solo para NUTRIENT events
    if (data.eventType === 'NUTRIENT' && (!data.nutriente_id || data.nutriente_id === '')) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['nutriente_id'],
            message: 'Debes seleccionar un nutriente',
        });
    }
});

type EntryFormData = z.infer<typeof entrySchema>;

interface UniversalEntryFormProps {
    plantaId: string;
    onClose: () => void;
    defaultType?: "NOTE" | "PHOTO" | "WATERING" | "PRUNING" | "NUTRIENT" | "STAGE_CHANGE";
}

export const UniversalEntryForm = ({ plantaId, onClose, defaultType = "NOTE" }: UniversalEntryFormProps) => {
    const [eventType, setEventType] = useState(defaultType);
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [mediaFiles, setMediaFiles] = useState<FileList | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Load Metadata (Nutrientes)
    const { data: nutrientes = [] } = useQuery({
        queryKey: ['nutrientes'],
        queryFn: apiService.getNutrientes,
        enabled: eventType === 'NUTRIENT'
    });

    const form = useForm<EntryFormData>({
        resolver: zodResolver(entrySchema),
        defaultValues: {
            eventType: defaultType,
            fecha: new Date().toISOString().split('T')[0],
            observacion: "",
            phAgua: "",
            ecAgua: "",
            tipoPoda: "",
            nutriente_id: "",
            nuevaEtapa: "",
        }
    });

    // Audio Logic
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const chunks: BlobPart[] = [];
            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
            mediaRecorder.onstop = () => {
                setAudioBlob(new Blob(chunks, { type: 'audio/webm' }));
                stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
        } catch (err) {
            toast({ variant: "destructive", title: "Error Micrófono", description: "No se pudo acceder." });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    // Mutations
    const mutationMap = {
        NOTE: apiService.createNoteEvent,
        PHOTO: apiService.createPhotoEvent,
        WATERING: apiService.createWateringEvent,
        PRUNING: apiService.createPruningEvent,
        NUTRIENT: apiService.createNutrientEvent,
        STAGE_CHANGE: apiService.createStageChangeEvent
    };

    const genericMutation = useMutation({
        mutationFn: async (data: any) => {
            // Dispatcher based on type
            if (eventType === 'NOTE' || eventType === 'PHOTO') {
                const formData = new FormData();
                formData.append("plantaIds", plantaId);
                formData.append("fecha", data.fecha);
                formData.append(eventType === 'NOTE' ? "text" : "description", data.observacion || "Sin contenido");
                if (mediaFiles) Array.from(mediaFiles).forEach(f => formData.append("files", f));
                if (audioBlob) formData.append("files", new File([audioBlob], "voice.webm", { type: 'audio/webm' }));
                // Special handling: Note uses createNoteEvent, Photo uses createPhotoEvent
                return eventType === 'NOTE' ? apiService.createNoteEvent(formData) : apiService.createPhotoEvent(formData);
            } else {
                // JSON payloads
                const payload: any = { plantaIds: [parseInt(plantaId)], fecha: data.fecha };
                if (eventType === 'WATERING') {
                    payload.phAgua = parseFloat(data.phAgua);
                    payload.ecAgua = parseFloat(data.ecAgua);
                } else if (eventType === 'PRUNING') {
                    payload.tipoPoda = data.tipoPoda || "Poda General";
                } else if (eventType === 'NUTRIENT') {
                    payload.nutriente = { id: parseInt(data.nutriente_id) };
                } else if (eventType === 'STAGE_CHANGE') {
                    payload.nuevaEtapa = data.nuevaEtapa;
                }
                // Dynamic call to the specific service method is tricky with types, so switch:
                switch (eventType) {
                    case 'WATERING': return apiService.createWateringEvent(payload);
                    case 'PRUNING': return apiService.createPruningEvent(payload);
                    case 'NUTRIENT': return apiService.createNutrientEvent(payload);
                    case 'STAGE_CHANGE': return apiService.createStageChangeEvent(payload);
                }
            }
        },
        onSuccess: () => {
            toast({ title: "¡Evento Registrado!", description: `Se ha guardado tu ${eventType.toLowerCase()}.` });
            queryClient.invalidateQueries({ queryKey: ['plantEvents'] });
            onClose();
        },
        onError: (err: any) => {
            toast({ variant: "destructive", title: "Error", description: err.message });
        }
    });

    const onSubmit = (data: EntryFormData) => {
        genericMutation.mutate(data);
    };

    return (
        <div className="space-y-4">
            {/* Type Selector */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                {[
                    { id: "NOTE", icon: FileText, label: "Nota" },
                    { id: "PHOTO", icon: Camera, label: "Foto" },
                    { id: "WATERING", icon: Droplets, label: "Riego" },
                    { id: "NUTRIENT", icon: Leaf, label: "Nutri." },
                    { id: "PRUNING", icon: Scissors, label: "Poda" },
                    { id: "STAGE_CHANGE", icon: RefreshCw, label: "Etapa" }
                ].map((t) => (
                    <Button
                        key={t.id}
                        type="button"
                        variant={eventType === t.id ? "default" : "outline"}
                        className={cn("flex flex-col h-16 gap-1", eventType === t.id ? "bg-primary text-primary-foreground" : "")}
                        onClick={() => setEventType(t.id as any)}
                    >
                        <t.icon className="w-5 h-5" />
                        <span className="text-[10px]">{t.label}</span>
                    </Button>
                ))}
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <Label>Fecha</Label>
                    <Input type="date" {...form.register("fecha")} />
                </div>

                {/* Dynamic Fields */}
                {(eventType === 'NOTE' || eventType === 'PHOTO') && (
                    <div className="space-y-4">
                        <div>
                            <Label>{eventType === 'NOTE' ? 'Contenido' : 'Descripción'}</Label>
                            <Textarea {...form.register("observacion")} placeholder="Escribe aquí..." />
                        </div>
                        {/* Audio Recorder */}
                        <div className="border p-2 rounded-md bg-muted/20">
                            <Label className="mb-2 block text-xs">Nota de Voz</Label>
                            {!audioBlob ? (
                                !isRecording ?
                                    <Button type="button" size="sm" variant="secondary" onClick={startRecording}><Mic className="w-4 h-4 mr-1" /> Grabar</Button> :
                                    <Button type="button" size="sm" variant="destructive" onClick={stopRecording}><Square className="w-4 h-4 mr-1" /> Detener ({recordingTime}s)</Button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <audio src={URL.createObjectURL(audioBlob)} controls className="h-8 max-w-[200px]" />
                                    <Button type="button" size="icon" variant="ghost" onClick={() => setAudioBlob(null)}><Trash2 className="w-4 h-4" /></Button>
                                </div>
                            )}
                        </div>
                        {/* File Upload */}
                        <div>
                            <Label>Archivos / Fotos</Label>
                            <Input type="file" multiple onChange={e => setMediaFiles(e.target.files)} />
                        </div>
                    </div>
                )}

                {eventType === 'WATERING' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div><Label>pH</Label><Input step="0.1" type="number" {...form.register("phAgua")} /></div>
                        <div><Label>EC</Label><Input step="0.01" type="number" {...form.register("ecAgua")} /></div>
                    </div>
                )}

                {eventType === 'NUTRIENT' && (
                    <div>
                        <Label>Nutriente</Label>
                        <Select onValueChange={v => form.setValue("nutriente_id", v)}>
                            <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                            <SelectContent>
                                {nutrientes.map((n: any) => <SelectItem key={n.id} value={n.id.toString()}>{n.titulo}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {eventType === 'STAGE_CHANGE' && (
                    <div>
                        <Label>Nueva Etapa</Label>
                        <Select onValueChange={v => form.setValue("nuevaEtapa", v)}>
                            <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                            <SelectContent>
                                {["GERMINACION", "PLANTIN", "VEGETACION", "FLORACION", "COSECHADA"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {eventType === 'PRUNING' && (
                    <div>
                        <Label>Tipo de Poda</Label>
                        <Input {...form.register("tipoPoda")} placeholder="Ej: Apical, Bajos..." />
                    </div>
                )}

                <Button type="submit" className="w-full" disabled={genericMutation.isPending}>
                    {genericMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Guardar Evento
                </Button>

            </form>
        </div>
    );
};
