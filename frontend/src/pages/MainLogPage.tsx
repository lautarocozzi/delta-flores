import React, { useState, useMemo } from 'react';
import { AppSidebar } from '@/components/layouts/AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Activity, ChevronLeft, ChevronRight, Filter, Calendar as CalendarIcon, Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { PlantaDto, SalaDto } from "@/interfaces/Planta";
import { Loader2 } from "lucide-react";
import { useDirectAccessMenuStore } from "@/stores/useDirectAccessMenuStore";
import { EventTypeIcon, getEventTypeLabel } from "@/components/events/EventTypeIcon";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EventCard } from "@/components/bitacora/EventCard";  // ✅ NUEVO

// --- Tipos para Eventos del Backend (reutilizando la del PlantDetailPage) ---
interface BackendEvent {
  id: number;
  eventType: string; // "WATERING", "PRUNING", etc.
  fecha: string;
  plantaIds: number[];
  phAgua?: number;
  ecAgua?: number;
  tipoPoda?: string;
  observacion?: string;
  nuevaEtapa?: string;
  description?: string;
  mediaUrls?: string[];
  nutriente?: { id: number; titulo: string };
}

// Tipos de eventos basados en el backend
const EVENT_TYPES = [
  'Todos',
  'WATERING',
  'PRUNING',
  'NOTE',
  'PHOTO',
  'STAGE_CHANGE',
  'NUTRIENT'
];

// --- Componentes de la Página ---

