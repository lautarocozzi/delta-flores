import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layouts/AppSidebar";
import { MassNutrientForm } from "@/components/forms/MassNutrientForm";
import { SalasManager } from "@/components/panels/SalasManager";
import { GeneticasManager } from "@/components/panels/GeneticasManager";
import { NutrientesManager } from "@/components/panels/NutrientesManager";
import { UsuariosManager } from "@/components/panels/UsuariosManager";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { WeeklyActivityChart } from "@/components/dashboard/WeeklyActivityChart";
import { Sprout, MapPin, Droplets, Flower2, Users, FlaskConical, Leaf, Calendar, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useKPIsBI } from "@/hooks/useKPIsBI";  // ✅ NUEVO: Hook BI profesional
import { KpiCategorySection } from "@/components/dashboard/KpiCategorySection";  // ✅ NUEVO
import { KpiCardSkeleton } from "@/components/shared/skeletons/KpiCardSkeleton";  // ✅ NUEVO

interface PanelControlProps {
    defaultTab?: string;
}

export default function PanelControl({ defaultTab = "general" }: PanelControlProps) {
    const [searchParams] = useSearchParams();
    const tabFromUrl = searchParams.get('tab') || defaultTab;
    const { user } = useAuthContext();
    const isAdmin = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_SUPER_ADMIN';

    // Fetch data for KPIs
    const { data: plantas = [] } = useQuery({
        queryKey: ['plantas'],
        queryFn: apiService.getPlantas,
        staleTime: 1000 * 60 * 5,
    });

    const { data: allEvents = [] } = useQuery({
        queryKey: ['allEventsForMetrics'],
        queryFn: () => apiService.getAllEventsForCurrentUser(),
        staleTime: 1000 * 60 * 5,
    });

    /**
     * ✅ NUEVO: Hook KPIs BI Profesional
     * Reemplaza useDashboardLogic con sistema completo de 11 KPIs
     * Referencia: ARQUITECTURA_TECNICA_KPIS.md
     */
    const { byCategory, all: allKpis } = useKPIsBI(plantas, allEvents);

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
                {/* Background overlay */}
                <div className="absolute inset-0 bg-background/60 pointer-events-none" style={{ position: 'fixed' }} />

                <AppSidebar />
                <div className="flex-1 overflow-auto relative z-10">
                    <header className="bg-card/70 backdrop-blur-sm border-b border-border px-6 py-4 sticky top-0 z-40 shadow-sm">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger />
                            <h1 className="text-2xl font-bold">Panel de Control</h1>
                        </div>
                    </header>

                    <main className="p-6">
                        <Tabs defaultValue={tabFromUrl} className="space-y-6">
                            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto gap-2 bg-muted/50 p-1">
                                <TabsTrigger value="general" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                    <Sprout className="w-4 h-4 mr-2" /> General
                                </TabsTrigger>
                                <TabsTrigger value="salas" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                    <MapPin className="w-4 h-4 mr-2" /> Salas
                                </TabsTrigger>
                                <TabsTrigger value="geneticas" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                    <Flower2 className="w-4 h-4 mr-2" /> Genéticas
                                </TabsTrigger>
                                <TabsTrigger value="nutrientes-lista" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                    <FlaskConical className="w-4 h-4 mr-2" /> Productos
                                </TabsTrigger>
                                <TabsTrigger value="nutrientes" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                    <Droplets className="w-4 h-4 mr-2" /> Riegos
                                </TabsTrigger>
                                {isAdmin && (
                                    <TabsTrigger value="usuarios" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                        <Users className="w-4 h-4 mr-2" /> Usuarios
                                    </TabsTrigger>
                                )}
                            </TabsList>

                            <TabsContent value="general" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>🎯 Resumen Administrativo</CardTitle>
                                        <CardDescription>
                                            Análisis profesional de métricas clave: eficiencia, calidad, performance y tendencias.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* ✅ HERO METRICS: 4 KPIs principales (grid destacado) */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {plantas.length === 0 ? (
                                                // SKELETON durante carga inicial
                                                <>
                                                    <KpiCardSkeleton />
                                                    <KpiCardSkeleton />
                                                    <KpiCardSkeleton />
                                                    <KpiCardSkeleton />
                                                </>
                                            ) : (
                                                // DATOS REALES
                                                <>
                                                    {byCategory.operational[0] && <KpiCard {...byCategory.operational[0]} />}
                                                    {byCategory.operational[1] && <KpiCard {...byCategory.operational[1]} />}
                                                    {byCategory.quality[0] && <KpiCard {...byCategory.quality[0]} />}
                                                    {byCategory.temporal[2] && <KpiCard {...byCategory.temporal[2]} />}
                                                </>
                                            )}
                                        </div>

                                        {/* ✅ CATEGORÍAS COLAPSABLES: KPIs secundarios organizados */}
                                        <div className="space-y-4 mt-8">
                                            <KpiCategorySection
                                                title="⚡ Eficiencia Operativa"
                                                color="border-green-500"
                                                kpis={byCategory.operational}
                                            />

                                            <KpiCategorySection
                                                title="🌱 Calidad y Salud"
                                                color="border-blue-500"
                                                kpis={byCategory.quality}
                                                defaultCollapsed
                                            />

                                            <KpiCategorySection
                                                title="🏆 Performance por Segmento"
                                                color="border-purple-500"
                                                kpis={byCategory.performance}
                                                defaultCollapsed
                                            />

                                            <KpiCategorySection
                                                title="📈 Análisis Temporal"
                                                color="border-orange-500"
                                                kpis={byCategory.temporal}
                                                defaultCollapsed
                                            />
                                        </div>

                                        {/* Weekly Activity Chart */}
                                        <div className="mt-8 pt-6 border-t border-border">
                                            <WeeklyActivityChart events={allEvents} />
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="nutrientes">
                                <Card className="bg-card/30 backdrop-blur-sm border-2 border-primary/50">
                                    <CardHeader>
                                        <CardTitle>Aplicación Masiva</CardTitle>
                                        <CardDescription>Registra riegos o fertilización para múltiples plantas.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <MassNutrientForm />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="nutrientes-lista">
                                <Card className="bg-card/30 backdrop-blur-sm border-2 border-primary/50">
                                    <CardHeader>
                                        <CardTitle>Catálogo de Nutrientes</CardTitle>
                                        <CardDescription>Gestiona tu catálogo de productos fertilizantes.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <NutrientesManager />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="salas">
                                <Card className="bg-card/30 backdrop-blur-sm border-2 border-primary/50">
                                    <CardHeader>
                                        <CardTitle>Gestión de Salas</CardTitle>
                                        <CardDescription>Administra tus espacios de cultivo.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <SalasManager />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="geneticas">
                                <Card className="bg-card/30 backdrop-blur-sm border-2 border-primary/50">
                                    <CardHeader>
                                        <CardTitle>Catálogo de Genéticas</CardTitle>
                                        <CardDescription>Base de datos de tus cepas madre.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <GeneticasManager />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {isAdmin && (
                                <TabsContent value="usuarios">
                                    <Card className="bg-card/30 backdrop-blur-sm border-2 border-primary/50">
                                        <CardHeader>
                                            <CardTitle>Administración de Usuarios</CardTitle>
                                            <CardDescription>Control de acceso y roles del sistema.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <UsuariosManager />
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            )}
                        </Tabs>
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
