import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layouts/AppSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, KeyRound, Monitor } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";

export default function SecurityPage() {
    const navigate = useNavigate();
    const { user } = useAuthContext();

    const roleLabel = user?.role === 'ROLE_ADMIN' ? 'Admin' : user?.role === 'ROLE_SUPER_ADMIN' ? 'Super Admin' : 'Grower';

    return (
        <SidebarProvider>
            <div className="min-h-screen w-full flex bg-background">
                <AppSidebar />
                <div className="flex-1 overflow-auto">
                    <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-40 shadow-sm">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger />
                            <div>
                                <Badge variant="secondary" className="text-xs mb-1">{roleLabel}</Badge>
                                <h1 className="text-2xl font-bold">Seguridad</h1>
                            </div>
                        </div>
                    </header>

                    <main className="p-6 max-w-4xl mx-auto space-y-6">
                        <Button
                            variant="ghost"
                            className="gap-2"
                            onClick={() => navigate("/profile")}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Volver al perfil
                        </Button>

                        <Card>
                            <CardContent className="p-0">
                                <button
                                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/50 transition-colors border-b last:border-b-0"
                                    onClick={() => navigate("/profile/security/password")}
                                >
                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                        <KeyRound className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">Contraseña</p>
                                        <p className="text-xs text-muted-foreground">Cambiar tu contraseña</p>
                                    </div>
                                    <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
                                </button>

                                <button
                                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/50 transition-colors"
                                    onClick={() => navigate("/profile/security/devices")}
                                >
                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                        <Monitor className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">Dispositivos</p>
                                        <p className="text-xs text-muted-foreground">Sesiones activas y dispositivos conectados</p>
                                    </div>
                                    <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
                                </button>
                            </CardContent>
                        </Card>
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
