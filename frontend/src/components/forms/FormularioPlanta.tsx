import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { PlantaDto, SalaDto, CepaDto } from "@/interfaces/Planta";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormInputField } from "./FormInputField";
import { FormSelectField } from "./FormSelectField";
import { Loader2, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const plantaFormSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    etapa: z.string().min(1, "La etapa es requerida"),
    salaId: z.string().min(1, "La sala es requerida"),
    cepaId: z.string().min(1, "La genética es requerida"),
    ubicacion: z.string().optional(),
    produccion: z.string().optional(),
    fechaFin: z.string().optional(),
    imagenUrl: z.string().optional(),
});

type PlantaFormData = z.infer<typeof plantaFormSchema>;

interface FormularioPlantaProps {
    mode: 'create' | 'edit';
    initialData?: PlantaDto;
    onSuccess: () => void;
}

const ETAPAS_OPTIONS = [
    { value: "GERMINACION", label: "Germinación" },
    { value: "PLANTIN", label: "Plántula" },
    { value: "VEGETACION", label: "Vegetativo" },
    { value: "FLORACION", label: "Floración" },
    { value: "COSECHADA", label: "Cosechada" },
];

export const FormularioPlanta = ({ mode, initialData, onSuccess }: FormularioPlantaProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: salas = [], isLoading: isLoadingSalas } = useQuery<SalaDto[]>({
        queryKey: ['salas'],
        queryFn: apiService.getSalas,
    });

    const { data: cepas = [], isLoading: isLoadingCepas } = useQuery<CepaDto[]>({
        queryKey: ['cepas'],
        queryFn: apiService.getCepas,
    });

    const form = useForm<PlantaFormData>({
        resolver: zodResolver(plantaFormSchema),
        defaultValues: {
            nombre: initialData?.nombre || '',
            etapa: initialData?.etapa || 'VEGETACION',
            salaId: initialData?.sala?.id?.toString() || '',
            cepaId: initialData?.cepaDto?.id?.toString() || '',
            ubicacion: initialData?.ubicacion || '',
            produccion: initialData?.produccion?.toString() || '',
            fechaFin: initialData?.fechaFin || '',
            imagenUrl: initialData?.imagenUrl || '',
        },
    });

    const mutation = useMutation({
        mutationFn: async (data: PlantaFormData) => {
            const payload: Record<string, any> = {
                nombre: data.nombre,
                etapa: data.etapa,
                salaId: parseInt(data.salaId),
                cepaId: parseInt(data.cepaId),
                ubicacion: data.ubicacion || null,
                produccion: data.produccion ? parseInt(data.produccion) : 0,
                fechaFin: data.fechaFin || null,
                imagenUrl: data.imagenUrl || null,
            };

            // Preserve zone position when editing a plant already placed in a grid
            if (mode === 'edit' && initialData?.zonaId) {
                payload.zonaId = initialData.zonaId;
                payload.columnaEnZona = initialData.columnaEnZona;
                payload.filaEnZona = initialData.filaEnZona;
            }

            if (mode === 'create') {
                return apiService.createPlanta(payload);
            } else {
                return apiService.updatePlanta(initialData!.id, payload);
            }
        },
        onSuccess: () => {
            toast({
                title: mode === 'create' ? 'Planta Creada' : 'Planta Actualizada',
                description: `La planta ha sido ${mode === 'create' ? 'creada' : 'actualizada'} correctamente.`,
            });
            queryClient.invalidateQueries({ queryKey: ['plantas'] });
            queryClient.invalidateQueries({ queryKey: ['plantas', 'sala', initialData?.salaId] });
            queryClient.invalidateQueries({ queryKey: ['zonas', 'sala', initialData?.salaId] });
            if (initialData?.id) {
                queryClient.invalidateQueries({ queryKey: ['planta', initialData.id.toString()] });
            }
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

    const salasOptions = salas.map(sala => ({
        value: sala.id.toString(),
        label: sala.nombre
    }));

    const cepasOptions = cepas.map(cepa => ({
        value: cepa.id.toString(),
        label: `${cepa.geneticaParental}${cepa.dominancia ? ` (${cepa.dominancia})` : ''}`
    }));

    // When editing a plant already placed in a zone grid, lock location fields
    const isPlacedInGrid = mode === 'edit' && !!initialData?.zonaId;

    if (isLoadingSalas || isLoadingCepas) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">Cargando datos...</span>
            </div>
        );
    }

    // Validación: Si no hay salas o genéticas, mostrar advertencia
    if (salas.length === 0 || cepas.length === 0) {
        return (
            <div className="p-4 border border-yellow-500 rounded-md bg-yellow-50 dark:bg-yellow-900/20">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    Datos Faltantes
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                    Para crear una planta necesitas:
                </p>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside mb-3">
                    {salas.length === 0 && <li>Al menos 1 Sala creada</li>}
                    {cepas.length === 0 && <li>Al menos 1 Genética creada</li>}
                </ul>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    Ve al Panel de Control para crear estos elementos primero.
                </p>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
                <FormInputField
                    control={form.control}
                    name="nombre"
                    label="Nombre / Etiqueta"
                    placeholder="Ej: GEL-005"
                    required
                />

                <FormSelectField
                    control={form.control}
                    name="salaId"
                    label="Sala"
                    options={salasOptions}
                    placeholder="Selecciona una sala"
                    emptyMessage="No hay salas disponibles"
                    disabled={isPlacedInGrid}
                />

                {isPlacedInGrid && (
                    <div className="text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-2 border border-muted">
                        <MapPin size={14} className="inline mr-1 text-primary" />
                        Esta planta está ubicada en una zona del grid. La sala y ubicación no se pueden cambiar desde acá.
                    </div>
                )}

                <FormSelectField
                    control={form.control}
                    name="cepaId"
                    label="Genética"
                    options={cepasOptions}
                    placeholder="Selecciona una genética"
                    emptyMessage="No hay genéticas disponibles"
                />

                <FormSelectField
                    control={form.control}
                    name="etapa"
                    label="Etapa de Crecimiento"
                    options={ETAPAS_OPTIONS}
                    placeholder="Selecciona etapa"
                />

                {!isPlacedInGrid && (
                    <FormInputField
                        control={form.control}
                        name="ubicacion"
                        label="Ubicación en Sala"
                        placeholder="Ej: Estante 2, Esquina izquierda"
                        optional
                    />
                )}

                <div className="grid grid-cols-2 gap-4">
                    <FormInputField
                        control={form.control}
                        name="produccion"
                        label="Producción Esperada (g)"
                        type="number"
                        placeholder="Ej: 150"
                        optional
                    />

                    <FormInputField
                        control={form.control}
                        name="fechaFin"
                        label="Fecha de Finalización"
                        type="date"
                        optional
                    />
                </div>

                <FormInputField
                    control={form.control}
                    name="imagenUrl"
                    label="URL de Foto (opcional)"
                    placeholder="https://ejemplo.com/mi-planta.jpg"
                    optional
                />

                <Button type="submit" className="w-full" disabled={mutation.isPending}>
                    {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {mode === 'create' ? 'Crear Planta' : 'Guardar Cambios'}
                </Button>
            </form>
        </Form>
    );
};
