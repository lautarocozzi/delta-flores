import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Leaf, Thermometer, Droplets, ChevronRight, Sun, Home } from "lucide-react";
import { SalaDto } from "@/interfaces/Planta";
import { cn } from "@/lib/utils";

// Default images for SALAS (rooms) - NOT plant images
// These represent the physical space/environment
const DEFAULT_SALA_IMAGES = {
    INTERIOR: "/FONDO_BLOG_1.png",  // Indoor room with LED lights
    EXTERIOR: "/FONDO_BLOG_2.png",  // Outdoor environment
    DEFAULT: "/FONDO_BLOG_1.png",   // Default fallback
};

interface SalaCardProps {
    sala: SalaDto;
    plantCount: number;
    onClick?: () => void;
}

export function SalaCard({ sala, plantCount, onClick }: SalaCardProps) {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            navigate(`/sala/${sala.id}`);
        }
    };

    // Determine image: custom > tipoAmbiente default > generic default
    // Note: These are SALA images (environments), not plant images
    const getImageUrl = () => {
        if (sala.imagenUrl) return sala.imagenUrl;
        if (sala.tipoAmbiente === 'INTERIOR') return DEFAULT_SALA_IMAGES.INTERIOR;
        if (sala.tipoAmbiente === 'EXTERIOR') return DEFAULT_SALA_IMAGES.EXTERIOR;
        return DEFAULT_SALA_IMAGES.DEFAULT;
    };

    const imageUrl = getImageUrl();

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={handleClick}
            className={cn(
                "group relative overflow-hidden rounded-xl cursor-pointer",
                "bg-card border border-border",
                "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10",
                "transition-colors duration-300",
                "h-[200px] w-full min-w-[200px]"
            )}
        >
            {/* Top Half: Image */}
            <div className="relative h-1/2 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                <img
                    src={imageUrl}
                    alt={sala.nombre}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />

                {/* Gradient overlay for seamless transition */}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

                {/* Badges row */}
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    {/* Tipo ambiente badge */}
                    {sala.tipoAmbiente && (
                        <div className={cn(
                            "flex items-center gap-1 px-1.5 py-0.5 rounded-full backdrop-blur-sm text-[10px] font-medium",
                            sala.tipoAmbiente === 'INTERIOR'
                                ? "bg-blue-500/20 text-blue-300"
                                : "bg-orange-500/20 text-orange-300"
                        )}>
                            {sala.tipoAmbiente === 'INTERIOR'
                                ? <Home className="w-2.5 h-2.5" />
                                : <Sun className="w-2.5 h-2.5" />
                            }
                        </div>
                    )}
                    {/* Plant count badge */}
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm">
                        <Leaf className="w-3 h-3 text-primary" />
                        <span className="text-xs font-medium text-foreground">{plantCount}</span>
                    </div>
                </div>
            </div>

            {/* Bottom Half: Data */}
            <div className="h-1/2 p-3 flex flex-col justify-between">
                {/* Room name */}
                <div>
                    <h3 className="font-bold text-foreground text-base truncate group-hover:text-primary transition-colors">
                        {sala.nombre}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        {plantCount} planta{plantCount !== 1 ? 's' : ''} activa{plantCount !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* Room stats row */}
                <div className="flex items-center justify-between">
                    <div className="flex gap-3 text-xs text-muted-foreground">
                        {sala.temperaturaAmbiente && (
                            <div className="flex items-center gap-1">
                                <Thermometer className="w-3 h-3 text-orange-400" />
                                <span>{sala.temperaturaAmbiente}°C</span>
                            </div>
                        )}
                        {sala.humedad && (
                            <div className="flex items-center gap-1">
                                <Droplets className="w-3 h-3 text-blue-400" />
                                <span>{sala.humedad}%</span>
                            </div>
                        )}
                    </div>

                    {/* Arrow indicator */}
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
            </div>

            {/* Hover glow effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
            </div>
        </motion.div>
    );
}
