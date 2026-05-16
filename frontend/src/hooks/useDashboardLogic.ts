import { useMemo } from 'react';
import { PlantaDto } from '@/interfaces/Planta';
import { Leaf, Calendar, TrendingUp, Activity, Package, Clock, Droplets } from 'lucide-react';

interface DashboardFilters {
    searchQuery: string;
    filterEtapa: string;
    filterSala: string;
}

interface BackendEvent {
    id: number;
    eventType: string;
    fecha: string;
    plantaIds: number[];
}

interface DashboardLogicReturn {
    availableRooms: string[];
    filteredAndGroupedPlantas: Record<string, PlantaDto[]>;
    kpis: Array<{
        title: string;
        value: number | string;
        icon: React.ElementType;
        color?: string;
    }>;
}

/**
 * Hook personalizado para lógica de negocio del Dashboard
 * Extrae filtering, grouping y cálculos de KPIs del componente UI
 * 
 * ENFOQUE DEL SOCIO: Separar lógica de negocio de componentes presentacionales
 */
export const useDashboardLogic = (
    plantas: PlantaDto[] | undefined,
    filters: DashboardFilters,
    events?: BackendEvent[]
): DashboardLogicReturn => {
    return useMemo(() => {
        if (!plantas || plantas.length === 0) {
            return { availableRooms: ['Todas'], filteredAndGroupedPlantas: {}, kpis: [] };
        }

        const { searchQuery, filterEtapa, filterSala } = filters;

        // Generar lista de salas únicas
        const uniqueRooms = ['Todas', ...Array.from(new Set(plantas.map(p => p.sala?.nombre || 'Sin Sala')))];

        // Filtrar plantas según criterios
        const filtered = plantas.filter(plant => {
            const matchEtapa = filterEtapa === 'Todas' || plant.etapa === filterEtapa;
            const matchSala = filterSala === 'Todas' || (plant.sala?.nombre || 'Sin Sala') === filterSala;
            const cepaNombre = plant.cepaDto?.geneticaParental || '';
            const matchSearch = plant.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                cepaNombre.toLowerCase().includes(searchQuery.toLowerCase());
            return matchEtapa && matchSala && matchSearch;
        });

        // Agrupar plantas por sala
        const grouped = filtered.reduce((acc, plant) => {
            const salaNombre = plant.sala?.nombre || 'Sin Sala';
            if (!acc[salaNombre]) {
                acc[salaNombre] = [];
            }
            acc[salaNombre].push(plant);
            return acc;
        }, {} as Record<string, PlantaDto[]>);

        // Ordenar alfabéticamente las plantas dentro de cada sala (Directriz del socio #11)
        Object.keys(grouped).forEach(sala => {
            grouped[sala].sort((a, b) => a.nombre.localeCompare(b.nombre));
        });

        // ⭐ KPI 1-4: KPIs originales
        const plantasActivas = plantas.length;
        const plantasFloración = plantas.filter(p => p.etapa === 'FLORACION').length;
        const salasActivas = new Set(plantas.map(p => p.sala?.id)).size;
        const genéticasActivas = new Set(plantas.map(p => p.cepaDto?.id)).size;

        // ⭐ KPI 5: Producción Proyectada Total (suma campo produccion)
        const producciónTotal = plantas.reduce((sum, p) => {
            const prod = parseInt(String(p.produccion || 0));
            return sum + (isNaN(prod) ? 0 : prod);
        }, 0);

        // ⭐ KPI 6: Eventos Última Semana
        const eventosUltimaSemana = events ? events.filter(event => {
            const eventDate = new Date(event.fecha);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return eventDate >= weekAgo;
        }).length : 0;

        // ⭐ KPI 7: Plantas Necesitan Riego (último riego > 3 días)
        let plantasNecesitanRiego = 0;
        if (events) {
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

            plantas.forEach(planta => {
                const riegosPlanta = events.filter(e =>
                    e.eventType === 'WATERING' && e.plantaIds.includes(planta.id)
                );
                if (riegosPlanta.length === 0) {
                    plantasNecesitanRiego++;
                } else {
                    const ultimoRiego = riegosPlanta.reduce((latest, event) => {
                        const eventDate = new Date(event.fecha);
                        return eventDate > latest ? eventDate : latest;
                    }, new Date(0));

                    if (ultimoRiego < threeDaysAgo) {
                        plantasNecesitanRiego++;
                    }
                }
            });
        }

        // Calcular KPIs (7 total)
        const calculatedKpis = [
            { title: "Plantas Activas", value: plantasActivas, icon: Leaf, color: "text-green-500" },
            { title: "En Floración", value: plantasFloración, icon: Calendar, color: "text-purple-500" },
            { title: "Salas Activas", value: salasActivas, icon: TrendingUp, color: "text-blue-500" },
            { title: "Genéticas", value: genéticasActivas, icon: Activity, color: "text-orange-500" },
            { title: "Producción Proyectada", value: `${producciónTotal}g`, icon: Package, color: "text-emerald-500" },
            { title: "Eventos (7 días)", value: eventosUltimaSemana, icon: Clock, color: "text-cyan-500" },
            { title: "Necesitan Riego", value: plantasNecesitanRiego, icon: Droplets, color: plantasNecesitanRiego > 0 ? "text-red-500" : "text-gray-400" },
        ];

        return { availableRooms: uniqueRooms, filteredAndGroupedPlantas: grouped, kpis: calculatedKpis };
    }, [plantas, filters.searchQuery, filters.filterEtapa, filters.filterSala, events]);
};
