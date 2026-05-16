import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface EventCardProps {
    event: any;
    onEdit: () => void;
    onDelete: () => void;
}

const EVENT_ICONS: Record<string, string> = {
    WATERING: "💧",
    NOTE: "📝",
    NUTRIENT: "🌱",
    PRUNING: "✂️",
    DEFOLIATION: "🍂",
    STAGE_CHANGE: "🔄",
    MEASUREMENT: "📏",
};

const EVENT_COLORS: Record<string, string> = {
    WATERING: "border-blue-200 bg-blue-50 dark:bg-blue-950/20",
    NOTE: "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20",
    NUTRIENT: "border-green-200 bg-green-50 dark:bg-green-950/20",
    PRUNING: "border-purple-200 bg-purple-50 dark:bg-purple-950/20",
    DEFOLIATION: "border-orange-200 bg-orange-50 dark:bg-orange-950/20",
    STAGE_CHANGE: "border-indigo-200 bg-indigo-50 dark:bg-indigo-950/20",
    MEASUREMENT: "border-pink-200 bg-pink-50 dark:bg-pink-950/20",
};

const renderEventDetails = (event: any) => {
    switch (event.eventType) {
        case "WATERING":
            return (
                <div className="flex gap-4 text-sm mt-2">
                    <span>pH: <strong>{event.phAgua || "-"}</strong></span>
                    <span>EC: <strong>{event.ecAgua || "-"}</strong></span>
                    <span>Temp: <strong>{event.tempAgua || "-"}°C</strong></span>
                </div>
            );
        case "NOTE":
            return (
                <div className="mt-2">
                    <p className="text-sm">{event.text || "Sin texto"}</p>
                    {event.mediaUrls && event.mediaUrls.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                            📎 {event.mediaUrls.length} archivo(s) adjunto(s)
                        </p>
                    )}
                </div>
            );
        case "NUTRIENT":
            return (
                <div className="mt-2">
                    <p className="text-sm">
                        <strong>{event.nutriente?.titulo || "Nutriente"}</strong>
                    </p>
                    {event.nutriente?.descripcion && (
                        <p className="text-xs text-muted-foreground">{event.nutriente.descripcion}</p>
                    )}
                </div>
            );
        case "PRUNING":
            return (
                <div className="mt-2">
                    <p className="text-sm">Tipo: <strong>{event.tipoPoda || "-"}</strong></p>
                </div>
            );
        case "STAGE_CHANGE":
            return (
                <div className="mt-2">
                    <p className="text-sm">Nueva Etapa: <strong>{event.nuevaEtapa || "-"}</strong></p>
                </div>
            );
        case "MEASUREMENT":
            return (
                <div className="flex flex-wrap gap-3 text-sm mt-2">
                    <span>Horas Luz: <strong>{event.horasLuz || "-"}</strong></span>
                    <span>Humedad: <strong>{event.humedad || "-"}%</strong></span>
                    <span>Temp: <strong>{event.temperaturaAmbiente || "-"}°C</strong></span>
                    <span>Altura: <strong>{event.alturaPlanta || "-"}cm</strong></span>
                </div>
            );
        default:
            return null;
    }
};

export const EventCard = ({ event, onEdit, onDelete }: EventCardProps) => {
    const icon = EVENT_ICONS[event.eventType] || "📌";
    const colorClass = EVENT_COLORS[event.eventType] || "border-gray-200 bg-gray-50";

    return (
        <Card className={`${colorClass} border-l-4`}>
            <CardContent className="p-4">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{icon}</span>
                            <h4 className="font-semibold capitalize">
                                {event.eventType.toLowerCase().replace("_", " ")}
                            </h4>
                        </div>

                        {/* Fecha */}
                        <p className="text-xs text-muted-foreground mb-2">
                            {format(new Date(event.fecha), "dd MMM yyyy, HH:mm", { locale: es })}
                        </p>

                        {/* Detalles específicos */}
                        {renderEventDetails(event)}
                    </div>

                    {/* Botones siempre visibles */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onEdit}
                            className="h-8 w-8 p-0"
                        >
                            <Pencil size={14} />
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={onDelete}
                            className="h-8 w-8 p-0"
                        >
                            <Trash2 size={14} />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
