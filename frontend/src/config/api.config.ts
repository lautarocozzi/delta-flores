/**
 * Configuración centralizada de la API
 * Usa variables de entorno para evitar hardcodeo de URLs
 */
export const API_CONFIG = {
    baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080',
    apiPath: `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'}/api`,
    timeout: 10000,
} as const;

/**
 * Helper para construir URLs completas a recursos del backend
 */
export const buildMediaUrl = (relativePath: string): string => {
    if (relativePath.startsWith('http')) {
        return relativePath; // Ya es una URL completa
    }
    return `${API_CONFIG.baseURL}${relativePath}`;
};
