import { useMemo } from 'react'
import { PlantaDto } from '@/interfaces/Planta'
import { daysSince } from '../utils/dateCalculations'
import { avg } from '../utils/statisticalUtils'
import { Heart, Activity, CheckCircle } from 'lucide-react'

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
 * HOOK: Métricas de Calidad y Salud del Cultivo
 * 
 * CATEGORÍA BI: Quality Metrics
 * PROPÓSITO: Evaluar salud y calidad del manejo del crop
 * 
 * KPIs CALCULADOS:
 * 1. Health Score (0-100)
 * 2. Eventos por Planta (promedio)
 * 3. Tasa de Éxito (%)
 */
export const useQualityMetrics = (plantas: PlantaDto[], events: BackendEvent[] = []) => {
    return useMemo(() => {
        /**
         * ========================================
         * KPI #4: HEALTH SCORE
         * ========================================
         * 
         * DEFINICIÓN:
         * Índice compuesto de salud del cultivo actual (0-100)
         * 
         * ALGORITMO COMPUESTO (3 factores):
         * 
         * FACTOR 1: Riego Oportuno (40% peso)
         * - Contar plantas con riego reciente (<3 días)
         * - Fórmula: (plantasConRiego / totalPlantas) * 40
         * 
         * FACTOR 2: Actividad Regular (30% peso)
         * - Eventos última semana / total plantas
         * - Normalizado a max 1.0
         * - Fórmula: min((eventosSemanales / totalPlantas), 1) * 30
         * 
         * FACTOR 3: Progreso Esperado (30% peso)
         * - Plantas en etapa apropiada según días cultivo
         * - Fórmula: (plantasEnProgreso / totalPlantas) * 30
         * 
         * FÓRMULA FINAL:
         * healthScore = factor1 + factor2 + factor3
         * 
         * LÓGICA RIEGO:
         * Planta tiene riego reciente SI:
         * - Existe evento WATERING con esta plantaId
         * - daysSince(evento.fecha) < 3
         * 
         * BENCHMARK:
         * - Excelente: 80-100 (cultivo muy saludable)
         * - Bueno: 60-80 (salud aceptable)
         * - Riesgo: <60 (requiere atención)
         */
        if (plantas.length === 0) {
            return [
                {
                    title: "Health Score",
                    value: 0,
                    unit: "%",
                    icon: Heart,
                    color: "text-gray-400",
                    benchmark: 80,
                    description: "Índice de salud del cultivo"
                },
                {
                    title: "Eventos/Planta",
                    value: 0,
                    unit: "avg",
                    icon: Activity,
                    color: "text-cyan-500",
                    benchmark: 20,
                    description: "Promedio intervenciones por planta"
                },
                {
                    title: "Tasa de Éxito",
                    value: 0,
                    unit: "%",
                    icon: CheckCircle,
                    color: "text-green-500",
                    benchmark: 85,
                    description: "% plantas que llegan a cosecha"
                }
            ]
        }

        // Factor 1: Riego oportuno
        const riegosRecientes = events.filter(e =>
            e.eventType === 'WATERING' && daysSince(e.fecha) < 3
        )

        // IDs únicos de plantas regadas recientemente
        const plantasRegadasIds = new Set(
            riegosRecientes.flatMap(e => e.plantaIds)
        )

        const factorRiego = (plantasRegadasIds.size / plantas.length) * 40

        // Factor 2: Actividad regular (eventos última semana)
        const eventosUltimaSemana = events.filter(e => daysSince(e.fecha) < 7).length
        const factorActividad = Math.min((eventosUltimaSemana / plantas.length), 1) * 30

        // Factor 3: Progreso esperado (simplificado por ahora)
        // Asumimos que si planta no está en COSECHADA y tiene <180 días, está en progreso
        const plantasEnProgreso = plantas.filter(p =>
            p.etapa !== 'COSECHADA' || daysSince(p.fechaCreacion) < 180
        ).length

        const factorProgreso = (plantasEnProgreso / plantas.length) * 30

        const healthScore = Math.round(factorRiego + factorActividad + factorProgreso)

        /**
         * ========================================
         * KPI #5: EVENTOS POR PLANTA
         * ========================================
         * 
         * DEFINICIÓN:
         * Promedio de intervenciones/eventos por planta
         * 
         * ALGORITMO:
         * 1. Contar total de eventos
         * 2. Dividir por número de plantas
         * 3 Redondear a 1 decimal
         * 
         * FÓRMULA:
         * eventos/planta = totalEventos / totalPlantas
         * 
         * BENCHMARK CICLO COMPLETO:
         * - Bajo: <10 (posible negligencia)
         * - Óptimo: 15-25 (mantenimiento adecuado)
         * - Alto: >35 (posible sobre-intervención)
         */
        const eventosPorPlanta = plantas.length > 0
            ? (events.length / plantas.length).toFixed(1)
            : "0"

        /**
         * ========================================
         * KPI #6: TASA DE ÉXITO
         * ========================================
         * 
         * DEFINICIÓN:
         * Porcentaje de plantas que completan ciclo hasta cosecha
         * 
         * ALGORITMO:
         * 1. Contar plantas cosechadas
         * 2. Total = cosechadas + activas (asumiendo todas iniciadas llegarán)
         * 3. Porcentaje = (cosechadas / total) * 100
         * 
         * FÓRMULA:
         * tasaÉxito = (cosechadas / (cosechadas + activas)) * 100
         * 
         * NOTA IMPORTANTE:
         * Este cálculo es estimación optimista:
         * - Asume que plantas activas llegarán a cosecha
         * - En producción real, agregar tracking de plantas perdidas/muertas
         * 
         * BENCHMARK:
         * - Profesional: >85%
         * - Intermedio: 70-85%
         * - Novato: <70%
         */
        const plantasCosechadas = plantas.filter(p => p.etapa === 'COSECHADA').length
        const plantasActivas = plantas.length - plantasCosechadas
        const totalIniciadas = plantasCosechadas + plantasActivas

        const tasaExito = totalIniciadas > 0
            ? Math.round((plantasCosechadas / totalIniciadas) * 100)
            : 0

        // Determinar color healthScore dinámico
        const healthColor = healthScore >= 80
            ? "text-green-500"
            : healthScore >= 60
                ? "text-yellow-500"
                : "text-red-500"

        return [
            {
                title: "Health Score",
                value: healthScore,
                unit: "%",
                icon: Heart,
                color: healthColor,
                benchmark: 80,
                description: "Índice de salud del cultivo (riego + actividad + progreso)"
            },
            {
                title: "Eventos/Planta",
                value: eventosPorPlanta,
                unit: "avg",
                icon: Activity,
                color: "text-cyan-500",
                benchmark: 20,
                description: "Promedio de intervenciones por planta"
            },
            {
                title: "Tasa de Éxito",
                value: tasaExito,
                unit: "%",
                icon: CheckCircle,
                color: tasaExito >= 85 ? "text-green-500" : "text-yellow-500",
                benchmark: 85,
                description: "Porcentaje plantas que llegan a cosecha"
            }
        ]
    }, [plantas, events])
}
