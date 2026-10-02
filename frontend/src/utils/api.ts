import axios from 'axios';
import { authService } from '../services/auth';

// Same-origin on the dev server so /api is proxied by Vite.
// A hardcoded localhost:8080 fails from another machine on the LAN
// (the browser calls its own localhost and gets connection refused).
function resolveBackendUrl(): string {
    if (typeof window !== "undefined") {
        const port = window.location.port;
        if (port === "5173" || port === "8081") {
            return "";
        }
    }
    const configured = import.meta.env.VITE_BACKEND_URL as string | undefined;
    if (!configured) return "http://localhost:8080";
    return configured.replace(/\/$/, "");
}

const urlBase = resolveBackendUrl();

export { urlBase };

// Create axios instance
const api = axios.create({
    baseURL: urlBase,
    withCredentials: true,  // Sends HttpOnly cookies (refresh_token)
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// ────────────────────────────────────────────
// REQUEST INTERCEPTOR: Attach Bearer token
// ────────────────────────────────────────────
api.interceptors.request.use(
    (config) => {
        const token = authService.getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ────────────────────────────────────────────
// RESPONSE INTERCEPTOR: Auto-refresh on 401
// ────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Only attempt refresh on 401 and if we haven't already retried
        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        // Don't try to refresh if the failing request IS the refresh endpoint
        if (originalRequest.url?.includes('/api/auth/refresh')) {
            authService.clearAccessToken();
            return Promise.reject(error);
        }

        // If already refreshing, queue this request
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                })
                .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            // Call refresh endpoint — the refresh_token cookie is sent automatically
            // MUST use `api` (not raw `axios`) to preserve browser User-Agent
            const response = await api.post('/api/auth/refresh');

            const newToken = response.data.access_token;
            authService.setAccessToken(newToken);

            // Process queued requests with new token
            processQueue(null, newToken);

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError, null);
            authService.clearAccessToken();
            // Dispatch custom event so AuthContext can react
            window.dispatchEvent(new CustomEvent('auth:logout'));
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

// Zod validation error interceptor (kept from original)
api.interceptors.response.use(
    response => response,
    error => {
        if (error.message?.includes("Invalid server response")) {
            import('@/components/ui/use-toast').then(({ toast }) => {
                toast({
                    variant: "destructive",
                    title: "Error de Validación",
                    description: "El servidor retornó datos inválidos. Verifica la consola o contacta soporte.",
                    duration: 5000,
                });
            });
        }
        return Promise.reject(error);
    }
);

export default api;
