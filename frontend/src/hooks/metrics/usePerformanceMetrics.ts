import { useMemo } from 'react'
import { PlantaDto } from '@/interfaces/Planta'
import { avg } from '../utils/statisticalUtils'
import { Trophy, Building2 } from 'lucide-react'

/**
 * HOOK: M\u00e9tricas de Performance por Segmento
 * 
 * CATEGORÍA BI: Performance Metrics
 * PROPÓSITO: Identificar mejores genéticas y salas
 * 
 * KPIs CALCULADOS:
 * 1. Top 3 Genéticas (ranking por producción)
 * 2. Sala Más Eficiente (mayor rendimiento)
 */
export const usePerformanceMetrics = (plantas: PlantaDto[]) => {
    return useMemo(() => {
        /**
         * ========================================
         * KPI #7: TOP 3 GENÉTICAS
         * ========================================
         * 
         * DEFINICIÓN:
         * Ranking de cepas con mejor rendimiento promedio
         * 
         * ALGORITMO:
         * 1. Agrupar plantas por cepaId
         * 2. Para cada cepa calcular:
         *    - nombre = cepaDto.geneticaParental
         *    - total = sum(producción todas plantas del grupo)
         *    - promedio = avg(producción plantas del grupo)
         *    - count = cantidad plantas del grupo
         * 3. Ordenar por promedio DESC
         * 4. Tomar top 3
         * 
         * ESTRUCTURA RETORNO:
         * [
         *   { nombre: "OG Kush", promedio: 350, total: 1400, count: 4 },
         *   { nombre: "Amnesia", promedio: 320, total: 960, count: 3 },
         *   { nombre: "White Widow", promedio: 310, total: 620, count: 2 }
         * ]
         * 
         * USO BI:
         * - Decidir inversión en semillas/clones
         * - Eliminar genéticas bajo rendimiento
         * - Educar equipo sobre mejores variedades
         */
        if (plantas.length === 0) {
            return [
                {
                    title: "Top 3 Genéticas",
                    value: "Sin datos",
                    icon: Trophy,
                    color: "text-amber-500",
                    type: "ranking",
                    data: [],
                    description: "Ranking cepas por rendimiento promedio"
                },
                {
                    title: "Sala Más Eficiente",
                    value: "N/A",
                    unit: "g/planta",
                    icon: Building2,
                    color: "text-purple-500",
                    description: "Sala con mejor rendimiento promedio"
                }
            ]
        }

        // Agrupar por cepa
        const cepasMap = plantas.reduce((acc, p) => {
            // Skip si no tiene cepaDto (datos incompletos)
            if (!p.cepaDto) return acc

            const cepaId = p.cepaDto.id
            const cepaNombre = p.cepaDto.geneticaParental

            if (!acc[cepaId]) {
                acc[cepaId] = {
                    nombre: cepaNombre,
                    producciones: []
                }
            }

            acc[cepaId].producciones.push(p.produccion)
            return acc
        }, {} as Record<number, { nombre: string, producciones: number[] }>)

        // Calcular métricas y ordenar
        const cepasRanking = Object.values(cepasMap)
            .map(cepa => ({
                nombre: cepa.nombre,
                promedio: Math.round(avg(cepa.producciones)),
                total: cepa.producciones.reduce((sum, p) => sum + p, 0),
                count: cepa.producciones.length
            }))
            .sort((a, b) => b.promedio - a.promedio)  // DESC por promedio
            .slice(0, 3)  // Top 3

        /**
         * ========================================
         * KPI #8: SALA MÁS EFICIENTE
         * ========================================
         * 
         * DEFINICIÓN:
         * Sala con mejor rendimiento promedio por planta
         * 
         * ALGORITMO:
         * 1. Agrupar plantas por salaId
         * 2. Para cada sala calcular:
         *    - nombre = sala.nombre
         *    - promedio = avg(producción plantas del grupo)
         *    - count = cantidad plantas
         * 3. Ordenar por promedio DESC
         * 4. Tomar primera (mejor)
         * 
         * RETORNO:
         * { nombre: "Sala A", promedio: 340, count: 8 }
         * 
         * USO BI:
         * - Replicar condiciones sala exitosa (luz, clima, nutrientes)
         * - Mejorar salas con bajo rendimiento
         * - Decisión inversión equipamiento
         */
        const salasMap = plantas.reduce((acc, p) => {
            // Skip si no tiene sala (datos incompletos)
            if (!p.sala) return acc

            const salaId = p.sala.id
            const salaNombre = p.sala.nombre

            if (!acc[salaId]) {
                acc[salaId] = {
                    nombre: salaNombre,
                    producciones: []
                }
            }

            acc[salaId].producciones.push(p.produccion)
            return acc
        }, {} as Record<number, { nombre: string, producciones: number[] }>)

        const salasRanking = Object.values(salasMap)
            .map(sala => ({
                nombre: sala.nombre,
                promedio: Math.round(avg(sala.producciones)),
                count: sala.producciones.length
            }))
            .sort((a, b) => b.promedio - a.promedio)

        const mejorSala = salasRanking[0] || { nombre: "N/A", promedio: 0, count: 0 }

        return [
            {
                title: "Top 3 Genéticas",
                value: cepasRanking.length > 0 ? `${cepasRanking[0].nombre}` : "Sin datos",
                icon: Trophy,
                color: "text-amber-500",
                type: "ranking",  // Señal para UI: renderizar tabla
                data: cepasRanking,  // Array completo para mini-tabla
                description: "Ranking cepas por rendimiento promedio (g/planta)"
            },
            {
                title: "Sala Más Eficiente",
                value: mejorSala.nombre,
                subtitle: `${mejorSala.promedio}g/planta`,
                unit: `(${mejorSala.count} plantas)`,
                icon: Building2,
                color: "text-purple-500",
                description: "Sala con mejor rendimiento promedio"
            }
        ]
    }, [plantas])
}
