import { useState, useMemo } from 'react';
import { AppSidebar } from '@/components/layouts/AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Activity, Plus, Sprout, MapPin, Clock, ChevronDown, ChevronUp, Flower2, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DateRange } from "react-day-picker";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { PlantaDto, SalaDto } from "@/interfaces/Planta";
import { Loader2 } from "lucide-react";
import { useRegistroEventoFormStore } from "@/stores/useRegistroEventoFormStore";
import { BackendEvent } from "@/interfaces/Eventos";
import { useAuthContext } from "@/contexts/AuthContext";

// Extracted components
import { MasterFilterBar } from "@/components/bitacora/MasterFilterBar";
import { MasterLogTable } from "@/components/bitacora/MasterLogTable";

// Dashboard components
import { KpiCard } from "@/components/dashboard/KpiCard";
import { UserDiary } from "@/components/dashboard/UserDiary";
import { WeeklyActivityChart } from "@/components/dashboard/WeeklyActivityChart";
import { useKPIsBI } from "@/hooks/useKPIsBI";
import { KpiCardSkeleton } from "@/components/shared/skeletons/KpiCardSkeleton";

// Panel components (migrated from PanelControl)
import { GeneticasManager } from "@/components/panels/GeneticasManager";
import { NutrientesManager } from "@/components/panels/NutrientesManager";
import { SalasManager } from "@/components/panels/SalasManager";

// Tareas
import TareaProgramadaForm from "@/components/shared/TareaProgramadaForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ToggleLeft, ToggleRight, Trash2, CalendarDays } from "lucide-react";

