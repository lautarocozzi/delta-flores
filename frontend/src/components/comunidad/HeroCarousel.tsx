import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Eye, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PostDto } from "@/schemas/DTOSchemas";
import { apiService } from "@/services/api";
import { cn } from "@/lib/utils";

const categoriaGradients: Record<string, string> = {
  CULTIVO: "from-emerald-600 to-emerald-800",
  NUTRICION: "from-amber-600 to-amber-800",
  EQUIPAMIENTO: "from-blue-600 to-blue-800",
  GENETICA: "from-purple-600 to-purple-800",
  GASTRONOMIA: "from-rose-600 to-rose-800",
  PRODUCTOS_HEMP: "from-teal-600 to-teal-800",
};

const categoriaLabels: Record<string, string> = {
  CULTIVO: "Cultivo",
  NUTRICION: "Nutrición",
  EQUIPAMIENTO: "Equipamiento",
  GENETICA: "Genética",
  GASTRONOMIA: "Gastronomía",
  PRODUCTOS_HEMP: "Hemp",
};

export function HeroCarousel() {
  const [heroPosts, setHeroPosts] = useState<PostDto[]>([]);
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    apiService.getHeroPosts().then(setHeroPosts).catch(console.error);
  }, []);

  useEffect(() => {
    if (heroPosts.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroPosts.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroPosts.length]);

  if (heroPosts.length === 0) return null;

  const post = heroPosts[current];
  const gradient = categoriaGradients[post.categoria] || "from-gray-600 to-gray-800";

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Background gradient */}
      <div
        className={cn(
          "bg-gradient-to-br text-white p-6 min-h-[180px] flex flex-col justify-between cursor-pointer",
          gradient
        )}
        onClick={() => navigate(`/comunidad/${post.id}`)}
      >
        {/* Top badges */}
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
            {post.tipoPost === "DEBATE" ? (
              <><Eye className="h-3 w-3 mr-1" /> Debate</>
            ) : (
              <><BookOpen className="h-3 w-3 mr-1" /> Guía</>
            )}
          </Badge>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
            {categoriaLabels[post.categoria]}
          </Badge>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold leading-tight mb-2 line-clamp-2">
          {post.titulo}
        </h2>

        {/* Meta */}
        <div className="flex items-center gap-3 text-sm text-white/80">
          <span>@{post.userUsername}</span>
          <span>·</span>
          <span>⬆ {post.score}</span>
          <span>·</span>
          <span>💬 {post.replyCount}</span>
        </div>
      </div>

      {/* Navigation arrows */}
      {heroPosts.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white h-8 w-8 p-0 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              setCurrent((prev) => (prev - 1 + heroPosts.length) % heroPosts.length);
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white h-8 w-8 p-0 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              setCurrent((prev) => (prev + 1) % heroPosts.length);
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Dots */}
      {heroPosts.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {heroPosts.map((_, i) => (
            <button
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i === current ? "bg-white w-4" : "bg-white/50"
              )}
              onClick={(e) => {
                e.stopPropagation();
                setCurrent(i);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
