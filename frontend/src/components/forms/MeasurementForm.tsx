import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Thermometer, Loader2, ArrowLeft } from "lucide-react";

const measurementSchema = z.object({
  fecha: z.string().min(1, "La fecha es requerida"),
  temperaturaAmbiente: z.coerce.number().optional(),
  humedad: z.coerce.number().min(0).max(100).optional(),
  horasLuz: z.string().optional(),
  alturaPlanta: z.coerce.number().optional(),
  distanciaLuz: z.coerce.number().optional(),
});

type MeasurementFormData = z.infer<typeof measurementSchema>;

interface MeasurementFormProps {
  onBack: () => void;
  onClose: () => void;
}

export const MeasurementForm = ({ onBack, onClose }: MeasurementFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<MeasurementFormData>({
    resolver: zodResolver(measurementSchema),
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      temperaturaAmbiente: undefined,
      humedad: undefined,
      horasLuz: "",
      alturaPlanta: undefined,
      distanciaLuz: undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: MeasurementFormData) =>
      apiService.createMeasurementEvent({
        plantaIds: [],
        fecha: data.fecha,
        temperaturaAmbiente: data.temperaturaAmbiente,
        humedad: data.humedad,
        horasLuz: data.horasLuz,
        alturaPlanta: data.alturaPlanta,
        distanciaLuz: data.distanciaLuz,
      }),
    onSuccess: () => {
      toast({ title: "Datos ambientales guardados", description: "El registro se guardó correctamente." });
      queryClient.invalidateQueries({ queryKey: ['plantEvents'] });
      onClose();
    },
    onError: (error: Error) => {
      setSubmitError(error.message);
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const onSubmit = (data: MeasurementFormData) => mutation.mutate(data);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Thermometer className="h-5 w-5 text-sky-500" />
          Datos del Ambiente
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

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="temperaturaAmbiente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temperatura (°C)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" placeholder="24.5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="humedad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Humedad (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="100" placeholder="65" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="horasLuz"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horas de Luz</FormLabel>
                  <FormControl>
                    <Input placeholder="18/6" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="distanciaLuz"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Distancia Luz (cm)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="40" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="alturaPlanta"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Altura de Planta (cm)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="30" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}

          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
            ) : (
              "Guardar Datos Ambientales"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};