export default function MainLogPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const isAdmin = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_SUPER_ADMIN';

  const [filters, setFilters] = useState<{
    type: string;
    sala: string;
    plantId: string;
    dateRange?: DateRange;
  }>({
    type: 'Todos',
    sala: 'Todas',
    plantId: 'Todas',
  });

  // Collapsible sections state
  const [gestionOpen, setGestionOpen] = useState(false);
  const [tablaOpen, setTablaOpen] = useState(false);
  const [activeGestionTab, setActiveGestionTab] = useState<'cepas' | 'nutrientes' | 'salas'>('cepas');

  const { openMenuAndSelectTool } = useRegistroEventoFormStore();

  // ── Queries ──────────────────────────────────
  const { data: allEvents = [], isLoading: isLoadingAllEvents, isError: isErrorAllEvents } = useQuery<BackendEvent[]>({
    queryKey: ['allEvents', filters],
    queryFn: () => apiService.getAllEventsForCurrentUser(filters),
  });

  const { data: allSalas = [] } = useQuery<SalaDto[]>({
    queryKey: ['salas'],
    queryFn: apiService.getSalas,
    staleTime: 1000 * 60 * 5,
  });

  const { data: allPlantas = [] } = useQuery<PlantaDto[]>({
    queryKey: ['plantas'],
    queryFn: apiService.getPlantas,
    staleTime: 1000 * 60 * 5,
  });

  const { data: tareas = [] } = useQuery({
    queryKey: ['tareas'],
    queryFn: () => apiService.getTareas(),
  });

  // ── KPIs ─────────────────────────────────────
  const { byCategory } = useKPIsBI(allPlantas, allEvents);

  // ── Tareas mutations ─────────────────────────
  const toggleTareaMutation = useMutation({
    mutationFn: (id: number) => apiService.toggleTarea(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tareas'] });
      toast({ title: 'Tarea actualizada' });
    },
    onError: () => toast({ variant: 'destructive', title: 'Error al actualizar tarea' }),
  });

  const deleteTareaMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteTarea(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tareas'] });
      toast({ title: 'Tarea eliminada' });
    },
    onError: () => toast({ variant: 'destructive', title: 'Error al eliminar tarea' }),
  });

  // ── State ────────────────────────────────────
  const [tareasFormOpen, setTareasFormOpen] = useState(false);
  const filteredEvents = useMemo(() => allEvents, [allEvents]);

  const handleCreateNewEvent = () => {
    openMenuAndSelectTool('riego');
  };

  // ── Gestion tabs config ──────────────────────
  const gestionTabs = [
    { id: 'cepas' as const, label: 'Genéticas', icon: Flower2 },
    { id: 'nutrientes' as const, label: 'Nutrientes', icon: FlaskConical },
    { id: 'salas' as const, label: 'Salas', icon: MapPin },
  ];

  return (
    <SidebarProvider>
      <div
        className="min-h-screen w-full flex relative"
      >
        <div className="absolute inset-0 bg-background/60 pointer-events-none" style={{ position: 'fixed' }} />

        <AppSidebar />
        <div className="flex-1 overflow-auto relative z-10">
          {/* ── Header ── */}
          <header className="bg-card/70 backdrop-blur-sm border-b border-border px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-40 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <h1 className="text-2xl font-bold text-foreground flex items-center">
                  <Activity className="mr-3 text-primary" />
                  <span className="hidden sm:inline">Bitácora</span>
                  <span className="sm:hidden">Bitácora</span>
                </h1>
              </div>
              {/* Desktop only: Nuevo Registro button */}
              <div className="hidden md:flex gap-2 items-center">
                <Button onClick={handleCreateNewEvent}>
                  <Plus size={20} className="mr-2" /> Nuevo Registro
                </Button>
              </div>
            </div>
          </header>

          <main className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* ── Loading / Error ── */}
            {isLoadingAllEvents && (
              <p className="text-center"><Loader2 className="animate-spin mr-2" /> Cargando eventos...</p>
            )}
            {isErrorAllEvents && (
              <p className="text-center text-destructive">Error al cargar la bitácora</p>
            )}

            {/* ════════════════════════════════════════════ */}
            {/* SECTION 1: KPIs Row                         */}
            {/* ════════════════════════════════════════════ */}
            {!isLoadingAllEvents && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {allPlantas.length === 0 ? (
                  <>
                    <KpiCardSkeleton />
                    <KpiCardSkeleton />
                    <KpiCardSkeleton />
                    <KpiCardSkeleton />
                  </>
                ) : (
                  <>
                    {byCategory.operational[0] && <KpiCard {...byCategory.operational[0]} />}
                    {byCategory.operational[1] && <KpiCard {...byCategory.operational[1]} />}
                    {byCategory.quality[0] && <KpiCard {...byCategory.quality[0]} />}
                    {byCategory.temporal[2] && <KpiCard {...byCategory.temporal[2]} />}
                  </>
                )}
              </div>
            )}

            {/* ════════════════════════════════════════════ */}
            {/* SECTION 2: Tareas + Eventos Recientes       */}
            {/* ════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tareas Programadas */}
              <Card className="bg-card/30 backdrop-blur-sm border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                      <Clock className="w-5 h-5 text-primary" />
                      Tareas
                      {tareas.length > 0 && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          {tareas.filter(t => t.activa).length} activas
                        </span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTareasFormOpen(true)}
                      className="text-primary border-primary/30 hover:bg-primary/10 h-8"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Nueva
                    </Button>
                  </div>

                  {tareas.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      <CalendarDays className="mx-auto mb-2 w-8 h-8 opacity-30" />
                      Sin tareas programadas
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {tareas.slice(0, 8).map((t) => (
                        <div
                          key={t.id}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm ${
                            t.activa ? 'border-primary/20 bg-primary/5' : 'border-border/30 bg-muted/20 opacity-60'
                          }`}
                        >
                          <button onClick={() => t.id && toggleTareaMutation.mutate(t.id)} className="shrink-0">
                            {t.activa
                              ? <ToggleRight className="w-5 h-5 text-primary" />
                              : <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                            }
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-foreground">{t.titulo}</p>
                            <p className="text-xs text-muted-foreground">
                              {t.recurrencia !== 'NINGUNA' && `${t.recurrencia.charAt(0) + t.recurrencia.slice(1).toLowerCase()} · `}
                              {new Date(t.fechaProgramada).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                          <button
                            onClick={() => t.id && deleteTareaMutation.mutate(t.id)}
                            className="shrink-0 p-1 hover:bg-destructive/10 rounded text-destructive/60 hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Eventos Recientes */}
              <Card className="bg-card/30 backdrop-blur-sm border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 text-foreground font-semibold mb-4">
                    <Activity className="w-5 h-5 text-primary" />
                    Actividad Reciente
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <UserDiary />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ════════════════════════════════════════════ */}
            {/* SECTION 3: Weekly Activity Chart             */}
            {/* ════════════════════════════════════════════ */}
            {!isLoadingAllEvents && allEvents.length > 0 && (
              <Card className="bg-card/30 backdrop-blur-sm border-border/50">
                <CardContent className="p-5">
                  <WeeklyActivityChart events={allEvents} />
                </CardContent>
              </Card>
            )}

            {/* ════════════════════════════════════════════ */}
            {/* SECTION 4: Gestión (colapsible)             */}
            {/* ════════════════════════════════════════════ */}
            <Collapsible open={gestionOpen} onOpenChange={setGestionOpen}>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 bg-card/30 backdrop-blur-sm rounded-xl border border-border/50 hover:bg-card/50 transition-colors">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <Sprout className="w-5 h-5 text-primary" />
                    Gestión
                    <span className="text-xs text-muted-foreground font-normal">Cepas, nutrientes, salas</span>
                  </div>
                  {gestionOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <Card className="bg-card/30 backdrop-blur-sm border-border/50">
                  <CardContent className="p-5">
                    {/* Tab selector */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {gestionTabs.map(({ id, label, icon: Icon }) => (
                        <button
                          key={id}
                          onClick={() => setActiveGestionTab(id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            activeGestionTab === id
                              ? 'bg-primary/20 text-primary border border-primary/40'
                              : 'bg-muted/50 text-muted-foreground border border-transparent hover:bg-muted'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Tab content */}
                    {activeGestionTab === 'cepas' && <GeneticasManager />}
                    {activeGestionTab === 'nutrientes' && <NutrientesManager />}
                    {activeGestionTab === 'salas' && <SalasManager />}
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>

            {/* ════════════════════════════════════════════ */}
            {/* SECTION 5: Tabla de Eventos (colapsible)    */}
            {/* ════════════════════════════════════════════ */}
            {!isLoadingAllEvents && !isErrorAllEvents && allEvents.length > 0 && (
              <Collapsible open={tablaOpen} onOpenChange={setTablaOpen}>
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between p-4 bg-card/30 backdrop-blur-sm rounded-xl border border-border/50 hover:bg-card/50 transition-colors">
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                      <Activity className="w-5 h-5 text-primary" />
                      Tabla de Eventos
                      <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                        {filteredEvents.length} evento{filteredEvents.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {tablaOpen ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-4">
                  <MasterFilterBar filters={filters} setFilters={setFilters} salas={allSalas} plantas={allPlantas} />
                  <MasterLogTable events={filteredEvents} plantas={allPlantas} />
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* ════════════════════════════════════════════ */}
            {/* SECTION 6: Empty state                      */}
            {/* ════════════════════════════════════════════ */}
            {!isLoadingAllEvents && !isErrorAllEvents && allEvents.length === 0 && (
              <div className="text-center p-8 bg-card/30 backdrop-blur-sm rounded-xl border border-border/50">
                <p className="text-lg text-muted-foreground mb-4">Aún no hay eventos registrados en tu bitácora.</p>
                <Button onClick={handleCreateNewEvent}>
                  <Plus size={20} className="mr-2" />
                  Registrar tu primer Evento
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Tarea Programada Form Modal */}
      {tareasFormOpen && (
        <TareaProgramadaForm onClose={() => setTareasFormOpen(false)} />
      )}
    </SidebarProvider>
  );
}
