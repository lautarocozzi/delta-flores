import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Leaf, Thermometer, Droplets, ChevronRight, Sun, Home } from "lucide-react";
import { SalaDto } from "@/schemas/DTOSchemas";
import { cn } from "@/lib/utils";

// Default images for SALAS (rooms) - NOT plant images
const DEFAULT_SALA_IMAGES = {
    INTERIOR: "/FONDO_BLOG_1.png",
    EXTERIOR: "/FONDO_BLOG_2.png",
    DEFAULT: "/FONDO_BLOG_1.png",
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
        } else if (sala.ownerUsername) {
            navigate(`/${sala.ownerUsername}/sala/${sala.id}`);
        }
    };

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
                "transition-colors duration-300",
                "h-[200px] w-full min-w-[200px]",
                "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
            )}
        >
            {/* Top Half: Image */}
            <div className="relative h-1/2 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                <img
                    src={imageUrl}
                    alt={sala.nombre}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

                {/* Badges row */}
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
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
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm">
                        <Leaf className="w-3 h-3 text-primary" />
                        <span className="text-xs font-medium text-foreground">{plantCount}</span>
                    </div>
                </div>
            </div>

            {/* Bottom Half: Data */}
            <div className="h-1/2 p-3 flex flex-col justify-between">
                <div>
                    <h3 className="font-bold text-base truncate text-foreground group-hover:text-primary transition-colors">
                        {sala.nombre}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        {plantCount} planta{plantCount !== 1 ? 's' : ''} activa{plantCount !== 1 ? 's' : ''}
                    </p>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex gap-3 text-xs text-muted-foreground">
                        {sala.temperaturaAmbiente != null && (
                            <div className="flex items-center gap-1">
                                <Thermometer className="w-3 h-3 text-orange-400" />
                                <span>{sala.temperaturaAmbiente}°C</span>
                            </div>
                        )}
                        {sala.humedad != null && (
                            <div className="flex items-center gap-1">
                                <Droplets className="w-3 h-3 text-blue-400" />
                                <span>{sala.humedad}%</span>
                            </div>
                        )}
                    </div>

                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
            </div>

            {/* Hover glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
            </div>
        </motion.div>
    );
}
