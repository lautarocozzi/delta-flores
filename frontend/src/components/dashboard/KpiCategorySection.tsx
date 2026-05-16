import { Card } from "@/components/ui/card";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { KpiCard } from "./KpiCard";

/**
 * COMPONENT: KpiCategorySection
 * 
 * PROPÓSITO:
 * Agrupar KPIs por categoría con funcionalidad colapsable
 * 
 * FILOSOFÍA SOCIO:
 * - Componente reutilizable: Usado 4 veces (operational, quality, performance, temporal)
 * - Una responsabilidad: Solo agrupar y colapsar
 * - Props flexibles: color, kpis[], defaultCollapsed
 * 
 * USO:
 * <KpiCategorySection 
 *   title="⚡ Eficiencia Operativa"
 *   color="border-green-500"
 *   kpis={operational}
 * />
 */
interface KpiCategorySectionProps {
    title: string;
    color: string;  // Tailwind border class (ej: "border-green-500")
    kpis: any[];    // Array de objetos KPI
    defaultCollapsed?: boolean;
}

export const KpiCategorySection = ({
    title,
    color,
    kpis,
    defaultCollapsed = false
}: KpiCategorySectionProps) => {
    const [isOpen, setIsOpen] = useState(!defaultCollapsed);

    return (
        <div className={`border-l-4 ${color} pl-4 py-2`}>
            {/* Header colapsable */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 mb-3 text-lg font-semibold hover:text-primary transition-colors w-full"
            >
                {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                <span>{title}</span>
                <span className="text-sm text-muted-foreground ml-auto">
                    {kpis.length} KPI{kpis.length !== 1 ? 's' : ''}
                </span>
            </button>

            {/* Grid de KPIs (solo si está abierto) */}
            {isOpen && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-200">
                    {kpis.map((kpi, idx) => (
                        <KpiCard key={idx} {...kpi} />
                    ))}
                </div>
            )}
        </div>
    );
};
