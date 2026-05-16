import { useMemo } from 'react'
import { PlantaDto } from '@/interfaces/Planta'
import { daysBetween } from '../utils/dateCalculations'
import { avg, roundTo } from '../utils/statisticalUtils'
import { Leaf, TrendingUp, RefreshCw } from 'lucide-react'

/**
 * HOOK: Métricas de Eficiencia Operativa
 * 
 * CATEGORÍA BI: Operational Metrics
 * PROPÓSITO: Eval uar eficiencia del ciclo productivo
 * 
 * KPIs CALCULADOS:
 * 1. Cycle Time Promedio (días)
 * 2. Rendimiento por m² (gramos)
 * 3. Tasa Rotación Anual (ciclos)
 * 
 * FILOSOFÍA SOCIO:
 * - usa useMemo para optimización (recalcula solo si plantas cambia)
 * - Lógica negocio separada de UI
 * - Retorna datos puros (UI components deciden presentación)
 */
export const useOperationalMetrics = (plantas: PlantaDto[]) => {
    return useMemo(() => {
        /**
         * ========================================
         * KPI #1: CYCLE TIME PROMEDIO
         * ========================================
         * 
         * DEFINICIÓN:
         * Tiempo promedio que tarda una planta desde germinación hasta cosecha
         * 
         * ALGORITMO:
         * 1. Filtrar plantas con etapa === 'COSECHADA' y fechaFin existente
         * 2. Para cada planta cosechada:
         *    - Calcular días = daysBetween(fechaCreacion, fechaFin)
         * 3. Calcular promedio con avg(arrayDías)
         * 4. Redondear a número entero (Math.round)
         * 5. Si no hay cosechadas, retornar 100 (benchmark default)
         * 
         * FÓRMULA MATEMÁTICA:
         * cycleTime = Σ(daysBetween(creación, fin)) / count(cosechadas)
         *           = avg([días_planta1, días_planta2, ..., días_plantaN])
         * 
         * BENCHMARK INDUSTRIA:
         * - Rápido: 80-90 días (cepas auto-florecientes)
         * - Estándar: 90-120 días (Cannabis fotodependiente indoor)
         * - Lento: >120 días (Sativas, outdoor)
         * 
         * INTERPRETACIÓN:
         * - <90 días: Excelente (genéticas rápidas o manejo eficiente)
         * - 90-110 días: Bueno (dentro de estándar)
         * - >110 días: A mejorar (revisar etapa vegetativa)
         * 
         * USO BI:
         * - Comparar vs benchmark
         * - Medir mejora ciclo a ciclo
         * - Input para Rotación Anual
         */
        const cosechadas = plantas.filter(p =>
            p.etapa === 'COSECHADA' && p.fechaFin
        )

        const cycleTime = cosechadas.length > 0
            ? Math.round(avg(cosechadas.map(p =>
                daysBetween(p.fechaCreacion, p.fechaFin!)
            )))
            : 100 // Default: 100 días (benchmark estándar)

        /**
         * ========================================
         * KPI #2: RENDIMIENTO POR M²
         * ========================================
         * 
         * DEFINICIÓN:
         * Gramos de producción proyectados por metro cuadrado de cultivo
         * 
         * ALGORITMO:
         * 1. Calcular producción promedio por planta individual
         *    avgProduccion = avg(plantas.map(p => p.produccion))
         * 2. Multiplicar por densidad de cultivo (plantas por m²)
         *    rendimientoM2 = avgProduccion * PLANTS_PER_M2
         * 3. Redondear a entero
         * 
         * FÓRMULA MATEMÁTICA:
         * rendimiento/m² = (Σproducción / count(plantas)) * densidad
         * 
         * PARÁMETROS CULTIVO:
         * - PLANTS_PER_M2 = 4 (estándar indoor con macetas 7-10L)
         * - Alternativas:
         *   · SOG (Sea of Green): 9-16 plantas/m² (macetas pequeñas)
         *   · SCROG (Screen): 1-2 plantas/m² (entrenamiento extensivo)
         *   · Outdoor: Variable según espacio
         * 
         * BENCHMARK INDUSTRIA:
         * - Novato: 250-350 g/m² (LED básico, genética común)
         * - Intermedio: 350-500 g/m² (LED calidad, nutrición balanceada)
         * - Profesional: 500-700 g/m² (HPS/LEC, CO2, control clima)
         * - Élite: >700 g/m² (automatización, genéticas premium)
         * 
         * INTERPRETACIÓN:
         * - <400 g/m²: Mejorar (revisar luz, nutrientes, genética)
         * - 400-600 g/m²: Bueno (estándar comercial)
         * - >600 g/m²: Excelente (nivel profesional)
         * 
         * USO BI:
         * - KPI principal rentabilidad (g/m² * precio/g = ingresos/m²)
         * - Comparar salas (identificar mejor configuración)
         * - Medir ROI inversión (equipamiento vs rendimiento)
         */
        const PLANTS_PER_M2 = 4  // Densidad estándar indoor

        const avgProduccion = plantas.length > 0
            ? avg(plantas.map(p => p.produccion))
            : 0

        const rendimientoM2 = Math.round(avgProduccion * PLANTS_PER_M2)

        /**
         * ========================================
         * KPI #3: TASA ROTACIÓN ANUAL
         * ========================================
         * 
         * DEFINICIÓN:
         * Cantidad de ciclos completos posibles en un año calendario
         * 
         * ALGORITMO:
         * 1. Si cycleTime > 0 (hay datos):
         *    rotacion = 365 días / cycleTime promedio
         * 2. Redondear a 1 decimal con toFixed(1)
         * 3. Si cycleTime === 0 (no hay cosechadas):
         *    retornar "3.6" (benchmark: 365 / 100 días)
         * 
         * FÓRMULA MATEMÁTICA:
         * rotación = 365 días/año / días por ciclo
         * 
         * EJEMPLOS CÁLCULO:
         * - Ciclo 90 días: 365/90 = 4.05 ciclos/año
         * - Ciclo 100 días: 365/100 = 3.65 ciclos/año
         * - Ciclo 120 días: 365/120 = 3.04 ciclos/año
         * 
         * BENCHMARK INDUSTRIA:
         * - Óptimo: 4+ ciclos/año (genéticas rápidas <90d)
         * - Estándar: 3-4 ciclos/año (ciclo 90-120d)
         * - Bajo: <3 ciclos/año (ciclos largos >120d)
         * 
         * INTERPRETACIÓN:
         * - >4 ciclos: Excelente (máxima productividad anual)
         * - 3-4 ciclos: Bueno (estándar comercial)
         * - <3 ciclos: Ineficiente (reevaluar genética o proceso)
         * 
         * USO BI:
         * - Proyección producción anual (rotación * plantas * rendimiento)
         * - Planificación cashflow (ventas por año)
         * - Decisión genéticas (priorizar cepas rápidas si rotación es meta)
         * 
         * NOTA IMPORTANTE:
         * Rotación teórica vs real:
         * - Este KPI asume 0 días entre ciclos (cosecha → siembra inmediata)
         * - En práctica: agregar 7-14 días limpieza/preparación sala
         * - Rotación real ≈ 365 / (cycleTime + diasPreparacion)
         */
        const rotacionAnual = cycleTime > 0
            ? (365 / cycleTime).toFixed(1)  // Número como string con 1 decimal
            : "3.6"  // Default benchmark

        /**
         * ========================================
         * RETORNO: Array de KPIs formateados
         * ========================================
         * 
         * FORMATO:
         * Cada objeto contiene:
         * - title: Nombre descriptivo KPI
         * - value: Valor calculado (number | string)
         * - unit: Unidad de medida
         * - icon: Componente Lucide Icon
         * - color: Clase Tailwind para color
         * - benchmark: Valor de referencia industria
         * 
         * DECISIÓN DISEÑO:
         * Retornar datos puros, no componentes JSX
         * → Componente UI (KpiCard) decide cómo renderizar
         * → Filosofía Socio: separar lógica de presentación
         */
        return [
            {
                title: "Cycle Time Promedio",
                value: cycleTime,
                unit: "días",
                icon: Leaf,
                color: "text-green-500",
                benchmark: 100,
                description: "Tiempo promedio germinación → cosecha"
            },
            {
                title: "Rendimiento/m²",
                value: rendimientoM2,
                unit: "g",
                icon: TrendingUp,
                color: "text-emerald-500",
                benchmark: 500,
                description: "Producción proyectada por metro cuadrado"
            },
            {
                title: "Rotación Anual",
                value: rotacionAnual,
                unit: "ciclos",
                icon: RefreshCw,
                color: "text-blue-500",
                benchmark: "3.5",
                description: "Ciclos completos posibles por año"
            }
        ]
    }, [plantas])  // ✅ Recalcula solo si plantas cambia (React Query invalida)
}
