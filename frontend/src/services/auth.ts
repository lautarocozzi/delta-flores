/**
 * Servicio de autenticación profesional
 * 
 * ✅ Access token: se almacena en MEMORIA (variable JS)
 *    → NO en localStorage, NO en sessionStorage
 *    → Seguridad: XSS no puede robar el token
 * 
 * ✅ Refresh token: viaja en cookie HttpOnly (backend)
 *    → El frontend nunca lo toca
 *    → Se renueva automáticamente en /api/auth/refresh
 * 
 * ✅ Al recargar la página:
 *    1. El access token se pierde (estaba en memoria)
 *    2. AuthContext llama a /api/auth/refresh
 *    3. El backend lee la refresh_token cookie
 *    4. Devuelve un nuevo access token
 *    5. La sesión continúa sin pedir login
 */

let accessToken: string | null = null;

class AuthService {
    /**
     * Guarda el access token en MEMORIA (seguro contra XSS)
     */
    setAccessToken(token: string): void {
        accessToken = token;
    }

    /**
     * Recupera el access token desde memoria
     */
    getAccessToken(): string | null {
        return accessToken;
    }

    /**
     * Limpia el token en memoria (logout)
     */
    clearAccessToken(): void {
        accessToken = null;
    }

    /**
     * ¿Hay sesión activa?
     * Verifica si tenemos access token EN MEMORIA.
     * En startup esto es false → AuthContext llama a refresh.
     */
    hasSession(): boolean {
        return accessToken !== null;
    }
}

export const authService = new AuthService();
