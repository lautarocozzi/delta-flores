import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";

/**
 * COMPONENT: KpiCard Mejorado (BI Professional)
 * 
 * FILOSOFÍA SOCIO:
 * - Componente reutilizable con una responsabilidad: mostrar KPI
 * - Props flexibles para diferentes variantes
 * - Feedback visual rico (benchmarks, trends, tooltips)
 */
interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  unit?: string;
  subtitle?: string;  // ✅ NUEVO: Texto secundario (ej: "en 30 días")
  color?: string;
  benchmark?: number | string;  // ✅ NUEVO: Valor de referencia industria
  trend?: 'up' | 'down' | 'stable';  // ✅ NUEVO: Dirección tendencia
  trendValue?: number;  // ✅ NUEVO: Porcentaje cambio (ej: +12%)
  description?: string;  // ✅ NUEVO: Tooltip explicativo
  chart?: React.ReactNode;  // ✅ NUEVO: Mini-chart opcional
  type?: 'ranking';  // ✅ NUEVO: Señal para renderizado especial
  data?: any[];  // ✅ NUEVO: Datos para ranking/tabla
}

export const KpiCard = ({
  title,
  value,
  icon: Icon,
  unit,
  subtitle,
  color = "text-primary",
  benchmark,
  trend,
  trendValue,
  description,
  chart,
  type,
  data
}: KpiCardProps) => {
  /**
   * LÓGICA: Color dinámico basado en benchmark
   * Si hay benchmark, comparar valor actual vs benchmark
   */
  const getValueColor = () => {
    if (!benchmark || typeof value !== 'number') return 'text-foreground';

    const numericBenchmark = typeof benchmark === 'string'
      ? parseFloat(benchmark)
      : benchmark;

    if (value >= numericBenchmark) return 'text-green-500';
    if (value >= numericBenchmark * 0.8) return 'text-yellow-500';
    return 'text-red-500';
  };

  /**
   * RENDERIZADO ESPECIAL: Ranking tabla
   */
  if (type === 'ranking' && data && data.length > 0) {
    return (
      <Card className="bg-card p-6 rounded-xl shadow-lg border border-border hover:border-primary/50 transition-colors duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-muted-foreground">{title}</h3>
          <Icon className={color} size={24} />
        </div>

        {/* Mini-tabla ranking */}
        <div className="space-y-2">
          {data.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-2">
                <span className={`
                  font-bold text-sm
                  ${idx === 0 ? 'text-amber-500' : ''}
                  ${idx === 1 ? 'text-gray-400' : ''}
                  ${idx === 2 ? 'text-orange-600' : ''}
                `}>
                  #{idx + 1}
                </span>
                <span className="text-sm font-medium truncate max-w-[120px]">
                  {item.nombre}
                </span>
              </div>
              <span className="text-sm font-bold text-foreground">
                {item.promedio}g
              </span>
            </div>
          ))}
        </div>

        {description && (
          <p className="text-xs text-muted-foreground mt-3 border-t border-border/30 pt-2">
            {description}
          </p>
        )}
      </Card>
    );
  }

  /**
   * RENDERIZADO ESTÁNDAR: KPI Card normal
   */
  return (
    <Card className="bg-card p-6 rounded-xl shadow-lg border border-border hover:border-primary/50 transition-colors duration-300 hover:shadow-primary/20">
      {/* Header con título e ícono */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
          {description && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info size={14} className="text-muted-foreground/60 hover:text-primary transition-colors" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[250px]">
                  <p className="text-xs">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <Icon className={color} size={24} />
      </div>

      {/* Valor principal */}
      <div className="flex items-baseline gap-2 mb-2">
        <p className={`text-4xl font-extrabold ${getValueColor()}`}>
          {value}
        </p>
        {unit && (
          <span className="text-lg text-muted-foreground font-medium">
            {unit}
          </span>
        )}
      </div>

      {/* Subtitle (si existe) */}
      {subtitle && (
        <p className="text-sm text-muted-foreground mb-2">
          {subtitle}
        </p>
      )}

      {/* Trending indicator (si existe) */}
      {trend && (
        <div className={`flex items-center gap-1 text-sm font-medium mb-2 ${trend === 'up' ? 'text-green-500' :
            trend === 'down' ? 'text-red-500' :
              'text-gray-500'
          }`}>
          {trend === 'up' && <TrendingUp size={16} />}
          {trend === 'down' && <TrendingDown size={16} />}
          {trend === 'stable' && <Minus size={16} />}
          <span>
            {trend === 'up' ? 'Mejorando' : trend === 'down' ? 'Decreciendo' : 'Estable'}
          </span>
          {trendValue !== undefined && (
            <span className="ml-1">
              ({trendValue >= 0 ? '+' : ''}{trendValue}%)
            </span>
          )}
        </div>
      )}

      {/* Benchmark reference (si existe) */}
      {benchmark && (
        <p className="text-xs text-muted-foreground/70">
          Benchmark: {benchmark}{unit}
        </p>
      )}

      {/* Mini-chart (si existe) */}
      {chart && (
        <div className="mt-4 pt-3 border-t border-border/30">
          {chart}
        </div>
      )}
    </Card>
  );
};
