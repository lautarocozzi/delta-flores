import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef, useState } from 'react';
import api from '../utils/api';
import { authService } from '../services/auth';

// BroadcastChannel for multi-tab session sync
const authChannel = typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('flores_delta_auth')
    : null;

// ─── State ─────────────────────────────────────────
interface AuthState {
    user: {
        email: string;
        role: string;
        id: number | null;
        nombre?: string;
        apellido?: string;
        username?: string;
        imagenUrl?: string;
    } | null;
    isAuthenticated: boolean;
}

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
};

// ─── Actions ───────────────────────────────────────
type AuthAction =
    | { type: 'LOGIN'; payload: AuthState['user'] }
    | { type: 'LOGOUT' }
    | { type: 'SET_USER'; payload: AuthState['user'] };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
    switch (action.type) {
        case 'LOGIN':
            return { user: action.payload, isAuthenticated: true };
        case 'LOGOUT':
            return { user: null, isAuthenticated: false };
        case 'SET_USER':
            return { ...state, user: action.payload };
        default:
            return state;
    }
};

// ─── Context ───────────────────────────────────────
interface AuthContextType extends AuthState {
    login: (credentials: { email: string; password: string }) => Promise<any>;
    logout: () => Promise<void>;
    dispatch: React.Dispatch<AuthAction>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Provider ──────────────────────────────────────
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);
    const [loading, setLoading] = useState(true); // true until initial refresh resolves
    const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ─── Ref to prevent self-triggered reload on LOGIN broadcast ─
    // BroadcastChannel delivers to ALL tabs including the sender,
    // so we need to skip the reload when WE initiated the LOGIN.
    const skipNextLoginReload = useRef(false);

    // ─── Attempt session restore on mount ─────────
    const restoreSession = useCallback(async () => {
        try {
            const response = await api.post('/api/auth/refresh');
            const { access_token, username, role, user_id } = response.data;

            // Store access token in memory
            authService.setAccessToken(access_token);

            // Fetch full user profile
            let userProfile = null;
            try {
                const meResponse = await api.get('/api/auth/me');
                userProfile = meResponse.data;
            } catch {
                // If /me fails during restore, use minimal data from refresh
            }

            dispatch({
                type: 'LOGIN',
                payload: {
                    email: username,
                    role: role || 'ROLE_GROWER',
                    id: userProfile?.id ?? user_id,
                    nombre: userProfile?.nombre,
                    apellido: userProfile?.apellido,
                    username: userProfile?.username,
                    imagenUrl: userProfile?.imagenUrl,
                },
            });

            // Notify other tabs (skip self-reload)
            skipNextLoginReload.current = true;
            authChannel?.postMessage({ type: 'LOGIN' });
        } catch {
            // No valid refresh token → user needs to log in
            authService.clearAccessToken();
            dispatch({ type: 'LOGOUT' });
        } finally {
            setLoading(false);
        }
    }, []);

    // ─── Proactive token refresh ─────────────────
    // Refresh access token every 25 minutes (tokens last 30min)
    const startRefreshInterval = useCallback(() => {
        if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = setInterval(async () => {
            try {
                const response = await api.post('/api/auth/refresh');
                authService.setAccessToken(response.data.access_token);
            } catch {
                // If proactive refresh fails (e.g., network blip), 
                // the 401 interceptor will handle it
            }
        }, 25 * 60 * 1000); // 25 minutes
    }, []);

    const stopRefreshInterval = useCallback(() => {
        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
            refreshIntervalRef.current = null;
        }
    }, []);

    // ─── Listen for forced logout from interceptor ─
    useEffect(() => {
        const handleForceLogout = () => {
            stopRefreshInterval();
            authService.clearAccessToken();
            dispatch({ type: 'LOGOUT' });
            authChannel?.postMessage({ type: 'LOGOUT' });
        };

        window.addEventListener('auth:logout', handleForceLogout);
        return () => window.removeEventListener('auth:logout', handleForceLogout);
    }, [stopRefreshInterval]);

    // ─── Initial session restore ─────────────────
    useEffect(() => {
        restoreSession();
    }, [restoreSession]);

    // ─── Start/stop refresh interval on auth change ─
    useEffect(() => {
        if (state.isAuthenticated) {
            startRefreshInterval();
        } else {
            stopRefreshInterval();
        }
        return () => stopRefreshInterval();
    }, [state.isAuthenticated, startRefreshInterval, stopRefreshInterval]);

    // ─── Multi-tab sync ──────────────────────────
    useEffect(() => {
        if (!authChannel) return;

        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'LOGOUT') {
                stopRefreshInterval();
                authService.clearAccessToken();
                dispatch({ type: 'LOGOUT' });
            } else if (event.data.type === 'LOGIN') {
                // Skip reload if WE sent this LOGIN (BroadcastChannel
                // delivers to the sender too). Avoids infinite reload loop.
                if (skipNextLoginReload.current) {
                    skipNextLoginReload.current = false;
                    return;
                }
                // Another tab logged in → reload to pick up the session
                window.location.reload();
            }
        };

        authChannel.addEventListener('message', handleMessage);
        return () => authChannel.removeEventListener('message', handleMessage);
    }, [stopRefreshInterval]);

    // ─── Login ───────────────────────────────────
    const login = async (credentials: { email: string; password: string }): Promise<{ access_token: string }> => {
        try {
            const payload = { username: credentials.email, password: credentials.password };
            const response = await api.post('/login', payload);

            const { access_token, username, roles, user_id } = response.data;
            const role = roles && roles.length > 0 ? roles[0].authority : 'ROLE_GROWER';

            // Store access token in memory
            authService.setAccessToken(access_token);

            // Fetch full profile
            let userProfile = null;
            try {
                const meResponse = await api.get('/api/auth/me');
                userProfile = meResponse.data;
            } catch {
                // Fallback to minimal data
            }

            const user = {
                email: username,
                role: role,
                id: userProfile?.id ?? user_id ?? null,
                nombre: userProfile?.nombre,
                apellido: userProfile?.apellido,
                username: userProfile?.username,
                imagenUrl: userProfile?.imagenUrl,
            };

            dispatch({ type: 'LOGIN', payload: user });
            skipNextLoginReload.current = true;
            authChannel?.postMessage({ type: 'LOGIN' });

            return response;
        } catch (error: unknown) {
            if (error instanceof Error && error.message.includes('401')) {
                throw new Error('Credenciales incorrectas. Verifica tu email y contraseña.');
            }
            throw error;
        }
    };

    // ─── Logout ──────────────────────────────────
    const logout = async () => {
        try {
            await api.post('/api/auth/logout');
        } catch {
            // Server logout is best-effort
        } finally {
            stopRefreshInterval();
            authService.clearAccessToken();
            dispatch({ type: 'LOGOUT' });
            authChannel?.postMessage({ type: 'LOGOUT' });
        }
    };

    return (
        <AuthContext.Provider value={{
            user: state.user,
            isAuthenticated: state.isAuthenticated,
            login,
            logout,
            dispatch,
            loading,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// ─── Hook ──────────────────────────────────────────
export const useAuthContext = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
    return ctx;
};
