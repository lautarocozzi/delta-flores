import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Command } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layouts/AppSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HeroCarousel } from "@/components/comunidad/HeroCarousel";
import { CategorySection } from "@/components/comunidad/CategorySection";
import { ExpandCard } from "@/components/comunidad/ExpandCard";
import { CreatePostDialog } from "@/components/comunidad/CreatePostDialog";
import { CommandPalette } from "@/components/comunidad/CommandPalette";
import { apiService } from "@/services/api";
import { PostDto } from "@/schemas/DTOSchemas";

const categorias = [
  { key: "CULTIVO", icon: "🌱", label: "Cultivo" },
  { key: "NUTRICION", icon: "🧪", label: "Nutrición" },
  { key: "EQUIPAMIENTO", icon: "🔧", label: "Equipamiento" },
  { key: "GENETICA", icon: "🧬", label: "Genética" },
  { key: "GASTRONOMIA", icon: "🍳", label: "Gastronomía" },
  { key: "PRODUCTOS_HEMP", icon: "🌿", label: "Hemp" },
];

export default function ComunidadPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Fetch posts
  const { data, isLoading } = useQuery({
    queryKey: ["comunidad-posts", activeFilter, activeCategory],
    queryFn: () =>
      apiService.getPosts({
        tipo: activeFilter === "all" ? undefined : activeFilter,
        categoria: activeCategory || undefined,
        size: 50,
      }),
  });

  const posts = data?.content || [];

  // Group posts by category
  const postsByCategory = useMemo(() => {
    const grouped: Record<string, PostDto[]> = {};
    categorias.forEach((cat) => {
      grouped[cat.key] = posts.filter((p) => p.categoria === cat.key);
    });
    return grouped;
  }, [posts]);

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-hidden min-w-0">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <h1 className="text-lg font-bold">Comunidad</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setCommandOpen(true)}
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Buscar</span>
                  <kbd className="hidden sm:inline text-[10px] bg-muted px-1.5 py-0.5 rounded">
                    ⌘K
                  </kbd>
                </Button>
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Nuevo
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto">
              <Button
                variant={activeFilter === "all" ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => setActiveFilter("all")}
              >
                Todos
              </Button>
              <Button
                variant={activeFilter === "DEBATE" ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => setActiveFilter("DEBATE")}
              >
                Debates
              </Button>
              <Button
                variant={activeFilter === "GUIA" ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => setActiveFilter("GUIA")}
              >
                Guías
              </Button>
              <div className="w-px h-4 bg-border mx-1" />
              {categorias.map((cat) => (
                <Button
                  key={cat.key}
                  variant={activeCategory === cat.key ? "default" : "outline"}
                  size="sm"
                  className="text-xs whitespace-nowrap"
                  onClick={() =>
                    setActiveCategory(activeCategory === cat.key ? null : cat.key)
                  }
                >
                  {cat.icon} {cat.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-4 max-w-4xl mx-auto min-w-0">
            {/* Hero Carousel */}
            {!activeCategory && activeFilter === "all" && (
              <div className="mb-6">
                <HeroCarousel />
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 rounded-lg" />
                ))}
              </div>
            )}

            {/* Posts by category (magazine layout) */}
            {!isLoading && !activeCategory && activeFilter === "all" && (
              <>
                {categorias.map((cat) => (
                  <CategorySection
                    key={cat.key}
                    title={cat.label}
                    icon={cat.icon}
                    posts={postsByCategory[cat.key] || []}
                  />
                ))}
              </>
            )}

            {/* Filtered view */}
            {!isLoading && (activeCategory || activeFilter !== "all") && (
              <div className="space-y-3">
                {posts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No hay posts para este filtro.
                  </div>
                ) : (
                  posts.map((post) => <ExpandCard key={post.id} post={post} />)
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Dialogs */}
      <CreatePostDialog open={createOpen} onOpenChange={setCreateOpen} />
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </SidebarProvider>
  );
}
