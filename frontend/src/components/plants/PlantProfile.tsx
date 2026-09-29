import { PlantaDto } from "@/interfaces/Planta";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MoreVertical, Pencil, Trash2, Sprout, Flower2, MapPin, Calendar, TrendingUp, Camera } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface PlantProfileProps {
    planta: PlantaDto;
    onEdit: () => void;
    onDelete: () => void;
}

const ETAPA_LABELS: Record<string, string> = {
    GERMINACION: "Germinación",
    PLANTIN: "Plantín",
    VEGETACION: "Vegetación",
    FLORACION: "Floración",
    COSECHADA: "Cosechada",
};

const getPlantImage = (planta: PlantaDto): string => {
    if (planta.imagenUrl) return planta.imagenUrl;
    const tipoAmbiente = (planta.sala as any)?.tipoAmbiente;
    if (tipoAmbiente === 'EXTERIOR') return '/images/flower-outdoor.png';
    return '/images/flower-indoor.png';
};

export const PlantProfile = ({ planta, onEdit, onDelete }: PlantProfileProps) => {
    const diasActiva = differenceInDays(new Date(), new Date(planta.fechaCreacion));
    const etapaLabel = ETAPA_LABELS[planta.etapa] || planta.etapa;
    const plantImage = getPlantImage(planta);
    const [imageHover, setImageHover] = useState(false);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const toggleVisibility = useMutation({
        mutationFn: () => apiService.togglePublicStatus(planta.id),
        onSuccess: (updated) => {
            queryClient.setQueryData(['planta', planta.id.toString()], updated);
            toast({ title: "Visibilidad actualizada", description: updated.isPublic ? "Planta ahora es pública." : "Planta ahora es privada." });
        },
        onError: () => {
            toast({ variant: "destructive", title: "Error", description: "No se pudo cambiar la visibilidad." });
        },
    });

    return (
        <Card className="relative overflow-hidden border-2 border-primary/50 hover:border-primary/80 transition-colors">
            <div className="absolute inset-0 bg-cover bg-center opacity-50" style={{ backgroundImage: `url(/FONDO_CARDS.png)` }} />
            <div className="absolute inset-0 bg-gradient-to-br from-background/80 to-background/60" />

            <CardHeader className="relative z-10 pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sprout className="text-primary" size={22} />
                        <h2 className="text-lg font-bold">{planta.nombre}</h2>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded-md hover:bg-muted transition-colors" aria-label="Acciones de planta">
                                <MoreVertical size={18} className="text-muted-foreground" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onEdit}>
                                <Pencil size={14} className="mr-2" />
                                Editar
                            </DropdownMenuItem>
                            <div className="flex items-center justify-between px-2 py-1.5 cursor-default" onClick={(e) => e.stopPropagation()}>
                                <span className="text-sm">Visibilidad</span>
                                <Switch
                                    checked={planta.isPublic}
                                    onCheckedChange={() => toggleVisibility.mutate()}
                                />
                            </div>
                            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                                <Trash2 size={14} className="mr-2" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardContent className="relative z-10 pt-0">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/20 rounded-lg">
                                <Calendar className="text-primary" size={20} />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Tiempo Activa</p>
                                <p className="font-semibold">{diasActiva} días</p>
                                <p className="text-xs text-muted-foreground">
                                    Desde {format(new Date(planta.fechaCreacion), "dd MMM yyyy", { locale: es })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/20 rounded-lg">
                                <MapPin className="text-primary" size={20} />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Sala</p>
                                <p className="font-semibold">{planta.sala?.nombre || "Sin sala"}</p>
                                {planta.ubicacion && <p className="text-xs text-muted-foreground">📍 {planta.ubicacion}</p>}
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/20 rounded-lg">
                                <Sprout className="text-primary" size={20} />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Etapa Actual</p>
                                <p className="font-semibold">{etapaLabel}</p>
                            </div>
                        </div>

                        {planta.produccion > 0 && (
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary/20 rounded-lg">
                                    <TrendingUp className="text-primary" size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Producción Estimada</p>
                                    <p className="font-semibold">{planta.produccion}g</p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/20 rounded-lg">
                                <Flower2 className="text-primary" size={20} />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Genética</p>
                                <p className="font-semibold">{planta.cepaDto?.geneticaParental || "Desconocida"}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-4 md:w-56 lg:w-64">
                        <div
                            className="relative w-full h-40 md:h-48 rounded-lg overflow-hidden border-2 border-primary/30 cursor-pointer group"
                            onMouseEnter={() => setImageHover(true)}
                            onMouseLeave={() => setImageHover(false)}
                        >
                            <img src={plantImage} alt={planta.nombre} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
                            <div className={`absolute inset-0 bg-background/70 flex items-center justify-center transition-opacity ${imageHover ? 'opacity-100' : 'opacity-0'}`}>
                                <div className="text-center">
                                    <Camera className="mx-auto text-primary mb-1" size={24} />
                                    <span className="text-xs text-muted-foreground">Cambiar foto</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