const MasterFilterBar = ({ filters, setFilters, salas, plantas }: any) => {
  const availablePlants = useMemo(() => {
    if (filters.sala === 'Todas' || !salas.length || !plantas.length) return plantas;
    const selectedSala = salas.find((s: SalaDto) => s.id.toString() === filters.sala);
    return plantas.filter((p: PlantaDto) => p.sala?.id === selectedSala?.id);
  }, [filters.sala, salas, plantas]);

  React.useEffect(() => {
    // Reset plant filter if selected sala changes or becomes unavailable
    if (filters.plantId !== 'Todas' && !availablePlants.some((p: PlantaDto) => p.id.toString() === filters.plantId)) {
      setFilters((f: any) => ({ ...f, plantId: 'Todas' }));
    }
  }, [availablePlants, filters.plantId, setFilters]);

  return (
    <div className="mb-8 p-6 bg-card/30 backdrop-blur-sm rounded-xl border-2 border-primary/50 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 flex items-center"><Filter className="mr-2" />Filtros Avanzados</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Select value={filters.type} onValueChange={(value) => setFilters((f: any) => ({ ...f, type: value }))}>
          <SelectTrigger><SelectValue placeholder="Tipo de Evento" /></SelectTrigger>
          <SelectContent>{EVENT_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.sala} onValueChange={(value) => setFilters((f: any) => ({ ...f, sala: value, plantId: 'Todas' }))}>
          <SelectTrigger><SelectValue placeholder="Sala" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas las Salas</SelectItem>
            {salas.map((sala: SalaDto) => <SelectItem key={sala.id} value={sala.id.toString()}>{sala.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.plantId} onValueChange={(value) => setFilters((f: any) => ({ ...f, plantId: value }))}>
          <SelectTrigger><SelectValue placeholder="Planta" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas las Plantas</SelectItem>
            {availablePlants.map((plant: PlantaDto) => <SelectItem key={plant.id} value={plant.id.toString()}>{plant.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant={"outline"} className="justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateRange?.from ? (
                filters.dateRange.to ? (
                  `${format(filters.dateRange.from, "LLL dd, y")} - ${format(filters.dateRange.to, "LLL dd, y")}`
                ) : (
                  format(filters.dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Seleccionar rango</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={filters.dateRange}
              onSelect={(range) => setFilters((f: any) => ({ ...f, dateRange: range }))}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

const MasterLogTable = ({ events, plantas }: { events: BackendEvent[]; plantas: PlantaDto[] }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const EVENTS_PER_PAGE = 25;

  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * EVENTS_PER_PAGE;
    return events.slice(startIndex, startIndex + EVENTS_PER_PAGE);
  }, [events, currentPage]);

  const totalPages = Math.ceil(events.length / EVENTS_PER_PAGE);

  React.useEffect(() => { setCurrentPage(1); }, [events]);

  // Helper: IDs → Nombres plantas
  const getPlantasNombres = (plantaIds: number[]): string => {
    if (!plantaIds || plantaIds.length === 0) return '-';
    const nombres = plantaIds.map(id => {
      const planta = plantas.find(p => p.id === id);
      return planta?.nombre || `ID ${id}`;
    });
    return nombres.join(', ');
  };

  return (
    <div className="bg-card/30 backdrop-blur-sm p-6 rounded-xl border-2 border-primary/50 shadow-md">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Tipo</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Planta(s)</TableHead>
              <TableHead>Detalles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEvents.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No hay eventos que coincidan con los filtros.</TableCell></TableRow>
            ) : (
              paginatedEvents.map((event) => (
                <TableRow key={event.id} className="hover:bg-muted/50 cursor-pointer">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <EventTypeIcon eventType={event.eventType} />
                      <span className="text-sm font-medium">{getEventTypeLabel(event.eventType)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(new Date(event.fecha), "dd/MM/yyyy")}</TableCell>
                  <TableCell className="text-sm font-medium">{getPlantasNombres(event.plantaIds)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {event.eventType === 'WATERING' && `pH: ${event.phAgua || '-'}, EC: ${event.ecAgua || '-'}`}
                    {event.eventType === 'PRUNING' && `Tipo: ${event.tipoPoda || 'General'}`}
                    {event.eventType === 'NOTE' && event.observacion}
                    {event.eventType === 'NUTRIENT' && `Nutriente: ${event.nutriente?.titulo || 'Desconocido'}`}
                    {event.eventType === 'PHOTO' && `Descripción: ${event.description || '-'} (Archivos: ${event.mediaUrls?.length || 0})`}
                    {event.eventType === 'STAGE_CHANGE' && `Nueva Etapa: ${event.nuevaEtapa || '-'}`}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 pt-4">
        <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</span>
        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Button>
        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
          Siguiente <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div >
  );
};

export default function MainLogPage() {
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

  const { openMenuAndSelectTool } = useDirectAccessMenuStore();

  const { data: allEvents = [], isLoading: isLoadingAllEvents, isError: isErrorAllEvents } = useQuery<BackendEvent[]>({
    queryKey: ['allEvents', filters], // La queryKey ahora incluye los filtros para re-fetch automático
    queryFn: () => apiService.getAllEventsForCurrentUser(filters),
  });

  // Queries para salas y plantas (necesarias para los filtros)
  const { data: allSalas = [], isLoading: isLoadingAllSalas } = useQuery<SalaDto[]>({
    queryKey: ['salas'],
    queryFn: apiService.getSalas,
    staleTime: 1000 * 60 * 5,
  });

  const { data: allPlantas = [], isLoading: isLoadingAllPlantas } = useQuery<PlantaDto[]>({
    queryKey: ['plantas'],
    queryFn: apiService.getPlantas,
    staleTime: 1000 * 60 * 5,
  });

  // El filtrado ahora se hace en el backend, por lo que filteredEvents es simplemente allEvents
  const filteredEvents = useMemo(() => allEvents, [allEvents]);

  const handleCreateNewEvent = () => {
    openMenuAndSelectTool('riego'); // Abre el menú de acceso directo, pre-selecciona 'riego' por defecto
  };

  const handleExportCsv = () => {
    if (filteredEvents.length === 0) {
      alert("No hay eventos para exportar.");
      return;
    }

    const headers = ["ID", "Fecha", "Tipo", "Planta IDs", "Detalles"];
    const rows = filteredEvents.map(event => {
      let details = '';
      switch (event.eventType) {
        case 'WATERING':
          details = `pH: ${event.phAgua || '-'}, EC: ${event.ecAgua || '-'}`;
          break;
        case 'PRUNING':
          details = `Tipo: ${event.tipoPoda || 'General'}`;
          break;
        case 'NOTE':
          details = event.observacion || '-';
          break;
        case 'NUTRIENT':
          details = `Nutriente: ${event.nutriente?.titulo || 'Desconocido'}`;
          break;
        case 'PHOTO':
          details = `Descripción: ${event.description || '-'} (Archivos: ${event.mediaUrls?.length || 0})`;
          break;
        case 'STAGE_CHANGE':
          details = `Nueva Etapa: ${event.nuevaEtapa || '-'}`;
          break;
        default:
          details = '-';
          break;
      }
      return [
        event.id,
        new Date(event.fecha).toLocaleDateString(),
        event.eventType,
        event.plantaIds?.join(' | ') || '-',
        details.replace(/,/g, ';') // Reemplazar comas en detalles para evitar problemas en CSV
      ];
    });

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) { // Feature detection
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `bitacora-general-floresdelta-${format(new Date(), 'yyyyMMddHHmmss')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

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
          <header className="bg-card/70 backdrop-blur-sm border-b border-border px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-40 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-2xl font-bold text-foreground flex items-center">
                    <Activity className="mr-3 text-primary" />
                    Bitácora General
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Mostrando {filteredEvents.length} de {allEvents.length} eventos registrados.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <Button onClick={handleExportCsv} variant="outline">
                  <Download size={20} className="mr-2" /> Exportar a CSV
                </Button>
                <Button onClick={handleCreateNewEvent}>
                  <Plus size={20} className="mr-2" /> Registrar Nuevo Evento
                </Button>
              </div>
            </div>
          </header>
          <main className="p-4 sm:p-6 lg:p-8">
            {(isLoadingAllEvents || isLoadingAllSalas || isLoadingAllPlantas) && <p className="text-center"><Loader2 className="animate-spin mr-2" /> Cargando eventos...</p>}
            {(isErrorAllEvents) && <p className="text-center text-destructive">Error al cargar la bitácora general</p>}

            {!isLoadingAllEvents && !isErrorAllEvents && allEvents.length === 0 ? (
              <div className="text-center p-8 bg-muted/20 rounded-lg">
                <p className="text-lg text-muted-foreground mb-4">Aún no hay eventos registrados en tu bitácora general.</p>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  onClick={handleCreateNewEvent}
                >
                  <Plus size={20} className="mr-2" />
                  Registrar tu primer Evento
                </Button>
              </div>
            ) : (
              <>
                <MasterFilterBar filters={filters} setFilters={setFilters} salas={allSalas} plantas={allPlantas} />
                <MasterLogTable events={filteredEvents} plantas={allPlantas} />
              </>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}


