import React from "react";
import { Leaf, Clock, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";

interface PlantCardProps {
  id: string;
  etiqueta: string;
  genetica: string;
  stage: string;
  health: number;
  fechaCreacion: string;
  tipoAmbiente?: 'INTERIOR' | 'EXTERIOR';
  favoriteCount?: number;
  userId?: number;
}

// Get plant image based on sala tipoAmbiente
const getPlantImage = (tipoAmbiente?: string): string => {
  if (tipoAmbiente === 'EXTERIOR') {
    return '/images/flower-outdoor.png';
  }
  return '/images/flower-indoor.png';
};

export const PlantCard = ({
  id,
  etiqueta,
  genetica,
  stage,
  health,
  fechaCreacion,
  tipoAmbiente,
  favoriteCount,
  userId,
}: PlantCardProps) => {
  // Calcular edad en días
  const daysOld = Math.floor((new Date().getTime() - new Date(fechaCreacion).getTime()) / (1000 * 3600 * 24));
  const plantImage = getPlantImage(tipoAmbiente);

  // Favorites Logic (Backend Integration with Hook)
  const { isFavoritePlanta, addFavorite, removeFavorite } = useFavorites();
  const numericId = Number(id);
  const isFav = isFavoritePlanta(numericId);

  const handleToggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFav) {
      removeFavorite(numericId);
    } else {
      addFavorite(numericId);
    }
  };

  // Heart display logic:
  // - No count data → show nothing
  // - 0 likes → outline heart only
  // - 1 like → filled heart, no number (owner's own implicit like)
  // - 2+ likes → filled heart + count
  const showHeartCount = favoriteCount !== undefined;
  const effectiveCount = favoriteCount ?? 0;
  const showNumber = effectiveCount >= 2;

  return (
    <Link to={`/plant/${id}`} className="block h-full">
      <Card className="overflow-hidden border-2 border-primary/50 hover:border-primary/80 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer h-full relative group bg-card">

        {/* TOP: Image Section */}
        <div className="relative h-32 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
          <img
            src={plantImage}
            alt={etiqueta}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

          {/* Subtle heart with like count */}
          {showHeartCount && (
            effectiveCount > 0 ? (
              <button
                onClick={handleToggleFav}
                className={`absolute top-2 right-2 p-1 rounded-full transition-colors z-10 ${
                  isFav
                    ? 'text-red-400 bg-black/20 hover:bg-black/30'
                    : 'text-white/60 bg-black/20 hover:bg-black/30'
                }`}
                title={showNumber ? `${effectiveCount} like${effectiveCount !== 1 ? 's' : ''}` : 'Like'}
              >
                <div className="flex items-center gap-0.5">
                  <Heart size={14} fill={isFav ? "currentColor" : "none"} />
                  {showNumber && (
                    <span className="text-[10px] font-medium leading-none">{effectiveCount}</span>
                  )}
                </div>
              </button>
            ) : (
              <button
                onClick={handleToggleFav}
                className="absolute top-2 right-2 p-1 rounded-full text-white/40 bg-black/20 hover:bg-black/30 transition-colors z-10"
                title="Like"
              >
                <Heart size={14} fill="none" />
              </button>
            )
          )}

          {/* Fallback: show toggle button if no favoriteCount data */}
          {!showHeartCount && (
            <button
              onClick={handleToggleFav}
              className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors z-10 ${
                isFav
                  ? 'text-red-500 bg-red-100/90 dark:bg-red-900/80'
                  : 'text-white/80 bg-black/30 hover:bg-black/50'
              }`}
            >
              <Heart size={16} fill={isFav ? "currentColor" : "none"} />
            </button>
          )}
        </div>

        {/* BOTTOM: Info Section */}
        <div className="p-3 flex flex-col gap-2">
          {/* Plant name with ID */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <p className="text-base font-bold text-primary truncate">{etiqueta}</p>
              <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">#{id}</span>
            </div>
            <p className="text-xs text-muted-foreground italic truncate">{genetica}</p>
          </div>

          {/* Stage and days */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-foreground font-medium">
              <Leaf size={12} className="text-primary" />
              {stage}
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
