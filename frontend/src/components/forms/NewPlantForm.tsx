import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { Plus, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { SalaDto, CepaDto, ZonaDto, PlantaDto } from "@/interfaces/Planta";
import { useToast } from "@/hooks/use-toast";
import { FormInputField } from "./FormInputField";
import { FormCheckboxField } from "./FormCheckboxField";
import ZoneGrid from "@/components/plants/ZoneGrid";
import type { CellClickPayload } from "@/components/plants/ZoneGrid";
import { Badge } from "@/components/ui/badge";



const newPlantSchema = z.object({
  genetica_id: z.string().min(1, "La genética es requerida"),
  etiqueta: z.string().min(1, "La etiqueta es requerida"),
  fecha_siembra: z.string().min(1, "La fecha de siembra es requerida"),
  espacio_id: z.string().min(1, "El espacio es requerido"),
  etapa_enum: z.enum(['GERMINACION', 'PLANTIN', 'VEGETACION', 'FLORACION', 'COSECHADA']),
  isPublic: z.boolean().optional(),
  produccion: z.string().optional(),
  ubicacion: z.string().optional(),
});

type NewPlantFormData = z.infer<typeof newPlantSchema>;

interface NewPlantFormProps {
  onBack: () => void;
  onClose: () => void;
  contextSalaId?: string; // Optional context from parent (e.g., DirectAccessMenu or SalaDetailPage)
}

const ETAPAS_OPTIONS = [
  { id: "GERMINACION", nombre: "Germinación" },
  { id: "PLANTIN", nombre: "Plántula" },
  { id: "VEGETACION", nombre: "Vegetativo" },
  { id: "FLORACION", nombre: "Floración" },
];

export const NewPlantForm = ({ onBack, onClose, contextSalaId }: NewPlantFormProps) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [plantId, setPlantId] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast(); // 2. Inicializar el hook

  const { data: salas = [] } = useQuery<SalaDto[]>({
    queryKey: ['salas'],
    queryFn: apiService.getSalas,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const { data: cepas = [] } = useQuery<CepaDto[]>({
    queryKey: ['cepas'],
    queryFn: apiService.getCepas,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const form = useForm<NewPlantFormData>({
    resolver: zodResolver(newPlantSchema),
    defaultValues: {
      genetica_id: "",
      etiqueta: "",
      fecha_siembra: new Date().toISOString().split("T")[0],
      espacio_id: contextSalaId || "", // Preload with context if provided
      etapa_enum: "VEGETACION",
      isPublic: false,
      produccion: "",
      ubicacion: "",
    },
  });

  // Update form when contextSalaId changes
  useEffect(() => {
    if (contextSalaId) {
      form.setValue('espacio_id', contextSalaId);
    }
  }, [contextSalaId, form]);

  // ── Zone / Grid state ──────────────────────────────────────
  const [zonaId, setZonaId] = useState<number | null>(null);
  const [columnaEnZona, setColumnaEnZona] = useState<number | null>(null);
  const [filaEnZona, setFilaEnZona] = useState<number | null>(null);
  const [autoUbicacion, setAutoUbicacion] = useState("");

  const selectedEspacioId = form.watch("espacio_id");

  // Fetch zonas when sala changes
  const { data: zonas = [], isLoading: isLoadingZonas } = useQuery<ZonaDto[]>({
    queryKey: ['zonas', 'sala', selectedEspacioId],
    queryFn: () => apiService.getZonasBySala(Number(selectedEspacioId)),
    enabled: !!selectedEspacioId,
  });

  // Fetch all plants in the sala (bulk) to build occupied cells map — avoids N+1 per-zona HTTP calls
  const { data: salaPlantas = [] } = useQuery<PlantaDto[]>({
    queryKey: ['plantas', 'sala', selectedEspacioId],
    queryFn: () => apiService.getPlantasBySala(Number(selectedEspacioId)),
    enabled: !!selectedEspacioId,
  });

  // Build occupied cells map from sala-level plant data
  const occupiedCells = useMemo(() => {
    const map: Record<string, { plantaNombre: string; plantaId: number }> = {};
    salaPlantas.forEach((planta) => {
      if (planta.zonaId != null && planta.columnaEnZona != null && planta.filaEnZona != null) {
        const key = `${planta.zonaId}-${planta.columnaEnZona}-${planta.filaEnZona}`;
        map[key] = { plantaNombre: planta.nombre, plantaId: planta.id };
      }
    });
    return map;
  }, [salaPlantas]);

  // Reset grid selection when sala changes
  useEffect(() => {
    setZonaId(null);
    setColumnaEnZona(null);
    setFilaEnZona(null);
    setAutoUbicacion("");
  }, [selectedEspacioId]);

  // Re-generate ubicacion preview when cell changes
  useEffect(() => {
    if (zonaId != null && columnaEnZona != null && filaEnZona != null) {
      const zona = zonas.find((z) => z.id === zonaId);
      if (zona) {
        setAutoUbicacion(`${zona.nombre}-F${filaEnZona + 1}-C${columnaEnZona + 1}`);
      }
    } else {
      setAutoUbicacion("");
    }
  }, [zonaId, columnaEnZona, filaEnZona, zonas]);

  const handleCellSelect = useCallback(
    (cell: CellClickPayload) => {
      setZonaId(cell.zonaId);
      setColumnaEnZona(cell.columna);
      setFilaEnZona(cell.fila);
    },
    [],
  );

  const createPlantaMutation = useMutation({
    mutationFn: apiService.createPlanta,
    onSuccess: (data) => {
      toast({
        title: "¡Planta Registrada!",
        description: `La planta ${data.nombre} (ID: ${data.id}) ha sido creada con éxito.`,
      });
      setPlantId(data.id.toString());
      // Save plant data for confirmation display
      const selectedCepa = cepas.find(c => c.id === data.cepaDto?.id);
      const selectedSala = salas.find(s => s.id === data.sala?.id);
      setCreatedPlantData({
        nombre: data.nombre,
        genetica: selectedCepa?.geneticaParental || data.cepaDto?.geneticaParental || 'Desconocida',
        sala: selectedSala?.nombre || data.sala?.nombre || 'Sin sala',
        etapa: ETAPAS_OPTIONS.find(e => e.id === data.etapa)?.nombre || data.etapa,
      });
      setIsSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['plantas'] });
    },
    onError: (error: Error) => {
      // 3. Reemplazar alert con toast de error
      toast({
        variant: "destructive",
        title: "Error al crear la planta",
        description: error.message || "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
      });
    }
  });

  const onSubmit = (data: NewPlantFormData) => {
    // Use auto-generated ubicacion if grid was used, otherwise fall back to free-text
    const ubicacion = autoUbicacion || data.ubicacion || null;

    const payload = {
      nombre: data.etiqueta,
      etapa: data.etapa_enum,
      fechaCreacion: data.fecha_siembra,
      salaId: parseInt(data.espacio_id),
      cepaId: parseInt(data.genetica_id),
      produccion: data.produccion ? parseInt(data.produccion) : 0,
      isPublic: data.isPublic || false,
      ubicacion,
      // Only include zone fields if grid cell was selected
      ...(zonaId != null && columnaEnZona != null && filaEnZona != null
        ? { zonaId, columnaEnZona, filaEnZona }
        : {}),
    };

    createPlantaMutation.mutate(payload);
  };

  const handleReset = () => {
    form.reset();
    setIsSubmitted(false);
    setPlantId("");
  };

  // Store created plant data for confirmation display
  const [createdPlantData, setCreatedPlantData] = useState<{
    nombre: string;
    genetica: string;
    sala: string;
    etapa: string;
  } | null>(null);

  // Navigate to plant to add event
  const handleAddEvent = () => {
    if (plantId) {
      onClose();
      navigate(`/plant/${plantId}`);
    }
  };

  if (isSubmitted && createdPlantData) {
    return (
      <div className="relative overflow-hidden rounded-xl">
        {/* Background with FONDO_CARDS */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url(/FONDO_CARDS.png)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/70 to-background/50" />

        <div className="relative z-10 flex flex-col items-center justify-center p-8 space-y-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 border-2 border-primary">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>

          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold text-foreground">¡Planta Registrada!</h3>

            {/* Plant info card */}
            <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-primary/30 text-left space-y-2 min-w-[280px]">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">ID:</span>
                <span className="font-mono font-semibold text-primary">#{plantId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Nombre:</span>
                <span className="font-semibold text-foreground">{createdPlantData.nombre}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Genética:</span>
                <span className="font-medium text-foreground">{createdPlantData.genetica}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Sala:</span>
                <span className="font-medium text-foreground">{createdPlantData.sala}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Etapa:</span>
                <span className="font-medium text-foreground">{createdPlantData.etapa}</span>
              </div>
            </div>
          </div>

          {/* Action buttons - all with same style */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
            <Button onClick={handleReset} variant="outline" className="flex-1 border-primary/50 hover:border-primary">
              <Plus className="mr-2 h-4 w-4" />
              Crear Otra
            </Button>
            <Button onClick={handleAddEvent} variant="outline" className="flex-1 border-primary/50 hover:border-primary">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Evento
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1 border-primary/50 hover:border-primary">
              Ir al Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h3 className="text-xl font-bold text-foreground">Nueva Planta</h3>
          <p className="text-sm text-muted-foreground">Registra una nueva planta en el cultivo</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="etiqueta"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Etiqueta / Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: GEL-005" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="genetica_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Genética</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una genética" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cepas.length > 0 ? cepas.map((gen) => (
                      <SelectItem key={gen.id} value={gen.id.toString()}>
                        {gen.abreviatura ? `${gen.abreviatura} - ` : ''}{gen.geneticaParental} ({gen.dominancia})
                      </SelectItem>
                    )) : <SelectItem value="none" disabled>No hay cepas registradas</SelectItem>}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fecha_siembra"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Inicio</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="espacio_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Espacio / Sala</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un espacio" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {salas.length > 0 ? salas.map((esp) => (
                      <SelectItem key={esp.id} value={esp.id.toString()}>
                        {esp.nombre}
                      </SelectItem>
                    )) : <SelectItem value="none" disabled>No hay salas registradas</SelectItem>}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="etapa_enum"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Etapa Inicial</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una etapa" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ETAPAS_OPTIONS.map((etapa) => (
                      <SelectItem key={etapa.id} value={etapa.id}>
                        {etapa.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Zone Grid or free-text ubicacion */}
          {selectedEspacioId ? (
            isLoadingZonas ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Cargando zonas...</span>
              </div>
            ) : zonas.length > 0 ? (
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium">Ubicación en Sala</span>
                  <p className="text-xs text-muted-foreground">Hacé clic en una celda libre para ubicar la planta</p>
                </div>

                <div className="max-h-[400px] overflow-auto rounded-lg border">
                  <ZoneGrid
                    zonas={zonas}
                    occupiedCells={occupiedCells}
                    onCellSelect={handleCellSelect}
                    selectedCell={
                      zonaId != null ? { zonaId, columna: columnaEnZona!, fila: filaEnZona! } : null
                    }
                    editable
                  />
                </div>

                {/* Ubicacion preview badge */}
                {autoUbicacion && (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Ubicación generada</span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        ({columnaEnZona}, {filaEnZona})
                      </Badge>
                    </div>
                    <code className="block text-sm font-mono text-primary">
                      {autoUbicacion}
                    </code>
                  </div>
                )}
              </div>
            ) : (
              <FormInputField
                control={form.control}
                name="ubicacion"
                label="Ubicación en Sala"
                placeholder="Ej: Estante 2, Esquina izquierda"
                optional
              />
            )
          ) : (
            <FormInputField
              control={form.control}
              name="ubicacion"
              label="Ubicación en Sala"
              placeholder="Ej: Estante 2, Esquina izquierda"
              optional
            />
          )}

          <FormInputField
            control={form.control}
            name="produccion"
            label="Producción Esperada (gramos)"
            type="number"
            placeholder="Ej: 150"
            optional
          />

          <FormCheckboxField
            control={form.control}
            name="isPublic"
            label="Planta Pública"
            description="Permitir que otros usuarios vean esta planta"
          />

          <Button type="submit" className="w-full" size="lg" disabled={createPlantaMutation.isPending}>
            {createPlantaMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-5 w-5" />
            )}
            {createPlantaMutation.isPending ? "Registrando..." : "Registrar Planta"}
          </Button>
        </form>
      </Form>
    </div>
  );
};
