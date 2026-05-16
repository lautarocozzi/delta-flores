import { BackendEvent } from "@/interfaces/Eventos";
import { Card } from "@/components/ui/card";
import { Droplets, Scissors, FileText, Camera, RefreshCw, Leaf, Calendar } from "lucide-react";
import { format, differenceInCalendarWeeks, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface WeeklyEventLogProps {
    events: BackendEvent[];
    plantCreationDate: string;
    onEditEvent: (event: BackendEvent) => void;
    onDeleteEvent: (event: BackendEvent) => void;
}

const EventIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'WATERING': return <Droplets className="text-blue-500" size={20} />;
        case 'PRUNING': return <Scissors className="text-orange-500" size={20} />;
        case 'NOTE': return <FileText className="text-yellow-500" size={20} />;
        case 'PHOTO': return <Camera className="text-purple-500" size={20} />;
        case 'NUTRIENT': return <Leaf className="text-green-500" size={20} />;
        case 'STAGE_CHANGE': return <RefreshCw className="text-pink-500" size={20} />;
        default: return <Calendar className="text-gray-500" size={20} />;
    }
};

const EventCard = ({ event, onEdit, onDelete }: { event: BackendEvent, onEdit: (e: BackendEvent) => void, onDelete: (e: BackendEvent) => void }) => {
    // Defensa: garantizar que mediaUrls siempre sea un array
    const safeMediaUrls = Array.isArray(event.mediaUrls) ? event.mediaUrls : [];

    return (
        <div className="flex gap-4 mb-4 relative pl-6 border-l-2 border-border last:mb-0 pb-4 last:pb-0 last:border-l-0">
            <div className="absolute -left-[9px] top-0 bg-background p-1 rounded-full border border-border">
                <EventIcon type={event.eventType} />
            </div>
            <Card className="flex-1 p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{event.eventType}</span>
                        <h4 className="text-sm font-medium text-foreground">
                            {format(parseISO(event.fecha), "EEEE d 'de' MMMM", { locale: es })}
                        </h4>
                    </div>
                    <div className="flex gap-2">
                        {/* Botones de acción pequeños si se desean, o menú contextual */}
                    </div>
                </div>

                <div className="text-sm text-foreground/90 space-y-1">
                    {event.eventType === 'WATERING' && (
                        <div className="grid grid-cols-2 gap-2">
                            {event.phAgua && <span>pH: <strong>{event.phAgua}</strong></span>}
                            {event.ecAgua && <span>EC: <strong>{event.ecAgua}</strong></span>}
                        </div>
                    )}
                    {event.eventType === 'PRUNING' && <p>Tipo: {event.tipoPoda}</p>}
                    {event.eventType === 'NOTE' && <p className="italic">"{event.observacion}"</p>}
                    {event.eventType === 'NUTRIENT' && <p>Nutriente: {event.nutriente?.titulo}</p>}
                    {event.eventType === 'STAGE_CHANGE' && <p>Nueva Etapa: <strong>{event.nuevaEtapa}</strong></p>}
                    {event.eventType === 'PHOTO' && (
                        <div>
                            {event.description && <p className="mb-2">{event.description}</p>}
                            {safeMediaUrls.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {safeMediaUrls.map((url, idx) => (
                                        <img key={idx} src={url} alt="Evento" className="rounded-md w-full h-32 object-cover" />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export const WeeklyEventLog = ({ events, plantCreationDate, onEditEvent, onDeleteEvent }: WeeklyEventLogProps) => {
    const startDate = parseISO(plantCreationDate);

    // Agrupar eventos por semana
    const eventsByWeek = events.reduce((acc, event) => {
        const eventDate = parseISO(event.fecha);
        const weekDiff = differenceInCalendarWeeks(eventDate, startDate, { weekStartsOn: 1 });
        const weekNum = weekDiff < 0 ? 0 : weekDiff + 1; // Semana 1 es la semana de creación

        if (!acc[weekNum]) acc[weekNum] = [];
        acc[weekNum].push(event);
        return acc;
    }, {} as Record<number, BackendEvent[]>);

    // Ordenar semanas descendente (más reciente arriba)
    const sortedWeeks = Object.keys(eventsByWeek).map(Number).sort((a, b) => b - a);

    if (events.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border">
                <p>No hay eventos registrados aún.</p>
                <p className="text-sm mt-2">¡Comienza registrando el primer riego o una foto!</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {sortedWeeks.map(weekNum => (
                <div key={weekNum} className="relative">
                    <div className="flex items-center mb-4">
                        <div className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-sm border border-primary/20">
                            Semana {weekNum}
                        </div>
                        <div className="h-px bg-border flex-1 ml-4"></div>
                    </div>

                    <div className="pl-4 border-l-2 border-border/50 ml-4 space-y-6">
                        {eventsByWeek[weekNum]
                            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()) // Ordenar eventos dentro de la semana
                            .map(event => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    onEdit={onEditEvent}
                                    onDelete={onDeleteEvent}
                                />
                            ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
