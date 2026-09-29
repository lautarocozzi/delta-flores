import { ArrowLeft, Calendar, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { PlantaDto } from "@/interfaces/Planta";
import { BackendEvent } from "@/interfaces/Eventos";
import { PlantProfile } from "@/components/plants/PlantProfile";
import { EventFilters } from "@/components/plants/EventFilters";
import { EventCard } from "@/components/plants/EventCard";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRegistroEventoFormStore } from "@/stores/useRegistroEventoFormStore";

export default function PlantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { openMenuWithPlanta } = useRegistroEventoFormStore();
  const [isDeletePlantOpen, setIsDeletePlantOpen] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<string>("todos");

  const { data: planta, isLoading: isLoadingPlanta, isError: isErrorPlanta } = useQuery<PlantaDto>({
    queryKey: ['planta', id],
    queryFn: () => apiService.getPlantaById(id!),
    enabled: !!id,
  });

  const { data: events = [], isLoading: isLoadingEvents } = useQuery<BackendEvent[]>({
    queryKey: ['plantEvents', id],
    queryFn: () => apiService.getPlantEvents(id!),
    enabled: !!id,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Filtrado de eventos
  const filteredEvents = useMemo(() => {
    if (selectedEventType === "todos") return events;
    return events.filter(e => e.eventType === selectedEventType);
  }, [events, selectedEventType]);

  // Conteo por tipo
  const eventCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach(e => {
      counts[e.eventType] = (counts[e.eventType] || 0) + 1;
    });
    return counts;
  }, [events]);

  const deleteEventMutation = useMutation({
    mutationFn: ({ eventType, eventId }: { eventType: string; eventId: string }) =>
      apiService.deleteEvent(eventType, eventId),
    onSuccess: () => {
      toast({ title: "Evento eliminado", description: "El evento se eliminó correctamente." });
      queryClient.invalidateQueries({ queryKey: ['plantEvents', id] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el evento." });
    },
  });

  const deletePlantaMutation = useMutation({
    mutationFn: (plantaId: number) => apiService.deletePlanta(plantaId),
    onSuccess: () => {
      toast({ title: "Planta eliminada", description: "La planta se eliminó permanentemente." });
      queryClient.invalidateQueries({ queryKey: ['plantas'] });
      queryClient.invalidateQueries({ queryKey: ['plantas', 'sala', planta?.salaId] });
      queryClient.invalidateQueries({ queryKey: ['zonas', 'sala', planta?.salaId] });
      navigate('/profile');
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar la planta." });
    },
  });

  const handleDeleteEvent = (event: BackendEvent) => {
    if (window.confirm(`¿Eliminar este evento de ${event.eventType}?`)) {
      deleteEventMutation.mutate({ eventType: event.eventType, eventId: event.id.toString() });
    }
  };

  if (isLoadingPlanta) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  if (isErrorPlanta || !planta) return <div className="p-8 text-center text-destructive">Error al cargar la planta o planta no encontrada.</div>;

  return (
    <div className="min-h-screen w-full bg-background p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </Button>
          <Button onClick={() => openMenuWithPlanta(Number(id))}>
            <Plus className="mr-2 h-4 w-4" /> Registrar Evento
          </Button>
        </div>
      </header>

      <main className="space-y-6">
        {/* Perfil de Planta */}
        <PlantProfile
          planta={planta}
          onEdit={() => navigate(`/plantas/${id}/editar`)}
          onDelete={() => setIsDeletePlantOpen(true)}
        />

        {/* Filtros de Eventos */}
        <EventFilters
          selectedType={selectedEventType}
          onTypeChange={setSelectedEventType}
          eventCounts={eventCounts}
        />

        {/* Timeline de Eventos */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Historia de Vida Semanal</h2>

          {isLoadingEvents ? (
            <div className="text-center py-8">
              <Loader2 className="animate-spin text-primary mx-auto mb-2" size={32} />
              Cargando bitácora...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="mx-auto mb-4" size={48} />
              <p>No hay eventos registrados {selectedEventType !== "todos" && "de este tipo"}.</p>
              <Button onClick={() => openMenuWithPlanta(Number(id))} className="mt-4">
                <Plus className="mr-2" /> Registrar Primer Evento
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onEdit={() => {}}
                  onDelete={() => handleDeleteEvent(event)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Dialog eliminar planta */}
      <AlertDialog open={isDeletePlantOpen} onOpenChange={setIsDeletePlantOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {planta.nombre}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente esta planta
              y todos sus eventos, fotos y notas asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePlantaMutation.mutate(planta.id)}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deletePlantaMutation.isPending}
            >
              {deletePlantaMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Eliminar Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
