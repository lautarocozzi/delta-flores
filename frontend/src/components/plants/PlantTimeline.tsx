import { groupEventsByWeek } from "@/utils/timelineUtils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Droplets, Scissors, PenLine, Camera, Activity, Ruler, MoreVertical, Trash2, Edit2, Leaf, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PlantTimelineProps {
    events: any[];
    creationDate: string;
    onEditEvent: (event: any) => void;
    onDeleteEvent: (event: any) => void;
}

const getEventIcon = (type: string) => {
    switch (type?.toUpperCase()) {
        case 'WATERING': return <Droplets className="w-5 h-5 text-blue-500" />;
        case 'PRUNING': return <Scissors className="w-5 h-5 text-orange-500" />;
        case 'NOTE': return <PenLine className="w-5 h-5 text-gray-500" />;
        case 'PHOTO': return <Camera className="w-5 h-5 text-purple-500" />;
        case 'STAGE_CHANGE': return <RefreshCw className="w-5 h-5 text-pink-500" />;
        case 'MEASUREMENT': return <Ruler className="w-5 h-5 text-yellow-500" />;
        case 'NUTRIENT': return <Leaf className="w-5 h-5 text-green-600" />;
        default: return <Activity className="w-5 h-5" />;
    }
};

const EventDetails = ({ event }: { event: any }) => {
    switch (event.eventType?.toUpperCase()) {
        case 'WATERING':
            return (
                <div className="flex gap-4 text-xs mt-1 text-muted-foreground">
                    {event.phAgua && <span>pH: <span className="font-semibold text-foreground">{event.phAgua}</span></span>}
                    {event.ecAgua && <span>EC: <span className="font-semibold text-foreground">{event.ecAgua}</span></span>}
                    {event.tempAgua && <span>Temp: <span className="font-semibold text-foreground">{event.tempAgua}°C</span></span>}
                </div>
            );
        case 'PRUNING':
            return <p className="text-sm mt-1">Tipo: <span className="font-medium">{event.tipoPoda}</span></p>;
        case 'NUTRIENT':
            return <p className="text-sm mt-1">Producto: <span className="font-medium">{event.nutriente?.titulo}</span></p>;
        case 'STAGE_CHANGE':
            return <p className="text-sm mt-1">Nueva Etapa: <span className="font-bold text-primary">{event.nuevaEtapa}</span></p>;
        case 'NOTE':
            return <p className="text-sm italic mt-1 text-muted-foreground">"{event.text || event.observacion}"</p>; // Handle both fields if inconsistent
        case 'PHOTO':
            return (
                <div className="mt-2">
                    {event.description && <p className="text-sm mb-2">{event.description}</p>}
                    {event.mediaUrls && event.mediaUrls.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {event.mediaUrls.map((url: string, idx: number) => {
                                // ✅ FIXED: Usar baseURL del scope superior (línea 73)
                                const baseURL = import.meta.env.VITE_BACKEND_URL || "";
                                return (
                                    <img
                                        key={idx}
                                        src={`${baseURL}${url}`}
                                        alt="Event"
                                        className="h-24 w-24 object-cover rounded-md border"
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        default:
            return null;
    }
}

export default function PlantTimeline({ events, creationDate, onEditEvent, onDeleteEvent }: PlantTimelineProps) {
    const weeks = groupEventsByWeek(events, creationDate);
    const baseURL = import.meta.env.VITE_BACKEND_URL || "";

    if (!weeks || weeks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
                <Activity className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">Sin historia aún</h3>
                <p className="text-muted-foreground">Registra el primer evento para comenzar la línea de tiempo.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 relative border-l-2 border-border ml-4 sm:ml-6 pl-6 sm:pl-8 py-4">
            {weeks.map((week) => (
                <div key={week.weekNumber} className="relative fade-in-up">
                    {/* Week Marker */}
                    <div className="absolute -left-[39px] sm:-left-[47px] top-0 flex flex-col items-center">
                        <div className="w-5 h-5 rounded-full bg-primary border-4 border-background shadow-sm" />
                        <div className="h-full w-0.5 bg-border mt-1 hidden" /> {/* Optional connector enhancement */}
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center flex-wrap gap-2 mb-4">
                            <Badge variant="outline" className="text-lg font-bold px-3 py-1 bg-background">
                                Semana {week.weekNumber}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                {week.startDate} - {week.endDate}
                            </span>
                            <Badge variant={week.stage === 'Floración' ? "destructive" : "secondary"} className="ml-auto">
                                {week.stage}
                            </Badge>
                        </div>

                        <div className="grid gap-3">
                            {week.events.map((event) => (
                                <Card key={event.id} className="relative group hover:shadow-md transition-all duration-200 border-l-4" style={{ borderLeftColor: 'hsl(var(--primary))' }}>
                                    <CardContent className="p-4 flex gap-4">
                                        <div className="mt-1">
                                            {getEventIcon(event.eventType)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold text-sm">
                                                        {event.eventType === 'NOTE' ? (event.title || 'Nota') :
                                                            event.eventType === 'PHOTO' ? 'Registro Fotográfico' :
                                                                event.eventType === 'STAGE_CHANGE' ? 'Cambio de Etapa' :
                                                                    event.eventType === 'WATERING' ? 'Riego' :
                                                                        event.eventType === 'PRUNING' ? 'Poda' :
                                                                            event.eventType === 'NUTRIENT' ? 'Aplicación de Nutrientes' :
                                                                                event.eventType === 'MEASUREMENT' ? 'Medición' : event.eventType}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {format(new Date(event.fecha), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                                                    </p>
                                                </div>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => onEditEvent(event)}>
                                                            <Edit2 className="mr-2 h-4 w-4" /> Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => onDeleteEvent(event)} className="text-destructive focus:text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            <EventDetails event={event} />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
