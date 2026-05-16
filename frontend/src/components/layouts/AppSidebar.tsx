import { Home, Leaf, Settings, LogOut, User, Heart, BookOpen } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuthContext } from "@/contexts/AuthContext";

// Menu items reordered: Inicio, Plantas, Favoritos, Bitácoras, Panel de Control
const menuItems = [
  { id: 'inicio', label: 'Inicio', icon: Home, path: '/dashboard' },
  { id: 'plantas', label: 'Plantas', icon: Leaf, path: '/plantas' },
  { id: 'favoritos', label: 'Favoritos', icon: Heart, path: '/favoritos' },
  { id: 'bitacoras', label: 'Bitácoras', icon: BookOpen, path: '/bitacora-maestra' },
  { id: 'panel', label: 'Panel de Control', icon: Settings, path: '/configuracion' },
];

export function AppSidebar() {
  const { logout } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarContent>
        {/* Logo section - using logoweb.png image (bigger) */}
        <div className="p-4 flex items-center space-x-3 mb-2">
          <img
            src="/logoweb.png"
            alt="Flores Delta"
            className="h-12 w-12 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <span className="text-xl font-black text-foreground">
            Flores <span className="text-primary">Delta</span>
          </span>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.path)}
                      className={isActive ? "bg-primary/20 text-primary font-medium" : ""}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => navigate('/profile')} className="hover:bg-accent/50">
              <div className="flex items-center gap-2">
                <div className="bg-primary/20 p-1 rounded-full"><User size={16} className="text-primary" /></div>
                <span>Mi Perfil</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-destructive hover:bg-destructive/20 mt-1">
              <LogOut size={20} />
              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
