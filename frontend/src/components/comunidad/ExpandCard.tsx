import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Eye, ChevronDown, ChevronUp, CheckCircle2, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VoteButtons } from "./VoteButtons";
import { PostDto } from "@/schemas/DTOSchemas";
import { apiService } from "@/services/api";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface ExpandCardProps {
  post: PostDto;
}

const categoriaColors: Record<string, string> = {
  CULTIVO: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  NUTRICION: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  EQUIPAMIENTO: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  GENETICA: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  GASTRONOMIA: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  PRODUCTOS_HEMP: "bg-teal-500/10 text-teal-600 border-teal-500/20",
};

const categoriaLabels: Record<string, string> = {
  CULTIVO: "Cultivo",
  NUTRICION: "Nutrición",
  EQUIPAMIENTO: "Equipamiento",
  GENETICA: "Genética",
  GASTRONOMIA: "Gastronomía",
  PRODUCTOS_HEMP: "Hemp",
};

export function ExpandCard({ post }: ExpandCardProps) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleVote = async (tipo: "UP" | "DOWN") => {
    try {
      await apiService.votePost(post.id, tipo);
      queryClient.invalidateQueries({ queryKey: ["comunidad-posts"] });
    } catch (err) {
      console.error("Error voting:", err);
    }
  };

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMin / 60);
    const diffD = Math.floor(diffH / 24);
    if (diffD > 0) return `hace ${diffD}d`;
    if (diffH > 0) return `hace ${diffH}h`;
    if (diffMin > 0) return `hace ${diffMin}m`;
    return "ahora";
  };

  return (
    <Card
      className={cn(
        "p-4 cursor-pointer transition-all duration-200 hover:shadow-md group",
        expanded && "ring-2 ring-primary/20"
      )}
      onClick={() => !expanded && setExpanded(true)}
    >
      <div className="flex items-start gap-3">
        {/* Vote buttons */}
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <VoteButtons
            upCount={post.upCount}
            downCount={post.downCount}
            score={post.score}
            currentUserVote={post.currentUserVote}
            onVote={handleVote}
            size="sm"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-medium",
                post.tipoPost === "DEBATE"
                  ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                  : "bg-orange-500/10 text-orange-600 border-orange-500/20"
              )}
            >
              {post.tipoPost === "DEBATE" ? (
                <><Eye className="h-3 w-3 mr-1" /> Debate</>
              ) : (
                <><BookOpen className="h-3 w-3 mr-1" /> Guía</>
              )}
            </Badge>
            <Badge
              variant="outline"
              className={cn("text-xs", categoriaColors[post.categoria])}
            >
              {categoriaLabels[post.categoria]}
            </Badge>
            {post.isResuelto && (
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Resuelto
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-sm leading-tight mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {post.titulo}
          </h3>

          {/* Meta */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>@{post.userUsername}</span>
            <span>·</span>
            <span>{timeAgo(post.fechaCreacion)}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" /> {post.replyCount}
            </span>
            {post.vistas > 0 && (
              <>
                <span>·</span>
                <span>{post.vistas} vistas</span>
              </>
            )}
          </div>

          {/* Expanded content */}
          {expanded && (
            <div className="mt-3 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
                {post.contenido}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/comunidad/${post.id}`)}
                >
                  Ver completo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(false)}
                >
                  <ChevronUp className="h-4 w-4 mr-1" /> Colapsar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Expand indicator */}
        {!expanded && (
          <div className="flex-shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronDown className="h-4 w-4" />
          </div>
        )}
      </div>
    </Card>
  );
}
