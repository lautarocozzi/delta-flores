import { differenceInWeeks, parseISO, startOfDay, addWeeks, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PlantEvent {
    id: number;
    fecha: string; // ISO String or Date
    eventType: string; // "WATERING", "PRUNING", etc.
    [key: string]: any;
}

export interface TimelineWeek {
    weekNumber: number;
    startDate: string;
    endDate: string;
    events: PlantEvent[];
    stage?: string; // "Vegetación" | "Floración" inferred from events
}

export const calculateCurrentWeek = (creationDate: string): number => {
    const start = startOfDay(parseISO(creationDate));
    const today = startOfDay(new Date());
    return differenceInWeeks(today, start) + 1;
};

export const groupEventsByWeek = (events: PlantEvent[], creationDate: string): TimelineWeek[] => {
    if (!creationDate) return [];

    const start = startOfDay(parseISO(creationDate));
    const groupedWeeks: Record<number, TimelineWeek> = {};

    // Initialize current week range
    const currentWeekNum = calculateCurrentWeek(creationDate);

    // Ensure we cover from week 1 to current week even if empty
    for (let i = 1; i <= currentWeekNum; i++) {
        const weekStart = addWeeks(start, i - 1);
        const weekEnd = addWeeks(start, i); // Logic end of week

        groupedWeeks[i] = {
            weekNumber: i,
            startDate: format(weekStart, 'd MMM', { locale: es }),
            endDate: format(weekEnd, 'd MMM', { locale: es }),
            events: [],
            stage: i < 4 ? 'Vegetación' : 'Floración' // Simplistic default, can be refined based on StageChange events
        };
    }

    // Place events
    events.forEach(event => {
        const eventDate = startOfDay(parseISO(event.fecha as string));
        const weekDiff = differenceInWeeks(eventDate, start);
        const weekNum = weekDiff + 1;

        if (weekNum > 0) {
            if (!groupedWeeks[weekNum]) {
                // Handle events in future or way past expected range if needed
                const weekStart = addWeeks(start, weekNum - 1);
                const weekEnd = addWeeks(start, weekNum);
                groupedWeeks[weekNum] = {
                    weekNumber: weekNum,
                    startDate: format(weekStart, 'd MMM', { locale: es }),
                    endDate: format(weekEnd, 'd MMM', { locale: es }),
                    events: [],
                };
            }
            groupedWeeks[weekNum].events.push(event);
        }
    });

    // Convert to array and sort descending (newest weeks first)
    return Object.values(groupedWeeks).sort((a, b) => b.weekNumber - a.weekNumber);
};
