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
import { Leaf, Loader2, ArrowLeft } from "lucide-react";

const stageSchema = z.object({
  fecha: z.string().min(1, "La fecha es requerida"),
  nuevaEtapa: z.string().min(1, "Seleccioná una etapa"),
});

type StageFormData = z.infer<typeof stageSchema>;

const ETAPAS = [
  { value: "GERMINACION", label: "Germinación" },
  { value: "PLANTULA", label: "Plántula" },
  { value: "VEGETACION", label: "Vegetación" },
  { value: "FLORACION", label: "Floración" },
  { value: "COSECHADA", label: "Cosechada" },
];

interface StageChangeFormProps {
  onBack: () => void;
  onClose: () => void;
  selectedPlantIds?: number[];
}

export const StageChangeForm = ({ onBack, onClose, selectedPlantIds }: StageChangeFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<StageFormData>({
    resolver: zodResolver(stageSchema),
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      nuevaEtapa: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: StageFormData) =>
      apiService.createStageChangeEvent({
        plantaIds: selectedPlantIds || [],
        fecha: data.fecha,
        nuevaEtapa: data.nuevaEtapa,
      }),
    onSuccess: () => {
      toast({ title: "Etapa actualizada", description: "El cambio de etapa se guardó." });
      queryClient.invalidateQueries({ queryKey: ['plantEvents'] });
      queryClient.invalidateQueries({ queryKey: ['plantas'] });
      onClose();
    },
    onError: (error: Error) => {
      setSubmitError(error.message);
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const onSubmit = (data: StageFormData) => {
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
          <Leaf className="h-5 w-5 text-green-500" />
          Cambiar Etapa
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
            name="nuevaEtapa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nueva Etapa</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccioná etapa" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ETAPAS.map(e => (
                      <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}

          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
            ) : (
              "Cambiar Etapa"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};
