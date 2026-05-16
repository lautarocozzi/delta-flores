import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { CepaDto } from "@/interfaces/Planta";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormInputField } from "./FormInputField";
import { FormSelectField } from "./FormSelectField";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const cepaFormSchema = z.object({
    geneticaParental: z.string().min(1, "El nombre es requerido"),
    abreviatura: z.string().min(1, "La abreviatura es requerida").max(10, "Máximo 10 caracteres"),
    dominancia: z.string().optional(),
    aromaSabor: z.string().optional(),
    thc: z.string().optional(),
    cbd: z.string().optional(),
    detalle: z.string().optional(),
});

type CepaFormData = z.infer<typeof cepaFormSchema>;

interface FormularioCepaProps {
    mode: 'create' | 'edit';
    initialData?: CepaDto;
    onSuccess: () => void;
}

export const FormularioCepa = ({ mode, initialData, onSuccess }: FormularioCepaProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<CepaFormData>({
        resolver: zodResolver(cepaFormSchema),
        defaultValues: {
            geneticaParental: initialData?.geneticaParental || '',
            abreviatura: initialData?.abreviatura || '',
            dominancia: initialData?.dominancia || undefined,
            aromaSabor: initialData?.aromaSabor || '',
            thc: initialData?.thc || '',
            cbd: initialData?.cbd || '',
            detalle: initialData?.detalle || '',
        },
    });

    const mutation = useMutation({
        mutationFn: async (data: CepaFormData) => {
            const payload = {
                geneticaParental: data.geneticaParental,
                abreviatura: data.abreviatura,
                dominancia: data.dominancia || null,
                aromaSabor: data.aromaSabor || null,
                thc: data.thc || null,
                cbd: data.cbd || null,
                detalle: data.detalle || null,
            };

            if (mode === 'create') {
                return apiService.createCepa(payload);
            } else {
                return apiService.updateCepa(initialData!.id, payload);
            }
        },
        onSuccess: () => {
            toast({
                title: mode === 'create' ? 'Genética Creada' : 'Genética Actualizada',
                description: `La genética ha sido ${mode === 'create' ? 'creada' : 'actualizada'} correctamente.`,
            });
            queryClient.invalidateQueries({ queryKey: ['cepas'] });
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

    const dominanciaOptions = [
        { value: 'Indica', label: 'Indica' },
        { value: 'Sativa', label: 'Sativa' },
        { value: 'Híbrida', label: 'Híbrida' },
    ];

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
                <FormInputField
                    control={form.control}
                    name="geneticaParental"
                    label="Nombre de la Genética"
                    placeholder="Ej: OG Kush"
                    required
                />

                <FormInputField
                    control={form.control}
                    name="abreviatura"
                    label="Abreviatura"
                    placeholder="Ej: GG4, AK47"
                    required
                />

                <FormSelectField
                    control={form.control}
                    name="dominancia"
                    label="Dominancia"
                    options={dominanciaOptions}
                    placeholder="Seleccionar tipo"
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormInputField
                        control={form.control}
                        name="thc"
                        label="THC (%)"
                        placeholder="Ej: 18-22"
                        optional
                    />

                    <FormInputField
                        control={form.control}
                        name="cbd"
                        label="CBD (%)"
                        placeholder="Ej: 0.5-1"
                        optional
                    />
                </div>

                <FormInputField
                    control={form.control}
                    name="aromaSabor"
                    label="Aroma / Sabor"
                    placeholder="Ej: Cítrico, terroso, dulce"
                    optional
                />

                <div>
                    <label className="text-sm font-medium">Detalles Adicionales</label>
                    <textarea
                        className="w-full p-2 border rounded-md bg-background min-h-[80px] mt-1"
                        {...form.register('detalle')}
                        placeholder="Información adicional sobre la genética, efectos, tiempo de floración, etc."
                    />
                </div>

                <Button type="submit" className="w-full" disabled={mutation.isPending}>
                    {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {mode === 'create' ? 'Crear Genética' : 'Guardar Cambios'}
                </Button>
            </form>
        </Form>
    );
};
