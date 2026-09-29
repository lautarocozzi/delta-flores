import React, { useState } from "react";
import { Leaf, Clock, Heart, MoreVertical, Eye, EyeOff, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuthContext } from "@/contexts/AuthContext";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import type { PlantaDto } from "@/schemas/DTOSchemas";

interface FavoritePlantCardProps {
  plant: PlantaDto;
}

const getPlantImage = (tipoAmbiente?: string): string => {
  if (tipoAmbiente === "EXTERIOR") return "/images/flower-outdoor.png";
  return "/images/flower-indoor.png";
};

export const FavoritePlantCard = ({ plant }: FavoritePlantCardProps) => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { removeFavorite } = useFavorites();
  const [menuOpen, setMenuOpen] = useState(false);

  const isOwner = user?.id === plant.userId;
  const daysOld = Math.floor(
    (new Date().getTime() - new Date(plant.fechaCreacion).getTime()) / (1000 * 3600 * 24)
  );
  const plantImage = getPlantImage(plant.sala?.tipoAmbiente);

  const togglePublicMutation = useMutation({
    mutationFn: () => apiService.togglePlantPublic(plant.id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["publicPlantas"] });
      toast({
        title: updated.isPublic ? "Planta ahora es pública" : "Planta ahora es privada",
      });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "No se pudo cambiar la visibilidad." });
    },
  });

  const handleRemoveFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeFavorite(plant.id);
    setMenuOpen(false);
  };

  const handleTogglePublic = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    togglePublicMutation.mutate();
    setMenuOpen(false);
  };

  return (
    <Link to={`/plant/${plant.id}`} className="block h-full">
      <Card className="overflow-hidden border-2 border-primary/50 hover:border-primary/80 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer h-full relative group bg-card">
        {/* TOP: Image Section */}
        <div className="relative h-32 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
          <img
            src={plantImage}
            alt={plant.nombre}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

          {/* Favorite count badge */}
          {(plant.favoriteCount ?? 0) > 0 && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-card/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-medium text-red-500 border border-red-200 dark:border-red-800">
              <Heart size={10} fill="currentColor" />
              {plant.favoriteCount}
            </div>
          )}

          {/* ⋮ Menu */}
          <div className="absolute top-2 right-2" onClick={(e) => e.preventDefault()}>
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1.5 rounded-full bg-black/30 text-white/80 hover:bg-black/50 transition-colors z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {isOwner && (
                  <>
                    <DropdownMenuItem onClick={handleTogglePublic} className="flex items-center gap-2 cursor-pointer">
                      {plant.isPublic ? (
                        <>
                          <EyeOff size={14} />
                          <span>Hacer privada</span>
                        </>
                      ) : (
                        <>
                          <Eye size={14} />
                          <span>Hacer pública</span>
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={handleRemoveFavorite}
                  className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 size={14} />
                  <span>Eliminar de favoritos</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* BOTTOM: Info Section */}
        <div className="p-3 flex flex-col gap-2">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <p className="text-base font-bold text-primary truncate">{plant.nombre}</p>
              <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                #{plant.id}
              </span>
            </div>
            <p className="text-xs text-muted-foreground italic truncate">
              {plant.cepaDto?.geneticaParental || "Desconocida"}
            </p>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-foreground font-medium">
              <Leaf size={12} className="text-primary" />
              {plant.etapa}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock size={12} />
              {daysOld} días
            </div>
          </div>
        </div>

        {/* Hover glow effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
        </div>
      </Card>
    </Link>
  );
};
