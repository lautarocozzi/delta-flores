/**
 * Helpers de sanitización para entradas de usuario.
 *
 * Capa base de string → string limpio.
 * Los transformers de Zod (zodTransformers.ts) construyen sobre esto.
 */

/** Elimina espacios al inicio/final y colapsa múltiples espacios internos */
export const normalizeWhitespace = (value: string): string =>
  value.trim().replace(/\s+/g, ' ');

/** Capitaliza la primera letra */
export const capitalize = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1);

/** Trunca un string a N caracteres, agregando "…" si es necesario */
export const truncate = (value: string, maxLength: number): string =>
  value.length > maxLength ? value.slice(0, maxLength) + '…' : value;

/** Sanitiza un string para logging (máximo 200 chars, sin saltos de línea) */
export const sanitizeForLog = (value: string): string =>
  truncate(value.replace(/[\r\n]+/g, ' '), 200);

/**
 * Elimina etiquetas HTML/XML del string.
 * Útil como primera línea de defensa contra XSS en inputs de texto.
 */
export const stripHtml = (value: string): string =>
  value.replace(/<[^>]*>/g, '');

/**
 * Sanitización completa para texto ingresado por usuario:
 * 1. Saca HTML tags
 * 2. Normaliza whitespace
 * 3. Opcionalmente capitaliza
 */
export const sanitizeText = (value: string, options?: { capitalize?: boolean }): string => {
  let result = stripHtml(value);
  result = normalizeWhitespace(result);
  if (options?.capitalize) {
    result = capitalize(result);
  }
  return result;
};
