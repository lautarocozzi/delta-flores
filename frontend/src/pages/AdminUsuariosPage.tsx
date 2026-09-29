import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layouts/AppSidebar";
import { UsuariosManager } from "@/components/panels/UsuariosManager";
import { useAuthContext } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export default function AdminUsuariosPage() {
  const { user } = useAuthContext();
  const isAdmin = user?.role === "ROLE_ADMIN" || user?.role === "ROLE_SUPER_ADMIN";

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <SidebarProvider>
      <div
        className="min-h-screen w-full flex relative"
        style={{
          backgroundImage: 'url(/images/background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0 bg-background/60 pointer-events-none" style={{ position: 'fixed' }} />
        <AppSidebar />
        <div className="flex-1 overflow-auto relative z-10">
          <header className="bg-card/70 backdrop-blur-sm border-b border-border px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-40 shadow-lg">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold text-foreground flex items-center">
                <ShieldAlert className="mr-3 text-primary" />
                Administración de Usuarios
              </h1>
            </div>
          </header>
          <main className="p-4 sm:p-6 lg:p-8">
            <UsuariosManager />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
