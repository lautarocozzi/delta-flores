import { Home, Users, PlusCircle, BookOpen, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useRegistroEventoFormStore } from '@/stores/useRegistroEventoFormStore';

/**
 * MobileBottomNav - Navegación inferior para dispositivos móviles
 * 
 * Inspirado en GWJ pero con estética FD:
 * - FAB central para acciones rápidas
 * - 4 tabs de navegación principales
 * - Solo visible en viewport < 768px
 */

interface NavItem {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    path: string | null;
    action?: 'openMenu';
}

const navItems: NavItem[] = [
    { icon: Home, label: 'Inicio', path: '/dashboard' },
    { icon: Users, label: 'Comunidad', path: '/comunidad' },
    { icon: PlusCircle, label: '', path: null, action: 'openMenu' }, // FAB central
    { icon: BookOpen, label: 'Bitácora', path: '/bitacora' },
    { icon: User, label: 'Perfil', path: '/profile' },
];

export function MobileBottomNav() {
    const navigate = useNavigate();
    const location = useLocation();
    const { openMenu } = useRegistroEventoFormStore();

    const handleNavClick = (item: NavItem) => {
        if (item.action === 'openMenu') {
            openMenu();
        } else if (item.path) {
            navigate(item.path);
        }
    };

    const isActive = (path: string | null) => {
        if (!path) return false;
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map((item, index) => {
                    const Icon = item.icon;
                    const isFab = item.action === 'openMenu';
                    const active = isActive(item.path);

                    if (isFab) {
                        // FAB Central - Botón de acción rápida
                        return (
                            <button
                                key={index}
                                onClick={() => handleNavClick(item)}
                                className="relative -mt-6 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
                                aria-label="Nuevo registro"
                            >
                                <Icon className="w-7 h-7" />
                            </button>
                        );
                    }

                    // Iconos de navegación normales
                    return (
                        <button
                            key={index}
                            onClick={() => handleNavClick(item)}
                            className={cn(
                                'flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors',
                                active
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                            aria-label={item.label}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="text-xs font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Safe area para dispositivos con notch */}
            <div className="h-safe-area-inset-bottom bg-card" />
        </nav>
    );
}
