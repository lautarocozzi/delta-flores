import { z } from 'zod';
import { sanitizeText, normalizeWhitespace } from './sanitization';

// ──────────────────────────────────────────────
// Configuración compartida para strings
// ──────────────────────────────────────────────

interface StringFieldOptions {
  /** Longitud máxima (default: sin límite) */
  max?: number;
  /** Mensaje de error personalizado para max */
  maxMessage?: string;
  /** Capitaliza automáticamente la primera letra */
  capitalize?: boolean;
}

interface RequiredStringOptions extends StringFieldOptions {
  /** Longitud mínima (default: 1) */
  min?: number;
  /** Mensaje de error personalizado para min */
  minMessage?: string;
}

// ──────────────────────────────────────────────
// Transformers reutilizables
// ──────────────────────────────────────────────

/**
 * String requerido con sanitización completa:
 * - strip HTML
 * - trim + colapsar whitespace
 * - longitud controlada
 * - opcionalmente capitaliza
 *
 * @example
 * const schema = z.object({
 *   nombre: sanitizedString({ min: 1, max: 100, label: "Nombre" }),
 * });
 */
export const sanitizedString = (options: RequiredStringOptions = {}) => {
  const {
    min = 1,
    minMessage,
    max,
    maxMessage,
    capitalize,
  } = options;

  let schema = z
    .string({ required_error: 'Este campo es requerido' })
    .min(min, minMessage || `Mínimo ${min} carácter(es)`)
    .transform((val) => sanitizeText(val, { capitalize }));

  if (max !== undefined) {
    schema = schema.pipe(
      z.string().max(max, maxMessage || `Máximo ${max} caracteres`),
    );
  }

  return schema;
};

/**
 * String opcional con sanitización:
 * - strip HTML
 * - trim + colapsar whitespace
 * - convierte "" en undefined
 * - longitud controlada
 *
 * @example
 * const schema = z.object({
 *   descripcion: optionalSanitizedString({ max: 500 }),
 * });
 */
export const optionalSanitizedString = (options: StringFieldOptions = {}) => {
  const { max, maxMessage, capitalize } = options;

  let schema = z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === '') return undefined;
      return sanitizeText(val, { capitalize });
    });

  if (max !== undefined) {
    schema = schema.pipe(
      z
        .string()
        .max(max, maxMessage || `Máximo ${max} caracteres`)
        .optional(),
    );
  }

  return schema;
};

// ──────────────────────────────────────────────
// Transformers numéricos
// ──────────────────────────────────────────────

interface NumericFieldOptions {
  /** Etiqueta para mensajes de error */
  label?: string;
  /** Permitir null como valor válido */
  nullable?: boolean;
  /** Valor mínimo */
  min?: number;
  /** Valor máximo */
  max?: number;
}

/**
 * Campo que acepta string numérico y lo transforma a number o null.
 *
 * @example
 * const schema = z.object({
 *   humedad: numericString({ label: "Humedad", nullable: true }),
 *   peso: numericString({ label: "Peso", nullable: false }),
 * });
 */
export const numericString = (options: NumericFieldOptions = {}) => {
  const { label = 'Este campo', nullable = true, min, max } = options;

  let schema = z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === '') return nullable ? null : undefined;
      const parsed = parseFloat(val);
      if (isNaN(parsed)) {
        throw new Error(`${label} debe ser un número válido`);
      }
      return parsed;
    });

  if (min !== undefined || max !== undefined) {
    schema = schema.pipe(
      z
        .number()
        .min(min ?? -Infinity, `${label} mínimo ${min}`)
        .max(max ?? Infinity, `${label} máximo ${max}`)
        .nullable()
        .optional(),
    );
  }

  return schema;
};

/**
 * String de "horas luz" típico (ej: "18/6", "24/0", "12/12").
 * Valida formato y normaliza whitespace.
 *
 * @example
 * const schema = z.object({
 *   horasLuz: horasLuzString(),
 * });
 */
export const horasLuzString = (options: { optional?: boolean } = {}) => {
  const baseSchema = z
    .string()
    .regex(/^\d{1,2}\/\d{1,2}$/, 'Formato inválido. Usá HH/MM (ej: 18/6)')
    .transform(normalizeWhitespace);

  if (options.optional) {
    return z
      .string()
      .optional()
      .transform((val) => {
        if (!val || val.trim() === '') return undefined;
        return normalizeWhitespace(val);
      })
      .pipe(
        z
          .string()
          .regex(/^\d{1,2}\/\d{1,2}$/, 'Formato inválido. Usá HH/MM (ej: 18/6)')
          .optional(),
      );
  }

  return baseSchema;
};

// ──────────────────────────────────────────────
// Tipo de ambiente — reutilizable
// ──────────────────────────────────────────────

export const tipoAmbienteSchema = z
  .enum(['INTERIOR', 'EXTERIOR'])
  .optional();
