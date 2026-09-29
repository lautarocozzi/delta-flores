import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Eye, BookOpen, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { PostDto } from "@/schemas/DTOSchemas";
import { apiService } from "@/services/api";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoriaLabels: Record<string, string> = {
  CULTIVO: "Cultivo",
  NUTRICION: "Nutrición",
  EQUIPAMIENTO: "Equipamiento",
  GENETICA: "Genética",
  GASTRONOMIA: "Gastronomía",
  PRODUCTOS_HEMP: "Hemp",
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PostDto[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await apiService.getPosts({ search: q, size: 10 });
      setResults(data.content);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  const handleSelect = (postId: number) => {
    onOpenChange(false);
    setQuery("");
    setResults([]);
    navigate(`/comunidad/${postId}`);
  };

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    const diffD = Math.floor(diffH / 24);
    if (diffD > 0) return `hace ${diffD}d`;
    if (diffH > 0) return `hace ${diffH}h`;
    return "ahora";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0">
        {/* Search input */}
        <div className="flex items-center border-b px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground mr-3" />
          <Input
            placeholder="Buscar posts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0 text-sm"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {loading && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Buscando...
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No se encontraron posts para "{query}"
            </div>
          )}

          {results.map((post) => (
            <button
              key={post.id}
              className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors flex items-start gap-3"
              onClick={() => handleSelect(post.id)}
            >
              <div className="flex-shrink-0 mt-0.5">
                {post.tipoPost === "DEBATE" ? (
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                ) : (
                  <BookOpen className="h-4 w-4 text-orange-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{post.titulo}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>@{post.userUsername}</span>
                  <span>·</span>
                  <span>{timeAgo(post.fechaCreacion)}</span>
                  <span>·</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {categoriaLabels[post.categoria]}
                  </Badge>
                </div>
              </div>
              <div className="flex-shrink-0 text-xs text-muted-foreground">
                ⬆ {post.score}
              </div>
            </button>
          ))}

          {query.length < 2 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Escribí al menos 2 caracteres para buscar
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
