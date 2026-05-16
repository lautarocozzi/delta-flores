import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { BackendEvent } from "@/interfaces/Eventos";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";

interface SalaMetricsChartProps {
  salaId: number;
  months?: number;
}

export const SalaMetricsChart = ({ salaId, months = 6 }: SalaMetricsChartProps) => {
  const { data: events = [], isLoading } = useQuery<BackendEvent[]>({
    queryKey: ["sala-metrics", salaId, months],
    queryFn: () => apiService.getSalaMetrics(salaId, months),
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-6 border rounded-lg bg-card/50">
        <Activity className="mx-auto mb-2 text-muted-foreground" size={28} />
        <p className="text-sm text-muted-foreground">
          Sin datos de mediciones en los últimos {months} meses.
        </p>
      </div>
    );
  }

  // Group events by date and average values per day
  const chartData = groupByDate(events);

  return (
    <div className="border rounded-lg p-4 bg-card/50">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Activity size={16} className="text-primary" />
        Métricas de la sala ({events.length} mediciones, últimos {months} meses)
      </h3>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickFormatter={(v: string) => {
                const d = new Date(v);
                return `${d.getDate()}/${d.getMonth() + 1}`;
              }}
            />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelFormatter={(v: string) => {
                const d = new Date(v);
                return d.toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Line
              type="monotone"
              dataKey="temp"
              stroke="#ef4444"
              name="Temp (°C)"
              dot={false}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="humedad"
              stroke="#3b82f6"
              name="Humedad (%)"
              dot={false}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="altura"
              stroke="#22c55e"
              name="Altura (cm)"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/**
 * Groups MeasurementEvents by date, averaging numeric values per day.
 */
function groupByDate(events: BackendEvent[]) {
  const map = new Map<
    string,
    { temp: number[]; humedad: number[]; altura: number[] }
  >();

  for (const e of events) {
    if (!e.fecha) continue;
    const dateKey = e.fecha.split("T")[0]; // "YYYY-MM-DD"
    if (!map.has(dateKey)) {
      map.set(dateKey, { temp: [], humedad: [], altura: [] });
    }
    const entry = map.get(dateKey)!;
    if (e.temperaturaAmbiente != null) entry.temp.push(e.temperaturaAmbiente);
    if (e.humedad != null) entry.humedad.push(e.humedad);
    if (e.alturaPlanta != null) entry.altura.push(e.alturaPlanta);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({
      date,
      temp: avg(values.temp),
      humedad: avg(values.humedad),
      altura: avg(values.altura),
    }));
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 10) / 10;
}