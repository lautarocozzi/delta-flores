import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackendEvent } from "@/interfaces/Eventos";
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { startOfWeek, format, parseISO, isSameWeek, subWeeks, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";

interface WeeklyActivityChartProps {
    events: BackendEvent[];
}

export function WeeklyActivityChart({ events }: WeeklyActivityChartProps) {
    const data = useMemo(() => {
        if (!events || events.length === 0) return [];

        const today = new Date();
        const last4Weeks = Array.from({ length: 4 }, (_, i) => {
            const date = subWeeks(today, 3 - i); // From 3 weeks ago to this week
            return {
                start: startOfWeek(date, { weekStartsOn: 1 }),
                label: format(startOfWeek(date, { weekStartsOn: 1 }), "d MMM", { locale: es }),
                riegos: 0,
                podas: 0,
                otros: 0
            };
        });

        events.forEach(event => {
            const eventDate = parseISO(event.fecha);
            const weekBucket = last4Weeks.find(week => isSameWeek(week.start, eventDate, { weekStartsOn: 1 }));

            if (weekBucket) {
                if (event.eventType === 'WATERING') weekBucket.riegos++;
                else if (event.eventType === 'PRUNING') weekBucket.podas++;
                else weekBucket.otros++;
            }
        });

        return last4Weeks;
    }, [events]);

    return (
        <Card className="col-span-1 shadow-md border-border">
            <CardHeader>
                <CardTitle className="text-lg">Actividad Semanal</CardTitle>
                <p className="text-sm text-muted-foreground">Proyección de tareas en las últimas 4 semanas</p>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Legend />
                                <Bar dataKey="riegos" name="Riegos" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                                <Bar dataKey="podas" name="Podas" fill="#f97316" radius={[4, 4, 0, 0]} barSize={30} />
                                <Bar dataKey="otros" name="Otros" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-center justify-center text-center text-muted-foreground px-4">
                            <div>
                                <p className="font-medium text-foreground">Sin actividad reciente</p>
                                <p className="text-sm mt-1 text-muted-foreground">Tus riegos, podas y notas aparecerán aquí.</p>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
