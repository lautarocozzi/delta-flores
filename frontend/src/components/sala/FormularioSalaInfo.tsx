import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { SalaDto } from "@/schemas/DTOSchemas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Home, Sun, Thermometer, Droplets } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sanitizedString, optionalSanitizedString, tipoAmbienteSchema } from "@/modules/sanitization";
import { FormInputField, FormSelectField, type SelectOption } from "@/modules/forms";
import { Switch } from "@/components/ui/switch";

const infoSchema = z.object({
  nombre: sanitizedString({ min: 1, max: 100, capitalize: true }),
  descripcion: optionalSanitizedString({ max: 500 }),
  tipoAmbiente: tipoAmbienteSchema,
  horasLuz: z.string().optional().transform((v) => v?.trim() || undefined),
  humedad: z.coerce.number().min(0).max(100).nullable().optional(),
  temperaturaAmbiente: z.coerce.number().min(-10).max(60).nullable().optional(),
  imagenUrl: z.string().url("URL inválida").nullable().optional().or(z.literal("")),
});

type InfoFormData = z.infer<typeof infoSchema>;

const TIPO_AMBIENTE_OPTIONS: SelectOption[] = [
  { value: "INTERIOR", label: "Interior", icon: Home, iconColor: "text-blue-400" },
  { value: "EXTERIOR", label: "Exterior", icon: Sun, iconColor: "text-orange-400" },
];

interface FormularioSalaInfoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sala: SalaDto;
}

export function FormularioSalaInfo({ open, onOpenChange, sala }: FormularioSalaInfoProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPublic, setIsPublic] = useState(sala.isPublic ?? false);

  const form = useForm<InfoFormData>({
    resolver: zodResolver(infoSchema),
    defaultValues: {
      nombre: sala.nombre ?? "",
      descripcion: sala.descripcion ?? "",
      tipoAmbiente: sala.tipoAmbiente ?? undefined,
      horasLuz: sala.horasLuz ?? "",
      humedad: sala.humedad ?? null,
      temperaturaAmbiente: sala.temperaturaAmbiente ?? null,
      imagenUrl: sala.imagenUrl ?? "",
    },
  });

  // US-10: Reset form + visibility when dialog opens or sala changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (open) {
      setIsPublic(sala.isPublic ?? false);
      form.reset({
        nombre: sala.nombre ?? "",
        descripcion: sala.descripcion ?? "",
        tipoAmbiente: sala.tipoAmbiente ?? undefined,
        horasLuz: sala.horasLuz ?? "",
        humedad: sala.humedad ?? null,
        temperaturaAmbiente: sala.temperaturaAmbiente ?? null,
        imagenUrl: sala.imagenUrl ?? "",
      });
    }
  }, [open, sala]);

  const mutation = useMutation({
    mutationFn: async (data: InfoFormData) => {
      const payload = {
        nombre: data.nombre,
        descripcion: data.descripcion ?? null,
        horasLuz: data.horasLuz ?? null,
        humedad: data.humedad ?? null,
        temperaturaAmbiente: data.temperaturaAmbiente ?? null,
        tipoAmbiente: data.tipoAmbiente ?? null,
        imagenUrl: data.imagenUrl || null,
      };
      // US-11: Update sala info first, then toggle visibility only if needed
      const updated = await apiService.updateSala(sala.id, payload);
      if (isPublic !== sala.isPublic) {
        try {
          await apiService.toggleSalaPublic(sala.id);
        } catch (toggleError: any) {
          // Sala info was saved, but visibility toggle failed
          toast({
            variant: "destructive",
            title: "Visibilidad no actualizada",
            description: "La sala se guardó, pero no se pudo cambiar la visibilidad. " + (toggleError.message || ""),
          });
          // Still invalidate to show saved info
          queryClient.invalidateQueries({ queryKey: ["salas"] });
          onOpenChange(false);
          return;
        }
      }
      return updated;
    },
    onSuccess: () => {
      toast({ title: "Sala Actualizada", description: "Los cambios se guardaron correctamente." });
      queryClient.invalidateQueries({ queryKey: ["salas"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo actualizar la sala." });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Información de la Sala</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <FormInputField control={form.control} name="nombre" label="Nombre" placeholder="Ej: Sala de Vegetativo" required />

            <FormInputField control={form.control} name="descripcion" label="Descripción" placeholder="Ej: Sala principal de crecimiento" optional />

            <FormSelectField control={form.control} name="tipoAmbiente" label="Tipo de Ambiente" options={TIPO_AMBIENTE_OPTIONS} placeholder="Selecciona el tipo..." />

            <FormInputField control={form.control} name="imagenUrl" label="URL de Imagen" placeholder="https://ejemplo.com/imagen.jpg" optional />

            <div className="grid grid-cols-2 gap-4">
              <FormInputField control={form.control} name="horasLuz" label="Horas de Luz" placeholder="Ej: 18/6" optional />
              <div />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="humedad" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Humedad (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={100} placeholder="Ej: 65" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)} />
                  </FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="temperaturaAmbiente" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Temperatura (°C)</FormLabel>
                  <FormControl>
                    <Input type="number" min={-10} max={60} placeholder="Ej: 24" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)} />
                  </FormControl>
                </FormItem>
              )} />
            </div>

            {/* Visibility toggle */}
            <div className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <p className="text-sm font-medium">Sala Pública</p>
                <p className="text-xs text-muted-foreground">Visible en tu perfil para otros usuarios</p>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
