import { useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, CheckCircle, ArrowLeft, Loader2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { ZoneItemEditor, getZoneLetter } from "@/components/sala/ZoneItemEditor";

// ─── Zone grid schema ────────────────────────────────────────
const zoneSchema = z.object({
  posicionX: z.coerce.number().min(0).max(100).refine(val => val % 5 === 0, "Debe ser múltiplo de 5").default(0),
  posicionY: z.coerce.number().min(0).max(100).refine(val => val % 5 === 0, "Debe ser múltiplo de 5").default(0),
  columnas: z.coerce.number().min(1, "Mínimo 1").max(20, "Máximo 20"),
  filas: z.coerce.number().min(1, "Mínimo 1").max(20, "Máximo 20"),
});

const newSalaConZonasSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  zonas: z.array(zoneSchema).max(25, "Máximo 25 zonas").optional().default([]),
});

type NewSalaConZonasData = z.infer<typeof newSalaConZonasSchema>;

interface NewSalaFormProps {
  onBack: () => void;
  onClose: () => void;
}

// ─── Main Component ───────────────────────────────────────────
export const NewSalaForm = ({ onBack, onClose }: NewSalaFormProps) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdSalaId, setCreatedSalaId] = useState<number | null>(null);
  const [isCreatingZonas, setIsCreatingZonas] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<NewSalaConZonasData>({
    resolver: zodResolver(newSalaConZonasSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      zonas: [],
    },
  });

  const { control, setValue, getValues } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "zonas",
  });

  // Watch zonas for count display
  const zonas = useWatch({ control, name: "zonas" });

  // ─── Mutation: create sala ─────────────────────────────────
  const createSalaMutation = useMutation({
    mutationFn: (data: { nombre: string; descripcion?: string }) =>
      apiService.createSala(data),
    onSuccess: async (sala) => {
      setCreatedSalaId(sala.id);
      const zonasData = getValues("zonas");
      if (zonasData && zonasData.length > 0) {
        setIsCreatingZonas(true);
        try {
          await apiService.createZonasBatch(sala.id, zonasData);
        } catch (error: any) {
          toast({
            variant: "destructive",
            title: "Error al crear zonas",
            description: error.message || "La sala se creó pero las zonas fallaron. Podés agregarlas desde la sala.",
          });
        } finally {
          setIsCreatingZonas(false);
        }
      }
      finishSuccess(sala.nombre);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error al crear la sala",
        description: error.message || "Ocurrió un error inesperado.",
      });
    },
  });

  const finishSuccess = (nombre: string) => {
    toast({
      title: "¡Sala Creada!",
      description: `La sala '${nombre}' ha sido registrada.`,
    });
    setIsSubmitted(true);
    queryClient.invalidateQueries({ queryKey: ["salas"] });
  };

  const isLoading = createSalaMutation.isPending || isCreatingZonas;

  const onSubmit = (data: NewSalaConZonasData) => {
    createSalaMutation.mutate({
      nombre: data.nombre,
      descripcion: data.descripcion || undefined,
    });
  };

  const handleReset = () => {
    form.reset();
    setIsSubmitted(false);
  };

  // ─── Submitted view ─────────────────────────────────────────
  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-foreground">¡Sala Creada!</h3>
          <p className="text-muted-foreground">
            {zonas && zonas.length > 0
              ? `Tu sala con ${zonas.length} zona${zonas.length !== 1 ? "s" : ""} está lista.`
              : "Tu nuevo espacio de cultivo está listo."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <Button onClick={handleReset} variant="outline" className="flex-1">
            <Plus className="mr-2 h-4 w-4" />
            Crear Otra
          </Button>
          {createdSalaId && (
            <Button
              onClick={() => {
                localStorage.setItem("salas-selected-sala-id", createdSalaId.toString());
                onClose();
                navigate('/profile');
              }}
              variant="outline"
              className="flex-1"
            >
              <Eye className="mr-2 h-4 w-4" />
              Ver Sala
            </Button>
          )}
          <Button onClick={onClose} className="flex-1">
            Volver
          </Button>
        </div>
      </div>
    );
  }

  // ─── Form ───────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h3 className="text-xl font-bold text-foreground">Nueva Sala</h3>
          <p className="text-sm text-muted-foreground">Define un nuevo espacio de cultivo con sus zonas</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Nombre */}
          <FormField
            control={control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de la Sala</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Descripción */}
          <FormField
            control={control}
            name="descripcion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea className="resize-none h-20" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Zonas section ────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <FormLabel className="text-base font-semibold">Zonas</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={fields.length >= 25}
                onClick={() =>
                  append({ posicionX: 0, posicionY: 0, columnas: 3, filas: 3 })
                }
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Agregar Zona
              </Button>
            </div>

            {fields.length === 0 && (
              <p className="text-xs text-muted-foreground py-2">
                Sin zonas — podés agregarlas después desde la sala.
              </p>
            )}

            {/* Zone list — each item manages its own drag state */}
            <div className="space-y-4">
              {fields.map((field, index) => (
                <ZoneItemEditor
                  key={field.id}
                  index={index}
                  control={control}
                  setValue={setValue}
                  zonePath={`zonas.${index}`}
                  onRemove={() => remove(index)}
                />
              ))}
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-5 w-5" />
            )}
            {isCreatingZonas
              ? "Creando zonas..."
              : zonas && zonas.length > 0
              ? `Crear Sala con ${zonas.length} Zona${zonas.length !== 1 ? "s" : ""}`
              : "Crear Sala"}
          </Button>
        </form>
      </Form>
    </div>
  );
};
