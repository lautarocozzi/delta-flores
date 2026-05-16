/**
 * Error personalizado para respuestas del backend.
 * 
 * Reemplaza `throw new Error(msg)` en servicios API.
 * Lleva status HTTP, código de error, y detalles adicionales.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Responde al interceptor 401 */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /** Responde al interceptor 403 */
  get isForbidden(): boolean {
    return this.status === 403;
  }

  /** Error de validación del lado del servidor (400) */
  get isValidationError(): boolean {
    return this.status === 400;
  }

  static fromAxiosError(error: unknown): ApiError {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosErr = error as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };
      return new ApiError(
        axiosErr.response?.data?.message || axiosErr.message || 'Error de conexión',
        axiosErr.response?.status,
      );
    }
    return new ApiError(
      error instanceof Error ? error.message : 'Error desconocido',
    );
  }
}
