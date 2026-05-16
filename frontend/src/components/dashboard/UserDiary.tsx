import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
    Droplets,
    Scissors,
    Leaf,
    Camera,
    FileText,
    RefreshCw,
    Calendar,
    ChevronRight,
    ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiService } from "@/services/api";
import { BackendEvent } from "@/interfaces/Eventos";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

// Event type icons mapping
const eventIcons: Record<string, React.ElementType> = {
    WATERING: Droplets,
    PRUNING: Scissors,
    NUTRIENT: Leaf,
    PHOTO: Camera,
    NOTE: FileText,
    STAGE_CHANGE: RefreshCw,
};

// Event type colors
const eventColors: Record<string, string> = {
    WATERING: "text-blue-400 bg-blue-500/20 border-blue-500/30",
    PRUNING: "text-orange-400 bg-orange-500/20 border-orange-500/30",
    NUTRIENT: "text-green-400 bg-green-500/20 border-green-500/30",
    PHOTO: "text-purple-400 bg-purple-500/20 border-purple-500/30",
    NOTE: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30",
    STAGE_CHANGE: "text-pink-400 bg-pink-500/20 border-pink-500/30",
};

// Event type labels in Spanish
const eventLabels: Record<string, string> = {
    WATERING: "Riego",
    PRUNING: "Poda",
    NUTRIENT: "Nutrientes",
    PHOTO: "Foto",
    NOTE: "Nota",
    STAGE_CHANGE: "Cambio de Etapa",
};

const INITIAL_ITEMS = 5;

export const UserDiary = () => {
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(false);

    // Fetch all plants to get their events
    const { data: plantas = [] } = useQuery({
        queryKey: ['plantas'],
        queryFn: apiService.getPlantas,
        staleTime: 1000 * 60 * 5,
    });

    // Fetch events for all plants
    const { data: allEvents = [], isLoading } = useQuery<BackendEvent[]>({
        queryKey: ['allUserEvents'],
        queryFn: async () => {
            const eventPromises = plantas.slice(0, 20).map(async (planta) => {
                try {
                    const events = await apiService.getPlantEvents(planta.id.toString());
                    return events.map(e => ({ ...e, plantaNombre: planta.nombre, plantaId: planta.id }));
                } catch {
                    return [];
                }
            });
            const results = await Promise.all(eventPromises);
            return results.flat();
        },
        enabled: plantas.length > 0,
        staleTime: 1000 * 60 * 2,
    });

    // Sort by date descending
    const sortedEvents = [...allEvents]
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    // Show only 5 initially, more when expanded
    const visibleEvents = expanded ? sortedEvents : sortedEvents.slice(0, INITIAL_ITEMS);
    const remainingCount = sortedEvents.length - INITIAL_ITEMS;

    const formatEventTime = (dateStr: string) => {
        const date = parseISO(dateStr);
        if (isToday(date)) return `Hoy, ${format(date, 'HH:mm')}`;
        if (isYesterday(date)) return `Ayer, ${format(date, 'HH:mm')}`;
        return format(date, "d MMM, HH:mm", { locale: es });
    };

    const handleEventClick = (plantaId: number) => {
        navigate(`/plant/${plantaId}`);
    };

    // Get event detail text based on type
    const getEventDetail = (event: BackendEvent & { plantaNombre?: string }) => {
        switch (event.eventType) {
            case 'WATERING':
                return event.phAgua ? `pH ${event.phAgua} · EC ${event.ecAgua || '-'}` : 'Sin datos';
            case 'NUTRIENT':
                return event.nota || 'Nutrientes aplicados';
            case 'PRUNING':
                return event.nota || 'Poda realizada';
            case 'NOTE':
                return event.nota?.slice(0, 50) || 'Sin contenido';
            case 'STAGE_CHANGE':
                return event.nota || 'Etapa actualizada';
            default:
                return event.nota || '';
        }
    };

    if (isLoading) {
        return (
            <div className="bg-card/30 backdrop-blur-sm rounded-xl p-4 border-2 border-primary/50">
                <div className="flex items-center gap-2 mb-4">
                    <Calendar size={18} className="text-primary" />
                    <h3 className="font-semibold text-foreground">Mi Diario</h3>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse flex gap-3 p-3 rounded-lg bg-muted/20">
                            <div className="w-10 h-10 bg-muted rounded-lg" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-muted rounded w-1/2" />
                                <div className="h-3 bg-muted rounded w-3/4" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card/30 backdrop-blur-sm rounded-xl p-4 border-2 border-primary/50">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-primary" />
                    <h3 className="font-semibold text-foreground">Mi Diario</h3>
                </div>
                <span className="text-xs text-muted-foreground px-2 py-1 bg-muted/50 rounded-full">
                    {allEvents.length} total
                </span>
            </div>

            {sortedEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <FileText className="mx-auto mb-2 opacity-50" size={32} />
                    <p className="text-sm">No hay registros aún</p>
                    <p className="text-xs">Tus actividades aparecerán aquí</p>
                </div>
            ) : (
                <div className="space-y-2">
                    <AnimatePresence>
                        {visibleEvents.map((event, idx) => {
                            const Icon = eventIcons[event.eventType] || FileText;
                            const colorClass = eventColors[event.eventType] || "text-gray-400 bg-gray-500/20 border-gray-500/30";
                            const colors = colorClass.split(' ');

                            return (
                                <motion.button
                                    key={`${event.id}-${idx}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => event.plantaId && handleEventClick(event.plantaId)}
                                    className={cn(
                                        "w-full flex items-start gap-3 p-3 rounded-lg",
                                        "border transition-all duration-200 text-left group cursor-pointer",
                                        "hover:bg-primary/40 hover:border-primary hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20",
                                        colors[2] || "border-border"
                                    )}
                                >
                                    {/* Icon */}
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                        colors[1]
                                    )}>
                                        <Icon size={20} className={colors[0]} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-semibold text-foreground">
                                                {eventLabels[event.eventType] || event.eventType}
                                            </p>
                                            <span className="text-xs text-muted-foreground shrink-0">
                                                {formatEventTime(event.fecha)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-primary truncate">
                                            {event.plantaNombre || `Planta #${event.plantaIds?.[0]}`}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1 truncate">
                                            {getEventDetail(event)}
                                        </p>
                                    </div>

                                    {/* Arrow */}
                                    <ChevronRight
                                        size={16}
                                        className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-2"
                                    />
                                </motion.button>
                            );
                        })}
                    </AnimatePresence>

                    {/* Show More Button */}
                    {remainingCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpanded(!expanded)}
                            className="w-full text-xs text-muted-foreground hover:text-foreground"
                        >
                            <ChevronDown className={cn(
                                "w-4 h-4 mr-1 transition-transform",
                                expanded && "rotate-180"
                            )} />
                            {expanded ? "Ver menos" : `Ver ${remainingCount} más`}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};
