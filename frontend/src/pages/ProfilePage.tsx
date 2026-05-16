import { useAuthContext } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layouts/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Shield, Activity, Settings, Key, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { useMemo } from "react";

export default function ProfilePage() {
    const { user } = useAuthContext();
    const navigate = useNavigate();

    // Fetch user's activity stats
    const { data: userPlantas = [] } = useQuery({
        queryKey: ['plantas'],
        queryFn: apiService.getPlantas,
        staleTime: 1000 * 60 * 5,
    });

    const { data: userEvents = [] } = useQuery({
        queryKey: ['allEventsForMetrics'],
        queryFn: () => apiService.getAllEventsForCurrentUser(),
        staleTime: 1000 * 60 * 5,
    });

    const activityStats = useMemo(() => {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);

        const recentEvents = userEvents.filter(event =>
            new Date(event.fecha) >= lastWeek
        );

        return {
            totalPlantas: userPlantas.length,
            totalEventos: userEvents.length,
            eventosRecientes: recentEvents.length,
            plantasFloración: userPlantas.filter(p => p.etapa === 'FLORACION').length,
        };
    }, [userPlantas, userEvents]);

    if (!user) {
        return (
            <SidebarProvider>
                <div className="min-h-screen w-full flex bg-background">
                    <AppSidebar />
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-muted-foreground">Cargando perfil...</p>
                    </div>
                </div>
            </SidebarProvider>
        );
    }

    return (
        <SidebarProvider>
            <div className="min-h-screen w-full flex bg-background">
                <AppSidebar />
                <div className="flex-1 overflow-auto">
                    <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-40 shadow-sm">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger />
                            <div>
                                <h1 className="text-2xl font-bold">Mi Perfil</h1>
                                <p className="text-sm text-muted-foreground">Información de cuenta y estadísticas</p>
                            </div>
                        </div>
                    </header>

                    <main className="p-6 max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Profile Card */}
                            <Card className="lg:col-span-1">
                                <CardHeader className="text-center">
                                    <Avatar className="h-24 w-24 mx-auto mb-4">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.nombre || 'User'}`} />
                                        <AvatarFallback>{user.nombre?.[0] || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <CardTitle className="text-xl">{user.nombre} {user.apellido}</CardTitle>
                                    <CardDescription>{user.email}</CardDescription>
                                    <div className="mt-2">
                                        <Badge variant="secondary" className="text-sm">
                                            {user.roles && user.roles.length > 0 ? user.roles[0] : 'Grower'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="text-center py-4 border-t">
                                        <p className="text-sm text-muted-foreground mb-2">Actividad Total</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-2xl font-bold text-primary">{activityStats.totalPlantas}</p>
                                                <p className="text-xs text-muted-foreground">Plantas</p>
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-primary">{activityStats.totalEventos}</p>
                                                <p className="text-xs text-muted-foreground">Eventos</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Main Content */}
                            <div className="lg:col-span-2">
                                <Tabs defaultValue="info" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="info">
                                            <User className="w-4 h-4 mr-2" />
                                            Información
                                        </TabsTrigger>
                                        <TabsTrigger value="activity">
                                            <Activity className="w-4 h-4 mr-2" />
                                            Actividad
                                        </TabsTrigger>
                                        <TabsTrigger value="settings">
                                            <Settings className="w-4 h-4 mr-2" />
                                            Configuración
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="info" className="space-y-4">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Información Personal</CardTitle>
                                                <CardDescription>Detalles de tu cuenta</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="flex items-center p-3 border rounded-lg">
                                                    <User className="w-5 h-5 mr-3 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium">Nombre Completo</p>
                                                        <p className="text-sm text-muted-foreground">{user.nombre} {user.apellido}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center p-3 border rounded-lg">
                                                    <Mail className="w-5 h-5 mr-3 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium">Email</p>
                                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center p-3 border rounded-lg">
                                                    <Shield className="w-5 h-5 mr-3 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium">Permisos</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {user.roles?.includes('ADMIN') ? 'Acceso Total (Admin)' : 'Acceso Estándar (Grower)'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    <TabsContent value="activity" className="space-y-4">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Resumen de Actividad</CardTitle>
                                                <CardDescription>Tus estadísticas de cultivo</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div className="p-4 border rounded-lg text-center">
                                                        <p className="text-3xl font-bold text-primary">{activityStats.totalPlantas}</p>
                                                        <p className="text-sm text-muted-foreground mt-1">Plantas Totales</p>
                                                    </div>
                                                    <div className="p-4 border rounded-lg text-center">
                                                        <p className="text-3xl font-bold text-primary">{activityStats.plantasFloración}</p>
                                                        <p className="text-sm text-muted-foreground mt-1">En Floración</p>
                                                    </div>
                                                    <div className="p-4 border rounded-lg text-center">
                                                        <p className="text-3xl font-bold text-primary">{activityStats.totalEventos}</p>
                                                        <p className="text-sm text-muted-foreground mt-1">Eventos Totales</p>
                                                    </div>
                                                    <div className="p-4 border rounded-lg text-center">
                                                        <p className="text-3xl font-bold text-primary">{activityStats.eventosRecientes}</p>
                                                        <p className="text-sm text-muted-foreground mt-1">Eventos (7 días)</p>
                                                    </div>
                                                </div>
                                                <div className="mt-6 text-center">
                                                    <Button variant="outline" onClick={() => navigate('/bitacora-maestra')}>
                                                        <Calendar className="w-4 h-4 mr-2" />
                                                        Ver Bitácora Completa
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    <TabsContent value="settings" className="space-y-4">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Configuración de Cuenta</CardTitle>
                                                <CardDescription>Gestiona tu cuenta y preferencias</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="p-4 border rounded-lg">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <Key className="w-5 h-5 text-muted-foreground" />
                                                            <div>
                                                                <p className="text-sm font-medium">Cambiar Contraseña</p>
                                                                <p className="text-xs text-muted-foreground">Actualiza tu contraseña de acceso</p>
                                                            </div>
                                                        </div>
                                                        <Button variant="outline" size="sm" disabled>
                                                            Próximamente
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="p-4 border rounded-lg bg-muted/30">
                                                    <p className="text-sm text-muted-foreground">
                                                        Más opciones de configuración estarán disponibles próximamente.
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
