import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Droplets, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { BackendEvent } from "@/interfaces/Eventos";

const wateringSchema = z.object({
    fecha: z.string(),
    phAgua: z.string().min(1, "El pH es requerido"),
    ecAgua: z.string().min(1, "La EC es requerida"),
});

type WateringFormData = z.infer<typeof wateringSchema>;

interface WateringFormProps {
    onBack: () => void;
    onClose: () => void;
    plantaId: string;
    eventToEdit?: BackendEvent;
}

export const WateringForm = ({ onBack, onClose, plantaId, eventToEdit }: WateringFormProps) => {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const form = useForm<WateringFormData>({
        resolver: zodResolver(wateringSchema),
        defaultValues: {
            fecha: eventToEdit?.fecha || new Date().toISOString().split('T')[0],
            phAgua: eventToEdit?.phAgua?.toString() || "",
            ecAgua: eventToEdit?.ecAgua?.toString() || "",
        },
    });

    const createMutation = useMutation({
        mutationFn: apiService.createWateringEvent,
        onSuccess: () => {
            toast({ title: "¡Riego Registrado!", description: "Datos hidropónicos guardados." });
            setIsSubmitted(true);
            queryClient.invalidateQueries({ queryKey: ['plantEvents'] });
        },
        onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message })
    });

    const updateMutation = useMutation({
        mutationFn: ({ eventId, payload }: { eventId: string; payload: any }) =>
            apiService.updateEvent("watering", eventId, payload),
        onSuccess: () => {
            toast({ title: "¡Riego Actualizado!", description: "Datos corregidos." });
            setIsSubmitted(true);
            queryClient.invalidateQueries({ queryKey: ['plantEvents'] });
        },
        onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message })
    });

    const onSubmit = (data: WateringFormData) => {
        const payload = {
            plantaIds: [parseInt(plantaId)],
            fecha: data.fecha,
            phAgua: parseFloat(data.phAgua),
            ecAgua: parseFloat(data.ecAgua)
        };

        if (eventToEdit) {
            updateMutation.mutate({ eventId: eventToEdit.id.toString(), payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    if (isSubmitted) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-6">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20">
                    <CheckCircle className="w-8 h-8 text-blue-500" />
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold">¡Riego Registrado!</h3>
                    <p className="text-muted-foreground">pH y EC almacenados correctamente.</p>
                </div>
                <div className="flex gap-3 w-full max-w-sm">
                    <Button onClick={() => { setIsSubmitted(false); form.reset(); }} variant="outline" className="flex-1">
                        Otro Riego
                    </Button>
                    <Button onClick={onClose} className="flex-1">Cerrar</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h3 className="text-xl font-bold">{eventToEdit ? 'Editar Riego' : 'Nuevo Riego'}</h3>
                    <p className="text-sm text-muted-foreground">Registro de nutrición</p>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="fecha"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fecha</FormLabel>
                                <FormControl><Input type="date" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="phAgua"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>pH</FormLabel>
                                    <FormControl><Input type="number" step="0.1" placeholder="6.2" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="ecAgua"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>EC (mS/cm)</FormLabel>
                                    <FormControl><Input type="number" step="0.01" placeholder="1.8" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={createMutation.isPending || updateMutation.isPending}>
                        {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Droplets className="mr-2 h-4 w-4" />}
                        {eventToEdit ? 'Actualizar Riego' : 'Registrar Riego'}
                    </Button>
                </form>
            </Form>
        </div>
    );
};
