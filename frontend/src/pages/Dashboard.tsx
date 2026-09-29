import { Leaf, Calendar, TrendingUp, Activity, Plus, PlusCircle, Search, Filter, MapPin, Home } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layouts/AppSidebar";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { PlantCard } from "@/components/dashboard/PlantCard";
import { RegistroEventoForm } from "@/components/shared/RegistroEventoForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { PlantaDto, SalaDto, CepaDto } from "@/interfaces/Planta";
import { useRegistroEventoFormStore } from "@/stores/useRegistroEventoFormStore";
import { SalaCard } from "@/components/dashboard/SalaCard";
import { WeeklyActivityChart } from "@/components/dashboard/WeeklyActivityChart";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useDashboardLogic } from "@/hooks/useDashboardLogic";
import { WeeklyCalendarStrip } from "@/components/dashboard/WeeklyCalendarStrip";
import { UserDiary } from "@/components/dashboard/UserDiary";

const ETAPAS_DISPONIBLES = ['Todas', 'PLANTIN', 'VEGETACION', 'FLORACION', 'COSECHADA'];
export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEtapa, setFilterEtapa] = useState('Todas');
  const [filterSala, setFilterSala] = useState('Todas');
  const navigate = useNavigate();

  const { openMenuAndSelectTool, openMenu } = useRegistroEventoFormStore();

  const { data: plantas = [], isLoading, isError, error } = useQuery<PlantaDto[]>({
    queryKey: ['plantas'],
    queryFn: apiService.getPlantas,
    staleTime: 1000 * 60 * 5,
  });

  const { data: salas = [], isLoading: isLoadingSalas } = useQuery<SalaDto[]>({
    queryKey: ['salas'],
    queryFn: apiService.getSalas,
    staleTime: 1000 * 60 * 5,
  });

  const { data: cepas = [], isLoading: isLoadingCepas } = useQuery<CepaDto[]>({
    queryKey: ['cepas'],
    queryFn: apiService.getCepas,
    staleTime: 1000 * 60 * 5,
  });

  const { data: allEvents = [] } = useQuery({
    queryKey: ['allEventsForMetrics'],
    queryFn: () => apiService.getAllEventsForCurrentUser(),
    staleTime: 1000 * 60 * 5,
  });

  // ✅ REFACTORIZADO: Lógica de negocio extraída a hook personalizado
  const { availableRooms, filteredAndGroupedPlantas, kpis } = useDashboardLogic(plantas, {
    searchQuery,
    filterEtapa,
    filterSala
  }, allEvents);

  const handleCreateNew = (toolName: string) => {
    openMenuAndSelectTool(toolName);  // Abre menú CON tool preseleccionada
  };

  const handleGoToPanel = () => {
    navigate('/bitacora');
  };

  // Open RegistroEventoForm only on first visit (with delay for smooth UX)
  useEffect(() => {
    const hasVisitedDashboard = localStorage.getItem('floresdelta_dashboard_visited');
    if (!hasVisitedDashboard) {
      // First time visiting dashboard - delay to let content load first
      const timer = setTimeout(() => {
        openMenu();
        localStorage.setItem('floresdelta_dashboard_visited', 'true');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [openMenu]);

  // Determinar el estado de "vacío" y el mensaje/CTA a mostrar
  const showEmptyState = !isLoading && !isLoadingSalas && !isLoadingCepas && plantas.length === 0;
  const hasSalas = !isLoadingSalas && salas.length > 0;
  const hasCepas = !isLoadingCepas && cepas.length > 0;

  return (
    <SidebarProvider>
      {/* RegistroEventoForm is now global in App.tsx */}
      <div
        className="min-h-screen w-full flex bg-background"
      >
        {/* Background overlay for content readability */}
        <div className="absolute inset-0 bg-background/60 pointer-events-none" style={{ position: 'fixed' }} />

        <AppSidebar />

        <div className="flex-1 overflow-auto relative z-10">
          <header className="bg-card/70 backdrop-blur-sm border-b border-border px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-40 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Home className="text-primary" size={24} />
                  </div>
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-foreground">Inicio</h1>
                    <p className="text-muted-foreground text-sm hidden md:block">Tu centro de control de cultivos</p>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex gap-3">
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  onClick={() => handleCreateNew('nueva-planta')}
                >
                  <Plus size={20} className="mr-2" />
                  Añadir Planta
                </Button>
                <Button
                  variant="outline"
                  onClick={() => openMenu()}
                >
                  <PlusCircle size={20} className="mr-2" />
                  Nuevo Registro
                </Button>
              </div>
            </div>
          </header>

          <main className="p-4 sm:p-6 lg:p-8">

            {/* Weekly Calendar Strip - GWJ Style */}
            <div className="mb-6">
              <WeeklyCalendarStrip
                events={allEvents}
                onDaySelect={(date) => console.log('Selected:', date)}
              />
            </div>

            {/* Salas Carousel Section */}
            {!isLoadingSalas && salas.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-bold mb-3 flex items-center text-foreground">
                  <MapPin className="mr-2 text-primary" size={18} />
                  Mis Salas
                </h2>
                <div className="px-10 md:px-14">
                  <Carousel opts={{ align: "start" }} className="w-full">
                    <CarouselContent className="-ml-3">
                      {salas.map((sala) => {
                        const count = plantas.filter(p => p.sala?.id === sala.id).length;
                        return (
                          <CarouselItem key={sala.id} className="pl-3 basis-full sm:basis-[85%] md:basis-1/2 lg:basis-1/3">
                            <SalaCard
                              sala={sala}
                              plantCount={count}
                              onClick={() => navigate('/profile')}
                            />
                          </CarouselItem>
                        );
                      })}
                    </CarouselContent>
                    <CarouselPrevious className="-left-8" />
                    <CarouselNext className="-right-8" />
                  </Carousel>
                </div>
              </div>
            )}

            {/* User Diary - Activity Timeline */}
            <div className="mb-6">
              <UserDiary />
            </div>


            {/* Plant filters moved to /plantas page */}

            {(isLoading || isLoadingSalas || isLoadingCepas) && <p className="text-center">Cargando datos...</p>}
            {(isError || !plantas || !salas || !cepas) && <p className="text-center text-destructive">Error al cargar datos: {error?.message || 'Error desconocido'}</p>}

            {showEmptyState && (
              <div className="text-center p-8 bg-muted/20 rounded-lg flex flex-col items-center space-y-4">
                <p className="text-lg text-foreground font-medium mb-2">¡Bienvenido a tu Panel de Gestión!</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Aquí podrás monitorear tus cultivos. Para comenzar, configura tus espacios (Salas) y registra tus Genéticas.
                </p>

                {!hasSalas && (
                  <Button
                    variant="secondary"
                    onClick={() => handleGoToPanel()}
                    className="w-full max-w-xs"
                  >
                    <Plus size={16} className="mr-2" />
                    Crear tu primera Sala
                  </Button>
                )}
                {!hasCepas && (
                  <Button
                    variant="secondary"
                    onClick={() => handleGoToPanel()}
                    className="w-full max-w-xs"
                  >
                    <Plus size={16} className="mr-2" />
                    Registrar tu primera Genética
                  </Button>
                )}
                {(hasSalas && hasCepas) && (
                  <Button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium w-full max-w-xs"
                    onClick={() => handleCreateNew('nueva-planta')}
                  >
                    <Plus size={20} className="mr-2" />
                    Crear tu primera Planta
                  </Button>
                )}

                {(!hasSalas || !hasCepas) && (hasSalas || hasCepas) && (
                  <p className="text-xs text-muted-foreground mt-4">Una vez que tengas Salas y Genéticas, podrás crear Plantas.</p>
                )}
              </div>
            )}


            {/* Plants have been moved to /plantas page */}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

