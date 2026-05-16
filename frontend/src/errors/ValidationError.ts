/**
 * Error especializado para validación de contratos (Zod).
 * 
 * Se dispara cuando el backend devuelve datos que no cumplen
 * el esquema Zod esperado. Útil para depurar contratos rotos
 * y dar feedback al usuario.
 */
export interface ValidationIssue {
  path: string;
  message: string;
  code?: string;
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly issues: ValidationIssue[],
    public readonly context?: string,
  ) {
    super(message);
    this.name = 'ValidationError';
  }

  /** Resumen legible de todos los issues */
  get summary(): string {
    return this.issues
      .map(i => `${i.path}: ${i.message}`)
      .join('; ');
  }
}
