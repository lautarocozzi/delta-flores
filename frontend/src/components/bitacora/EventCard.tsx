import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { Droplet, Scissors, Bug, Sprout, AlertTriangle } from "lucide-react";

/**
 * COMPONENT: EventCard (Mobile Responsive)
 * 
 * PROP\u00d3SITO: Versi\u00f3n card de eventos para m\u00f3vil
 * FILOSOF\u00cdA SOCIO: Componente reutilizable, responsive
 * 
 * USO: Reemplaza tabla en pantallas <768px
 */
interface EventCardProps {
    event: {
        id: number;
        eventType: string;
        fecha: string;
        observaciones?: string;
        plantaIds: number[];
    };
    plantasMap: Map<number, string>;  // Map de id -> nombre planta
}

// Helper: Icono seg\u00fan tipo evento
const getEventIcon = (type: string) => {
    switch (type) {
        case 'WATERING':
            return <Droplet className="text-blue-500" size={20} />;
        case 'TRIMMING':
            return <Scissors className="text-green-500" size={20} />;
        case 'FERTILIZATION':
            return <Sprout className="text-emerald-500" size={20} />;
        case 'PEST_CONTROL':
            return <Bug className="text-orange-500" size={20} />;
        default:
            return <AlertTriangle className="text-gray-500" size={20} />;
    }
};

// Helper: Nombre legible tipo evento
const getEventTypeName = (type: string) => {
    switch (type) {
        case 'WATERING': return 'Riego';
        case 'TRIMMING': return 'Poda';
        case 'FERTILIZATION': return 'Fertilizaci\u00f3n';
        case 'PEST_CONTROL': return 'Control Plagas';
        case 'STAGE_CHANGE': return 'Cambio Etapa';
        default: return type;
    }
};

export const EventCard = ({ event, plantasMap }: EventCardProps) => {
    // Convertir plantaIds a nombres
    const plantasNombres = event.plantaIds
        .map(id => plantasMap.get(id) || `Planta #${id}`)
        .join(', ');

    return (
        <Card className=\"p-4 hover:border-primary/50 transition-colors\">
    {/* Header: Icono + Tipo + Fecha */ }
    <div className=\"flex items-center justify-between mb-3\">
        < div className =\"flex items-center gap-2\">
    { getEventIcon(event.eventType) }
    <span className=\"font-semibold text-sm\">
    { getEventTypeName(event.eventType) }
          </span >
        </div >
    <span className=\"text-xs text-muted-foreground\">
{
    format(new Date(event.fecha), \"dd/MM/yyyy\")}
        </span >
      </div >

        {/* Plantas afectadas */ }
        < div className =\"mb-2\">
    < span className =\"text-xs text-muted-foreground\">Plantas:</span>
    < p className =\"text-sm font-medium truncate\" title={plantasNombres}>
          { plantasNombres }
        </p >
      </div >

        {/* Observaciones (si existen) */ }
      {
            event.observaciones && (
                <div className=\"mt-2 pt-2 border-t border-border/50\">
                <span className =\"text-xs text-muted-foreground\">Observaciones:</span>
                <p className =\"text-xs text-foreground/80 line-clamp-2\">
            { event.observaciones }
          </p>
        </div >
      )
}
    </Card >
  );
};
