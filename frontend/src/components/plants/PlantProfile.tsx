import { PlantaDto } from "@/interfaces/Planta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Flower2, MapPin, Calendar, TrendingUp, Eye, EyeOff, Sprout, Camera } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";

interface PlantProfileProps {
    planta: PlantaDto;
    onEdit: () => void;
    onDelete: () => void;
}

// Etapa icons using Sprout (consistent style)
const ETAPA_ICONS: Record<string, React.ReactNode> = {
    GERMINACION: <Sprout className="text-primary" size={20} />,
    PLANTIN: <Sprout className="text-primary" size={20} />,
    VEGETACION: <Sprout className="text-primary" size={20} />,
    FLORACION: <Sprout className="text-primary" size={20} />,
    COSECHADA: <Sprout className="text-primary" size={20} />,
};

const ETAPA_LABELS: Record<string, string> = {
    GERMINACION: "Germinación",
    PLANTIN: "Plantín",
    VEGETACION: "Vegetación",
    FLORACION: "Floración",
    COSECHADA: "Cosechada",
};

// Helper to get plant image: custom URL > tipoAmbiente default > generic default
const getPlantImage = (planta: PlantaDto): string => {
    if (planta.imagenUrl) return planta.imagenUrl;
    const tipoAmbiente = (planta.sala as any)?.tipoAmbiente;
    if (tipoAmbiente === 'EXTERIOR') {
        return '/images/flower-outdoor.png';
    }
    return '/images/flower-indoor.png';
};

export const PlantProfile = ({ planta, onEdit, onDelete }: PlantProfileProps) => {
    const diasActiva = differenceInDays(new Date(), new Date(planta.fechaCreacion));
    const etapaIcon = ETAPA_ICONS[planta.etapa] || <Sprout className="text-primary" size={20} />;
    const etapaLabel = ETAPA_LABELS[planta.etapa] || planta.etapa;
    const plantImage = getPlantImage(planta);
    const [imageHover, setImageHover] = useState(false);

    return (
        <Card className="relative overflow-hidden border-2 border-primary/50 hover:border-primary/80 transition-colors">
            {/* Background image with 50% opacity */}
            <div
                className="absolute inset-0 bg-cover bg-center opacity-50"
                style={{ backgroundImage: `url(/FONDO_CARDS.png)` }}
            />
            {/* Overlay for content readability */}
            <div className="absolute inset-0 bg-gradient-to-br from-background/80 to-background/60" />

            <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2">
                    <Sprout className="text-primary" size={24} />
                    Perfil de Planta
                </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Left side: Plant info */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Genética - using Flower2 icon */}
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/20 rounded-lg">
                                <Flower2 className="text-primary" size={20} />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Genética</p>
                                <p className="font-semibold">{planta.cepaDto?.geneticaParental || "Desconocida"}</p>
                            </div>
                        </div>

                        {/* Sala */}
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/20 rounded-lg">
                                <MapPin className="text-primary" size={20} />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Sala</p>
                                <p className="font-semibold">{planta.sala?.nombre || "Sin sala"}</p>
                                {planta.ubicacion && (
                                    <p className="text-xs text-muted-foreground">📍 {planta.ubicacion}</p>
                                )}
                            </div>
                        </div>

                        {/* Etapa - using Sprout icon (consistent) */}
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/20 rounded-lg">
                                {etapaIcon}
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Etapa Actual</p>
                                <p className="font-semibold">{etapaLabel}</p>
                            </div>
                        </div>

                        {/* Días Activa */}
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

                        {/* Producción */}
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

                        {/* Visibilidad */}
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/20 rounded-lg">
                                {planta.isPublic ? (
                                    <Eye className="text-primary" size={20} />
                                ) : (
                                    <EyeOff className="text-primary" size={20} />
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Visibilidad</p>
                                <p className="font-semibold">{planta.isPublic ? "🟢 Pública" : "🔒 Privada"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right side: Plant image + action buttons */}
                    <div className="flex flex-col items-center gap-4 md:w-56 lg:w-64">
                        {/* Plant image - visible on all screen sizes */}
                        <div
                            className="relative w-full h-40 md:h-48 rounded-lg overflow-hidden border-2 border-primary/30 cursor-pointer group"
                            onMouseEnter={() => setImageHover(true)}
                            onMouseLeave={() => setImageHover(false)}
                        >
                            <img
                                src={plantImage}
                                alt={planta.nombre}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
                            {/* Hover overlay for changing image */}
                            <div className={`absolute inset-0 bg-background/70 flex items-center justify-center transition-opacity ${imageHover ? 'opacity-100' : 'opacity-0'}`}>
                                <div className="text-center">
                                    <Camera className="mx-auto text-primary mb-1" size={24} />
                                    <span className="text-xs text-muted-foreground">Cambiar foto</span>
                                </div>
                            </div>
                        </div>

                        {/* Action buttons - centered below image */}
                        <div className="flex gap-2 w-full justify-center">
                            <Button variant="outline" size="sm" onClick={onEdit} className="border-primary/50 hover:border-primary flex-1 max-w-[120px]">
                                <Pencil size={16} className="mr-1 text-primary" />
                                Editar
                            </Button>
                            <Button variant="destructive" size="sm" onClick={onDelete} className="flex-1 max-w-[120px]">
                                <Trash2 size={16} className="mr-1" />
                                Eliminar
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
