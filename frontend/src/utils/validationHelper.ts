import { z } from 'zod';
import { ValidationError } from '@/errors';

/**
 * Helper de Validación Runtime con Zod
 * 
 * Propósito: Validar respuestas del backend en MUTACIONES (POST/PUT/DELETE)
 * para garantizar type-safety completo y detección temprana de contratos rotos.
 * 
 * Uso:
 * ```typescript
 * const createdPlanta = validateResponse(
 *   PlantaDtoSchema, 
 *   response.data, 
 *   'POST /api/plantas'
 * );
 * ```
 */

export const validateResponse = <T>(
    schema: z.ZodType<T>,
    data: unknown,
    context: string
): T => {
    const result = schema.safeParse(data);

    if (!result.success) {
        console.error(`❌ Validación fallida en ${context}:`, {
            errors: result.error.issues,
            receivedData: data,
        });

        throw new ValidationError(
            `Backend violó contrato en ${context}`,
            result.error.issues.map(i => ({
                path: i.path.join('.'),
                message: i.message,
                code: i.code,
            })),
            context,
        );
    }

    return result.data;
};

/**
 * Validador de arrays para endpoints que retornan múltiples recursos
 */
export const validateArrayResponse = <T>(
    schema: z.ZodType<T>,
    data: unknown,
    context: string
): T[] => {
    return validateResponse(z.array(schema), data, context);
};
