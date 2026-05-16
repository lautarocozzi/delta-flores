import {
    Droplets,
    Scissors,
    StickyNote,
    Camera,
    Leaf,
    FlaskConical,
    LucideIcon
} from "lucide-react";

interface EventTypeIconProps {
    eventType: string;
    className?: string;
}

const EVENT_CONFIG: Record<string, { icon: LucideIcon; color: string; bgColor: string }> = {
    WATERING: {
        icon: Droplets,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10"
    },
    PRUNING: {
        icon: Scissors,
        color: "text-orange-500",
        bgColor: "bg-orange-500/10"
    },
    NOTE: {
        icon: StickyNote,
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10"
    },
    PHOTO: {
        icon: Camera,
        color: "text-purple-500",
        bgColor: "bg-purple-500/10"
    },
    STAGE_CHANGE: {
        icon: Leaf,
        color: "text-green-500",
        bgColor: "bg-green-500/10"
    },
    NUTRIENT: {
        icon: FlaskConical,
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10"
    }
};

export const EventTypeIcon = ({ eventType, className = "" }: EventTypeIconProps) => {
    const config = EVENT_CONFIG[eventType] || EVENT_CONFIG.NOTE;
    const Icon = config.icon;

    return (
        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${config.bgColor} ${className}`}>
            <Icon className={`w-4 h-4 ${config.color}`} />
        </div>
    );
};

export const getEventTypeLabel = (eventType: string): string => {
    const labels: Record<string, string> = {
        WATERING: "Riego",
        PRUNING: "Poda",
        NOTE: "Nota",
        PHOTO: "Foto",
        STAGE_CHANGE: "Cambio Etapa",
        NUTRIENT: "Nutriente"
    };
    return labels[eventType] || eventType;
};
