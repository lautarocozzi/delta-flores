import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layouts/AppSidebar";
import { PlantCard } from "@/components/dashboard/PlantCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, Thermometer, Droplets, Sun, Plus, ArrowLeft, Leaf } from "lucide-react";
import { useDirectAccessMenuStore } from "@/stores/useDirectAccessMenuStore";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export default function SalaDetailPage() {
    const { salaId } = useParams<{ salaId: string }>();
    const navigate = useNavigate();
    const { openMenuAndSelectTool } = useDirectAccessMenuStore();

    const { data: sala, isLoading: isLoadingSala } = useQuery({
        queryKey: ['sala', salaId],
        queryFn: () => apiService.getSalaById(Number(salaId)),
        enabled: !!salaId,
    });

    const { data: plantasEnSala = [], isLoading: isLoadingPlantas } = useQuery({
        queryKey: ['plantas-sala', salaId],
        queryFn: () => apiService.getPlantasBySala(Number(salaId)),
        enabled: !!salaId,
    });

    const handleAddPlant = () => {
        // Pass salaId as context to preload in form
        openMenuAndSelectTool('nueva-planta');
        // TODO: Need to modify DirectAccessMenu to accept and pass contextSalaId
        // For now, user can manually select the sala from dropdown
    };

    if (isLoadingSala || isLoadingPlantas) {
        return (
            <SidebarProvider>
                <div className="min-h-screen w-full flex bg-background">
                    <AppSidebar />
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-muted-foreground">Cargando información de la sala...</p>
                    </div>
                </div>
            </SidebarProvider>
        );
    }

    if (!sala) {
        return (
            <SidebarProvider>
                <div className="min-h-screen w-full flex bg-background">
                    <AppSidebar />
                    <div className="flex-1 flex items-center justify-center flex-col gap-4">
                        <p className="text-destructive">Sala no encontrada</p>
                        <Button onClick={() => navigate('/dashboard')}>
                            <ArrowLeft className="mr-2" size={16} />
                            Volver al Dashboard
                        </Button>
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
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                                    <ArrowLeft size={20} />
                                </Button>
                                <SidebarTrigger />
                                <div>
                                    <h1 className="text-2xl font-bold flex items-center gap-2">
                                        <MapPin className="text-primary" size={24} />
                                        {sala.nombre}
                                    </h1>
                                    <p className="text-sm text-muted-foreground">
                                        Detalles de sala y plantas asignadas
                                    </p>
                                </div>
                            </div>
                            <Button onClick={handleAddPlant}>
                                <Plus className="mr-2" size={16} />
                                Añadir Planta
                            </Button>
                        </div>
                    </header>

                    <main className="p-6 space-y-6">
                        {/* Sala Information Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Información de la Sala</CardTitle>
                                <CardDescription>Condiciones ambientales y configuración</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Description */}
                                    <div className="md:col-span-3">
                                        <h3 className="text-sm font-semibold text-muted-foreground mb-1">Descripción</h3>
                                        <p className="text-foreground">
                                            {sala.descripcion || "Sin descripción disponible"}
                                        </p>
                                    </div>

                                    {/* Environmental Conditions */}
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-primary/10 rounded-lg">
                                            <Sun className="text-primary" size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Horas de Luz</p>
                                            <p className="text-lg font-semibold">{sala.horasLuz || "No configurado"}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-blue-500/10 rounded-lg">
                                            <Droplets className="text-blue-500" size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Humedad</p>
                                            <p className="text-lg font-semibold">{sala.humedad ? `${sala.humedad}%` : "No configurado"}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-orange-500/10 rounded-lg">
                                            <Thermometer className="text-orange-500" size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Temperatura</p>
                                            <p className="text-lg font-semibold">{sala.temperaturaAmbiente ? `${sala.temperaturaAmbiente}°C` : "No configurado"}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Plants Section */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Leaf className="text-primary" size={20} />
                                            Plantas en esta Sala
                                        </CardTitle>
                                        <CardDescription>
                                            {plantasEnSala.length} {plantasEnSala.length === 1 ? 'planta asignada' : 'plantas asignadas'}
                                        </CardDescription>
                                    </div>
                                    <Button variant="outline" onClick={handleAddPlant}>
                                        <Plus className="mr-2" size={16} />
                                        Nueva Planta
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {plantasEnSala.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-muted-foreground mb-4">No hay plantas asignadas a esta sala aún.</p>
                                        <Button onClick={handleAddPlant}>
                                            <Plus className="mr-2" size={16} />
                                            Añadir Primera Planta
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="px-12">
                                        <Carousel opts={{ align: "start" }} className="w-full">
                                            <CarouselContent className="-ml-4">
                                                {plantasEnSala.map((planta) => (
                                                    <CarouselItem key={planta.id} className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                                                        <div className="p-1">
                                                            <PlantCard
                                                                id={planta.id.toString()}
                                                                etiqueta={planta.nombre}
                                                                genetica={planta.cepaDto?.geneticaParental || 'Desconocida'}
                                                                stage={planta.etapa}
                                                                health={0}
                                                                fechaCreacion={planta.fechaCreacion}
                                                                tipoAmbiente={sala?.tipoAmbiente}
                                                            />
                                                        </div>
                                                    </CarouselItem>
                                                ))}
                                            </CarouselContent>
                                            <CarouselPrevious />
                                            <CarouselNext />
                                        </Carousel>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
