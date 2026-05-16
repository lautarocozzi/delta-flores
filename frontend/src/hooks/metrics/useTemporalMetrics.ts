import { useMemo } from 'react'
import { PlantaDto } from '@/interfaces/Planta'
import { daysSince } from '../utils/dateCalculations'
import { calculateTrend, percentageChange } from '../utils/statisticalUtils'
import { Clock, TrendingUp, Calendar } from 'lucide-react'

/**
 * Interface para eventos backend
 */
interface BackendEvent {
    id: number
    eventType: string
    fecha: string
    plantaIds: number[]
}

/**
 * HOOK: Métricas de Análisis Temporal
 * 
 * CATEGORÍA BI: Temporal Metrics
 * PROPÓSITO: Analizar evolución y actividad reciente
 * 
 * KPIs CALCULADOS:
 * 1. Actividad Últimas 24h
 * 2. Tendencia Producción
 * 3. Próximas Cosechas (30 días)
 */
export const useTemporalMetrics = (plantas: PlantaDto[], events: BackendEvent[] = []) => {
    return useMemo(() => {
        /**
         * ========================================
         * KPI #9: ACTIVIDAD ÚLTIMAS 24H
         * ========================================
         * 
         * DEFINICIÓN:
         * Contador de eventos en últimas 24 horas
         * 
         * ALGORITMO:
         * 1. Filtrar eventos con daysSince(fecha) < 1
         * 2. Contar cantidad
         * 
         * FÓRMULA:
         * eventos24h = count(eventos donde daysSince < 1)
         * 
         * BENCHMARK:
         * - Activo: >5 eventos/día (cultivo operativo)
         * - Normal: 2-5 eventos/día
         * - Inactivo: <2 eventos/día (posible problema)
         * 
         * USO BI:
         * - Detectar inactividad operativa
         * - Validar equipo está trabajando
         * - Alertas automáticas si <2 por 3 días consecutivos
         */
        const eventos24h = events.filter(e => daysSince(e.fecha) < 1).length

        /**
         * ========================================
         * KPI #10: TENDENCIA PRODUCCIÓN
         * ========================================
         * 
         * DEFINICIÓN:
         * Evolución rendimiento últimas cosechas
         * 
         * ALGORITMO:
         * 1. Filtrar plantas cosechadas con fechaFin
         * 2. Ordenar por fechaFin DESC (más reciente primero)
         * 3. Tomar últimas 10 cosechas
         * 4. Extraer array producciones
         * 5. Calcular trend con calculateTrend()
         * 6. Calcular % cambio entre última y penúltima
         * 
         * RETORNO:
         * {
         *   direction: 'up' | 'down' | 'stable',
         *   percentage: número (ej: +12 significa mejora 12%)
         * }
         * 
         * LÓGICA TRENDING:
         * - UP: Producción creciendo (mejorando)
         * - DOWN: Producción decreciendo (empeorando)
         * - STABLE: Sin cambios significativos
         * 
         * USO BI:
         * - Validar si cambios proceso están funcionando
         * - Detectar degradación rendimiento temprano
         * - KPI para reportes mensuales
         */
        const cosechadasRecientes = plantas
            .filter(p => p.etapa === 'COSECHADA' && p.fechaFin)
            .sort((a, b) => {
                const dateA = new Date(a.fechaFin!).getTime()
                const dateB = new Date(b.fechaFin!).getTime()
                return dateB - dateA  // DESC (más reciente primero)
            })
            .slice(0, 10)  // Últimas 10 cosechas

        const producciones = cosechadasRecientes.map(p => p.produccion)
        const trend = calculateTrend(producciones)

        let trendPercentage = 0
        if (producciones.length >= 2) {
            const ultimo = producciones[0]
            const penultimo = producciones[1]
            trendPercentage = Math.round(percentageChange(penultimo, ultimo))
        }

        /**
         * ========================================
         * KPI #11: PRÓXIMAS COSECHAS (30 días)
         * ========================================
         * 
         * DEFINICIÓN:
         * Plantas en floración tardía (próximas a cosechar)
         * 
         * ALGORITMO:
         * 1. Filtrar plantas con etapa === 'FLORACION'
         * 2. Para cada planta calcular días desde creación
         * 3. Si días >= 75 (floración tardía), contar
         * 
         * LÓGICA ESTIMACIÓN:
         * - Ciclo típico: 100 días total
         * - Floración: ~60 días
         * - Si planta tiene 75+ días total:
         *   → Probablemente 45+ días en floración
         *   → Quedan ~15 días para cosecha
         *   → "Próxima cosecha en 30 días"
         * 
         * NOTA IMPORTANTE:
         * Estimación simplificada. Para precisión:
         * - Agregar campo backend: diasEnEtapaActual
         * - Tracking STAGE_CHANGE events
         * 
         * BENCHMARK:
         * - Planificación: >0 plantas próximas (pipeline constante)
         * - Vacío: 0 plantas (problema planificación escalonada)
         * 
         * USO BI:
         * - Planificar logística cosecha
         * - Proyección ingresos mes siguiente
         * - Coordinar equipo trimming
         */
        const proximasCosechas = plantas.filter(p => {
            if (p.etapa !== 'FLORACION') return false
            const diasTotal = daysSince(p.fechaCreacion)
            // Asumimos floración tardía si >75 días total
            return diasTotal >= 75
        }).length

        // Color dinámico actividad
        const actividadColor = eventos24h >= 5
            ? "text-green-500"
            : eventos24h >= 2
                ? "text-yellow-500"
                : "text-red-500"

        // Color dinámico tendencia
        const trendColor = trend === 'up'
            ? "text-green-500"
            : trend === 'down'
                ? "text-red-500"
                : "text-gray-500"

        return [
            {
                title: "Actividad 24h",
                value: eventos24h,
                unit: "eventos",
                icon: Clock,
                color: actividadColor,
                benchmark: 5,
                description: "Eventos registrados últimas 24 horas"
            },
            {
                title: "Tendencia Producción",
                value: `${trendPercentage >= 0 ? '+' : ''}${trendPercentage}%`,
                subtitle: trend === 'up' ? '↗ Mejorando' : trend === 'down' ? '↘ Decreciendo' : '➡ Estable',
                icon: TrendingUp,
                color: trendColor,
                trend: trend,
                trendValue: trendPercentage,
                description: "Evolución rendimiento últimas cosechas"
            },
            {
                title: "Próximas Cosechas",
                value: proximasCosechas,
                subtitle: "en 30 días",
                icon: Calendar,
                color: "text-indigo-500",
                description: "Plantas en floración tardía (cosecha cercana)"
            }
        ]
    }, [plantas, events])
}
