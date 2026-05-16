/**
 * UTILIDADES DE CÁLCULOS DE FECHAS
 * 
 * Propósito: Helpers para operaciones con fechas en KPIs BI
 * Uso: Cycle Time, Días por Etapa, Actividad 24h, Próximas Cosechas
 */

/**
 * ALGORITMO: Diferencia en días entre 2 fechas
 * 
 * FÓRMULA:
 * 1. Convertir ambas fechas a timestamps (milisegundos desde epoch)
 * 2. Calcular diferencia: diffMs = fecha2.getTime() - fecha1.getTime()
 * 3. Convertir a días: días = diffMs / (1000ms * 60s * 60m * 24h)
 * 4. Redondear hacia abajo con Math.floor
 * 
 * EJEMPLO:
 * daysBetween('2024-01-01', '2024-01-31') → 30 días
 * 
 * USO KPIs:
 * - Cycle Time Promedio (fechaCreacion → fechaFin)
 * - Días por Etapa (fechaStageChange → fechaActual)
 * 
 * @param startDate Fecha inicio en formato ISO (yyyy-MM-dd o yyyy-MM-ddTHH:mm:ss)
 * @param endDate Fecha fin en formato ISO
 * @returns Número de días enteros entre las fechas
 */
export const daysBetween = (startDate: string, endDate: string): number => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffMs = end.getTime() - start.getTime()
    return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * ALGORITMO: Días transcurridos desde una fecha hasta hoy
 * 
 * FÓRMULA:
 * 1. Obtener fecha actual: new Date()
 * 2. Convertir a ISO string: toISOString()
 * 3. Reutilizar daysBetween(fecha, hoy)
 * 
 * EJEMPLO:
 * Si hoy es 2024-01-15:
 * daysSince('2024-01-01') → 14 días
 * 
 * USO KPIs:
 * - Actividad últimas 24h (eventos con daysSince < 1)
 * - Próximas Cosechas (plantas en floración con daysSince > 45)
 * - Health Score (riego con daysSince < 3)
 * 
 * @param date Fecha origen en formato ISO
 * @returns Días desde la fecha hasta ahora
 */
export const daysSince = (date: string): number => {
    return daysBetween(date, new Date().toISOString())
}

/**
 * ALGORITMO: Días hasta una fecha futura
 * 
 * FÓRMULA:
 * Similar a daysSince pero invirtiendo orden (futuro - presente)
 * 
 * EJEMPLO:
 * Si hoy es 2024-01-01:
 * daysUntil('2024-01-31') → 30 días
 * 
 * USO KPIs:
 * - Proyección cosecha (estimación días restantes)
 * 
 * @param futureDate Fecha futura en formato ISO
 * @returns Días desde ahora hasta la fecha (negativo si ya pasó)
 */
export const daysUntil = (futureDate: string): number => {
    return daysBetween(new Date().toISOString(), futureDate)
}

/**
 * ALGORITMO: Convertir días a formato legible
 * 
 * LÓGICA:
 * - Si < 7 días: "X días"
 * - Si >= 7 y < 30: "X semanas"
 * - Si >= 30: "X meses"
 * 
 * EJEMPLO:
 * formatDays(5) → "5 días"
 * formatDays(14) → "2 semanas"
 * formatDays(60) → "2 meses"
 * 
 * @param days Número de días
 * @returns String formateado legible
 */
export const formatDays = (days: number): string => {
    if (days < 7) {
        return `${days} día${days !== 1 ? 's' : ''}`
    } else if (days < 30) {
        const weeks = Math.floor(days / 7)
        return `${weeks} semana${weeks !== 1 ? 's' : ''}`
    } else {
        const months = Math.floor(days / 30)
        return `${months} mes${months !== 1 ? 'es' : ''}`
    }
}
