/**
 * UTILIDADES DE CÁLCULOS ESTADÍSTICOS
 * 
 * Propósito: Helpers para operaciones matemáticas y estadísticas en KPIs BI
 * Uso: Promedios, sumas, tendencias, rankings
 */

/**
 * ALGORITMO: Promedio aritmético (media)
 * 
 * FÓRMULA MATEMÁTICA:
 * avg = Σ(valores) / n
 * donde:
 * - Σ(valores) = suma de todos los valores
 * - n = cantidad de valores
 * 
 * IMPLEMENTACIÓN:
 * 1. Verificar array no vacío (evitar división por 0)
 * 2. Sumar todos los valores con reduce
 * 3. Dividir suma por count
 * 
 * EJEMPLO:
 * avg([100, 200, 300]) → (100+200+300)/3 → 200
 * avg([]) → 0 (caso edge)
 * 
 * USO KPIs:
 * - Cycle Time Promedio
 * - Rendimiento/m² (producción promedio * densidad)
 * - Eventos por Planta
 * - Días promedio por etapa
 * 
 * @param numbers Array de números
 * @returns Promedio o 0 si array vacío
 */
export const avg = (numbers: number[]): number => {
    if (numbers.length === 0) return 0
    const sum = numbers.reduce((acc, n) => acc + n, 0)
    return sum / numbers.length
}

/**
 * ALGORITMO: Suma total
 * 
 * FÓRMULA:
 * sum = valor1 + valor2 + ... + valorN
 * 
 * IMPLEMENTACIÓN:
 * Reduce acumulando desde 0
 * 
 * EJEMPLO:
 * sum([10, 20, 30]) → 60
 * 
 * USO KPIs:
 * - Producción Total Proyectada
 * - Total eventos última semana
 * 
 * @param numbers Array de números
 * @returns Suma total
 */
export const sum = (numbers: number[]): number => {
    return numbers.reduce((acc, n) => acc + n, 0)
}

/**
 * ALGORITMO: Trending (dirección de tendencia)
 * 
 * LÓGICA:
 * Compara últimos 2 valores del array para determinar dirección
 * 
 * CASOS:
 * - Si length < 2: 'stable' (insuficientes datos)
 * - Si último > penúltimo: 'up' ↗ (mejorando)
 * - Si último < penúltimo: 'down' ↘ (empeorando)
 * - Si último === penúltimo: 'stable' ➡ (estable)
 * 
 * EJEMPLO:
 * calculateTrend([100, 150, 200]) → 'up' (200 > 150)
 * calculateTrend([300, 250, 200]) → 'down' (200 < 250)
 * calculateTrend([100]) → 'stable' (solo 1 valor)
 * 
 * USO KPIs:
 * - Tendencia Producción (últimos 3 ciclos)
 * - Health Score temporal
 * - Performance sala (comparación periodos)
 * 
 * @param values Array de valores históricos (más reciente al final)
 * @returns 'up', 'down' o 'stable'
 */
export const calculateTrend = (values: number[]): 'up' | 'down' | 'stable' => {
    if (values.length < 2) return 'stable'

    const last = values[values.length - 1]
    const previous = values[values.length - 2]

    if (last > previous) return 'up'
    if (last < previous) return 'down'
    return 'stable'
}

/**
 * ALGORITMO: Porcentaje de cambio entre 2 valores
 * 
 * FÓRMULA:
 * %change = ((nuevo - viejo) / viejo) * 100
 * 
 * EJEMPLO:
 * percentageChange(100, 150) → +50%
 * percentageChange(200, 150) → -25%
 * 
 * USO KPIs:
 * - Mostrar % mejora/degradación en trending
 * - Comparación vs benchmark
 * 
 * @param oldValue Valor anterior
 * @param newValue Valor nuevo
 * @returns Porcentaje de cambio (positivo = mejora, negativo = degradación)
 */
export const percentageChange = (oldValue: number, newValue: number): number => {
    if (oldValue === 0) return 0 // Evitar división por 0
    return ((newValue - oldValue) / oldValue) * 100
}

/**
 * ALGORITMO: Máximo valor en array
 * 
 * IMPLEMENTACIÓN:
 * Usa Math.max con spread operator
 * 
 * EJEMPLO:
 * max([10, 50, 30]) → 50
 * 
 * USO KPIs:
 * - Escala gráficos (valor máximo para normalizar)
 * - Mejor sala/genética (ranking)
 * 
 * @param numbers Array de números
 * @returns Valor máximo o 0 si vacío
 */
export const max = (numbers: number[]): number => {
    if (numbers.length === 0) return 0
    return Math.max(...numbers)
}

/**
 * ALGORITMO: Mínimo valor en array
 * 
 * IMPLEMENTACIÓN:
 * Usa Math.min con spread operator
 * 
 * EJEMPLO:
 * min([10, 50, 30]) → 10
 * 
 * USO KPIs:
 * - Detectar valores atípicos
 * - Peor performance (análisis)
 * 
 * @param numbers Array de números
 * @returns Valor mínimo o 0 si vacío
 */
export const min = (numbers: number[]): number => {
    if (numbers.length === 0) return 0
    return Math.min(...numbers)
}

/**
 * ALGORITMO: Redondeo a N decimales
 * 
 * FÓRMULA:
 * 1. Multiplicar por 10^decimales
 * 2. Redondear con Math.round
 * 3. Dividir por 10^decimales
 * 
 * EJEMPLO:
 * roundTo(3.14159, 2) → 3.14
 * roundTo(123.456, 1) → 123.5
 * 
 * USO KPIs:
 * - Mostrar valores legibles (ej: 3.6 ciclos/año)
 * - Formateo presentación
 * 
 * @param value Número a redondear
 * @param decimals Cantidad de decimales (default 2)
 * @returns Número redondeado
 */
export const roundTo = (value: number, decimals: number = 2): number => {
    const multiplier = Math.pow(10, decimals)
    return Math.round(value * multiplier) / multiplier
}
