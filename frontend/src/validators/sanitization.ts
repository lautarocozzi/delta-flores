/**
 * Helpers de sanitización para entradas de usuario.
 * 
 * ⚠️ DOMPurify se usa donde el contenido renderizado puede contener HTML.
 * Por ahora son wrappers limpios. Cuando se integre DOMPurify:
 *   import DOMPurify from 'dompurify';
 *   export const sanitizeHtml = (dirty: string) => DOMPurify.sanitize(dirty);
 */

/** Elimina espacios al inicio/final y colapsa múltiples espacios */
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
