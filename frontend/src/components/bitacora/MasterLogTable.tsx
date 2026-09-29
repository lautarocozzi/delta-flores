import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { BackendEvent } from "@/interfaces/Eventos";
import { PlantaDto } from "@/interfaces/Planta";
import { EventTypeIcon, getEventTypeLabel } from "@/components/events/EventTypeIcon";

interface MasterLogTableProps {
  events: BackendEvent[];
  plantas: PlantaDto[];
}

export function MasterLogTable({ events, plantas }: MasterLogTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const EVENTS_PER_PAGE = 25;

  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * EVENTS_PER_PAGE;
    return events.slice(startIndex, startIndex + EVENTS_PER_PAGE);
  }, [events, currentPage]);

  const totalPages = Math.ceil(events.length / EVENTS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [events]);

  const getPlantasNombres = (plantaIds: number[]): string => {
    if (!plantaIds || plantaIds.length === 0) return '-';
    const nombres = plantaIds.map(id => {
      const planta = plantas.find(p => p.id === id);
      return planta?.nombre || `ID ${id}`;
    });
    return nombres.join(', ');
  };

  return (
    <div className="bg-card/30 backdrop-blur-sm rounded-xl border border-border/50 shadow-sm">
      {/* Collapsible header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Tabla de Eventos</span>
          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
            {events.length} evento{events.length !== 1 ? 's' : ''}
          </span>
        </div>
        {isCollapsed ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Collapsible content */}
      {!isCollapsed && (
        <div className="px-4 pb-4">
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
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No hay eventos que coincidan con los filtros.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedEvents.map((event) => (
                    <TableRow key={event.id} className="hover:bg-muted/50 cursor-pointer">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <EventTypeIcon eventType={event.eventType} />
                          <span className="text-sm font-medium">{getEventTypeLabel(event.eventType)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(event.fecha), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {getPlantasNombres(event.plantaIds)}
                      </TableCell>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 pt-4">
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
