import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Droplets, FlaskConical, Loader2, X, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { PlantaDto, SalaDto } from "@/interfaces/Planta";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface NutrienteDto {
  id: number;
  titulo: string;
  descripcion?: string;
}

type RiegoMode = "simple" | "con-nutrientes";

const baseSchema = {
  fecha: z.string().min(1, "La fecha es requerida"),
  plantas_ids: z.array(z.number()).min(1, "Debes seleccionar al menos una planta"),
  phAgua: z.coerce.number().min(0).max(14).optional(),
  ecAgua: z.coerce.number().min(0).optional(),
};

const simpleSchema = z.object(baseSchema);

const nutrientSchema = z.object({
  ...baseSchema,
  nutriente_id: z.string().min(1, "Debes seleccionar un nutriente"),
});

type SimpleFormData = z.infer<typeof simpleSchema>;
type NutrientFormData = z.infer<typeof nutrientSchema>;

interface MassNutrientFormProps {
  onComplete?: () => void;
}

export const MassNutrientForm = ({ onComplete }: MassNutrientFormProps) => {
  const [mode, setMode] = useState<RiegoMode>("simple");
  const [selectedSalaIds, setSelectedSalaIds] = useState<string[]>([]);
  const [filteredPlantas, setFilteredPlantas] = useState<PlantaDto[]>([]);
  const [salaPopoverOpen, setSalaPopoverOpen] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: plantas = [] } = useQuery<PlantaDto[]>({
    queryKey: ['plantas'],
    queryFn: apiService.getPlantas,
    staleTime: 1000 * 60 * 5,
  });

  const { data: salas = [] } = useQuery<SalaDto[]>({
    queryKey: ['salas'],
    queryFn: apiService.getSalas,
    staleTime: 1000 * 60 * 5,
  });

  const { data: nutrientes = [] } = useQuery<NutrienteDto[]>({
    queryKey: ['nutrientes'],
    queryFn: apiService.getNutrientes,
    staleTime: 1000 * 60 * 5,
  });

  const form = useForm<SimpleFormData | NutrientFormData>({
    resolver: zodResolver(mode === "simple" ? simpleSchema : nutrientSchema),
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      plantas_ids: [],
      phAgua: undefined,
      ecAgua: undefined,
      ...(mode === "con-nutrientes" ? { nutriente_id: "" } : {}),
    },
  });

  // Reset form when mode changes
  useEffect(() => {
    form.clearErrors();
  }, [mode, form]);

  // Filter plants when sala selection changes
  useEffect(() => {
    if (!plantas) return;
    let filtered = plantas.filter(p => p.etapa !== 'COSECHADA');
    if (selectedSalaIds.length > 0) {
      filtered = filtered.filter(p => selectedSalaIds.includes(p.sala?.id.toString() || ''));
    }
    setFilteredPlantas(filtered);
  }, [selectedSalaIds, plantas]);

  const wateringMutation = useMutation({
    mutationFn: (data: { fecha: string; plantaIds: number[]; phAgua?: number; ecAgua?: number }) =>
      apiService.createWateringEvent(data),
    onSuccess: (data) => {
      toast({ title: "¡Riego registrado!", description: `Se regaron ${data.plantaIds.length} plantas.` });
      form.reset();
      setSelectedSalaIds([]);
      queryClient.invalidateQueries({ queryKey: ['plantEvents'] });
      onComplete?.();
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const nutrientMutation = useMutation({
    mutationFn: apiService.createNutrientEvent,
    onSuccess: (data) => {
      toast({ title: "¡Aplicación exitosa!", description: `Se aplicó nutriente a ${data.plantaIds.length} plantas.` });
      form.reset();
      setSelectedSalaIds([]);
      queryClient.invalidateQueries({ queryKey: ['plantEvents'] });
      onComplete?.();
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const batchMutation = useMutation({
    mutationFn: async (data: any) => {
      // Fecha común para todos los eventos
      const payload = {
        fecha: data.fecha,
        plantaIds: data.plantas_ids,
        ...(data.phAgua ? { phAgua: data.phAgua } : {}),
        ...(data.ecAgua ? { ecAgua: data.ecAgua } : {}),
      };

      if (mode === "simple") {
        return wateringMutation.mutateAsync(payload);
      } else {
        return nutrientMutation.mutateAsync({
          ...payload,
          nutriente: { id: parseInt(data.nutriente_id) },
        });
      }
    },
    onSuccess: () => {
      // Handled by individual mutations
    },
    onError: () => {
      // Handled by individual mutations
    },
  });

  const onSubmit = (data: SimpleFormData | NutrientFormData) => {
    batchMutation.mutate(data);
  };

  const handleSelectAll = (checked: boolean) => {
    form.setValue("plantas_ids", checked ? filteredPlantas.map(p => p.id) : []);
  };

  const handleToggleSala = (salaId: string) => {
    setSelectedSalaIds(prev =>
      prev.includes(salaId) ? prev.filter(id => id !== salaId) : [...prev, salaId]
    );
    form.setValue("plantas_ids", []);
  };

  const selectedSalaNames = salas
    .filter(s => selectedSalaIds.includes(s.id.toString()))
    .map(s => s.nombre);

  const isPending = wateringMutation.isPending || nutrientMutation.isPending || batchMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex items-center justify-center">
        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as RiegoMode)}
          className="w-full max-w-sm"
        >
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="simple" className="flex items-center gap-2">
              <Droplets className="w-4 h-4" />
              Riego Simple
            </TabsTrigger>
            <TabsTrigger value="con-nutrientes" className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4" />
              Con Nutrientes
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Sala + Fecha */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sala Filter */}
        <FormItem>
          <FormLabel>Filtrar por Sala(s)</FormLabel>
          <Popover open={salaPopoverOpen} onOpenChange={setSalaPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={salaPopoverOpen}
                className="w-full justify-between h-10 font-normal"
              >
                {selectedSalaIds.length === 0 ? (
                  <span className="text-muted-foreground">Todas las salas</span>
                ) : (
                  <span className="truncate">
                    {selectedSalaIds.length === 1
                      ? selectedSalaNames[0]
                      : `${selectedSalaIds.length} salas`
                    }
                  </span>
                )}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <div className="p-2 border-b flex items-center justify-between">
                <span className="text-sm font-medium">Salas</span>
                {selectedSalaIds.length > 0 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setSelectedSalaIds([]); form.setValue("plantas_ids", []); }} className="h-6 px-2 text-xs">
                    <X size={12} className="mr-1" /> Limpiar
                  </Button>
                )}
              </div>
              <div className="max-h-[200px] overflow-y-auto p-1">
                {salas.map((sala) => {
                  const isSelected = selectedSalaIds.includes(sala.id.toString());
                  return (
                    <div
                      key={sala.id}
                      onClick={() => handleToggleSala(sala.id.toString())}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer text-sm",
                        isSelected ? "bg-primary/10 text-primary" : "hover:bg-accent"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 border rounded-sm flex items-center justify-center",
                        isSelected ? "bg-primary border-primary" : "border-input"
                      )}>
                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      {sala.nombre}
                    </div>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </FormItem>

        {/* Fecha */}
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
      </div>

      {/* Water quality fields + Nutrient selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="phAgua"
          render={({ field }) => (
            <FormItem>
              <FormLabel>pH del Agua</FormLabel>
              <FormControl>
                <Input type="number" step="0.1" min="0" max="14" placeholder="6.5" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ecAgua"
          render={({ field }) => (
            <FormItem>
              <FormLabel>EC (µS/cm)</FormLabel>
              <FormControl>
                <Input type="number" step="0.1" placeholder="1.2" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Nutrient selector — only in "con-nutrientes" mode */}
      {mode === "con-nutrientes" && (
        <FormField
          control={form.control}
          name="nutriente_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nutriente a Aplicar</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccioná un nutriente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {nutrientes.map((n) => (
                    <SelectItem key={n.id} value={n.id.toString()}>{n.titulo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Plants Selection */}
      <div className="border rounded-md p-4">
        <div className="flex items-center justify-between mb-4 pb-2 border-b">
          <h4 className="font-medium text-sm">
            Plantas ({form.watch("plantas_ids")?.length || 0} seleccionadas)
          </h4>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              onCheckedChange={handleSelectAll}
              checked={filteredPlantas.length > 0 && form.watch("plantas_ids")?.length === filteredPlantas.length}
            />
            <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
              Seleccionar Todo
            </label>
          </div>
        </div>

        <FormField
          control={form.control}
          name="plantas_ids"
          render={() => (
            <FormItem>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto">
                {filteredPlantas.length === 0 ? (
                  <p className="text-sm text-muted-foreground col-span-full text-center py-4">
                    {selectedSalaIds.length === 0
                      ? "Seleccioná una sala para ver las plantas"
                      : "No hay plantas en las salas seleccionadas."
                    }
                  </p>
                ) : (
                  filteredPlantas.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name="plantas_ids"
                      render={({ field }) => (
                        <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-2 bg-card hover:bg-accent/50 transition-colors">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), item.id])
                                  : field.onChange(field.value?.filter(v => v !== item.id));
                              }}
                            />
                          </FormControl>
                          <div className="leading-none">
                            <FormLabel className="font-normal cursor-pointer text-xs sm:text-sm">
                              <span className="font-bold block">{item.nombre}</span>
                              <span className="text-xs text-muted-foreground">
                                {item.cepaDto?.geneticaParental || 'N/A'}
                              </span>
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  ))
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isPending || (form.watch("plantas_ids")?.length || 0) === 0}
        onClick={form.handleSubmit(onSubmit)}
      >
        {isPending ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
        ) : mode === "simple" ? (
          <><Droplets className="mr-2 h-5 w-5" /> Registrar Riego Masivo</>
        ) : (
          <><FlaskConical className="mr-2 h-5 w-5" /> Aplicar Nutrientes</>
        )}
      </Button>
    </div>
  );
};
