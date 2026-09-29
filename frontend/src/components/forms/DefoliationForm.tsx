import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Scissors, Loader2, ArrowLeft } from "lucide-react";

const defoliationSchema = z.object({
  fecha: z.string().min(1, "La fecha es requerida"),
  gradoDefoliacion: z.string().min(1, "Seleccioná un grado"),
});

type DefoliationFormData = z.infer<typeof defoliationSchema>;

const GRADOS = [
  { value: "LIGERO", label: "Ligero (10-20%)" },
  { value: "MODERADO", label: "Moderado (30-50%)" },
  { value: "SEVERO", label: "Severo (60-80%)" },
];

interface DefoliationFormProps {
  onBack: () => void;
  onClose: () => void;
  selectedPlantIds?: number[];
}

export const DefoliationForm = ({ onBack, onClose, selectedPlantIds }: DefoliationFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<DefoliationFormData>({
    resolver: zodResolver(defoliationSchema),
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      gradoDefoliacion: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: DefoliationFormData) =>
      apiService.createDefoliationEvent({
        plantaIds: selectedPlantIds || [],
        fecha: data.fecha,
        gradoDefoliacion: data.gradoDefoliacion,
      }),
    onSuccess: () => {
      toast({ title: "Defoliación registrada", description: "El evento se guardó correctamente." });
      queryClient.invalidateQueries({ queryKey: ['plantEvents'] });
      onClose();
    },
    onError: (error: Error) => {
      setSubmitError(error.message);
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const onSubmit = (data: DefoliationFormData) => {
    if (!selectedPlantIds?.length) {
      toast({ variant: "destructive", title: "Selección Requerida", description: "Debes seleccionar al menos una planta." });
      return;
    }
    mutation.mutate(data);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Scissors className="h-5 w-5 text-orange-500" />
          Registrar Defoliación
        </h3>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fecha"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gradoDefoliacion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grado de Defoliación</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccioná un grado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {GRADOS.map(g => (
                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {submitError && (
            <p className="text-sm text-destructive">{submitError}</p>
          )}

          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
            ) : (
              "Registrar Defoliación"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};
