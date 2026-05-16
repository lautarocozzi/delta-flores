import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    isSameMonth,
    format,
    addMonths,
    subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { PlantEventDto } from '@/interfaces/Planta';

/**
 * WeeklyCalendarStrip - Calendario semanal estilo GWJ
 * 
 * Features:
 * - Vista semanal compacta (Lun-Dom)
 * - Expandible a vista de mes completo
 * - Dots indicadores de eventos por día
 * - Navegación entre meses
 * - Marca visual del día actual
 */

interface WeeklyCalendarStripProps {
    events?: PlantEventDto[];
    onDaySelect?: (date: Date) => void;
    selectedDate?: Date;
    className?: string;
}

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function WeeklyCalendarStrip({
    events = [],
    onDaySelect,
    selectedDate,
    className
}: WeeklyCalendarStripProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const today = new Date();

    // Calcular días de la semana actual
    const weekDays = useMemo(() => {
        const start = startOfWeek(today, { weekStartsOn: 1 }); // Lunes
        const end = endOfWeek(today, { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, []);

    // Calcular días del mes completo (para vista expandida)
    const monthDays = useMemo(() => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    // Contar eventos por día
    const eventCountByDay = useMemo(() => {
        const counts: Record<string, number> = {};
        events.forEach(event => {
            if (event.fecha) {
                const dateKey = format(new Date(event.fecha), 'yyyy-MM-dd');
                counts[dateKey] = (counts[dateKey] || 0) + 1;
            }
        });
        return counts;
    }, [events]);

    const handleDayClick = (date: Date) => {
        onDaySelect?.(date);
    };

    const handlePrevMonth = () => {
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(addMonths(currentMonth, 1));
    };

    const monthName = format(currentMonth, 'MMMM', { locale: es }).toUpperCase();

    const renderDayCell = (day: Date, index: number) => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const eventCount = eventCountByDay[dateKey] || 0;
        const isToday = isSameDay(day, today);
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, currentMonth);

        return (
            <button
                key={dateKey}
                onClick={() => handleDayClick(day)}
                className={cn(
                    'flex flex-col items-center justify-center rounded-md transition-colors',
                    isExpanded ? 'w-full aspect-square' : 'w-6 h-auto min-h-[40px] p-0',
                    isToday && 'bg-primary text-primary-foreground',
                    isSelected && !isToday && 'bg-primary/20 text-primary',
                    !isToday && !isSelected && 'hover:bg-muted',
                    !isCurrentMonth && isExpanded && 'opacity-40'
                )}
            >
                {/* Día de la semana (solo en vista semanal) */}
                {!isExpanded && (
                    <span className={cn(
                        "text-[10px] font-medium leading-none",
                        isToday ? "text-primary-foreground" : "text-foreground/60"
                    )}>
                        {DAY_LABELS[index]}
                    </span>
                )}

                {/* Número del día */}
                <span className={cn(
                    'text-sm font-bold leading-tight',
                    isToday && 'text-primary-foreground',
                    !isToday && 'text-foreground'
                )}>
                    {format(day, 'd')}
                </span>

                {/* Indicador de eventos (dot) */}
                <div className="h-4 flex items-center justify-center">
                    {eventCount > 0 && (
                        <div className="flex items-center gap-0.5">
                            {eventCount <= 3 ? (
                                Array.from({ length: Math.min(eventCount, 3) }).map((_, i) => (
                                    <span
                                        key={i}
                                        className={cn(
                                            'w-1 h-1 rounded-full',
                                            isToday ? 'bg-primary-foreground' : 'bg-primary'
                                        )}
                                    />
                                ))
                            ) : (
                                <>
                                    <span className={cn(
                                        'w-1 h-1 rounded-full',
                                        isToday ? 'bg-primary-foreground' : 'bg-primary'
                                    )} />
                                    <span className={cn(
                                        'text-[9px] font-medium leading-none',
                                        isToday ? 'text-primary-foreground' : 'text-primary'
                                    )}>+{eventCount - 1}</span>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </button>
        );
    };

    return (
        <div className={cn('bg-card/30 backdrop-blur-sm rounded-xl border-2 border-primary/50', className)}>
            {/* Header con mes y botón expandir */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                >
                    <span className="font-semibold">{monthName}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {/* Navegación de meses (solo en vista expandida) */}
                {isExpanded && (
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
                            ←
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleNextMonth}>
                            →
                        </Button>
                    </div>
                )}
            </div>

            {/* Vista semanal (compacta) */}
            {!isExpanded && (
                <div className="flex justify-between p-4">
                    {weekDays.map((day, index) => renderDayCell(day, index))}
                </div>
            )}

            {/* Vista mensual (expandida) */}
            {isExpanded && (
                <div className="p-4">
                    {/* Labels de días */}
                    <div className="grid grid-cols-7 mb-2">
                        {DAY_LABELS.map(label => (
                            <div key={label} className="text-center text-xs text-muted-foreground py-1">
                                {label}
                            </div>
                        ))}
                    </div>

                    {/* Grid de días del mes */}
                    <div className="grid grid-cols-7 gap-1 place-items-center">
                        {/* Espacios vacíos para alinear con el día correcto */}
                        {Array.from({
                            length: (startOfMonth(currentMonth).getDay() + 6) % 7
                        }).map((_, i) => (
                            <div key={`empty-${i}`} className="p-2" />
                        ))}

                        {monthDays.map((day, index) => renderDayCell(day, day.getDay() === 0 ? 6 : day.getDay() - 1))}
                    </div>
                </div>
            )}
        </div>
    );
}
