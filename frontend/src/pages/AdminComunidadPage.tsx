import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Star, StarOff, Trash2, MessageSquare, Eye, BookOpen,
  ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layouts/AppSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiService } from "@/services/api";
import { PostDto } from "@/schemas/DTOSchemas";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const categoriaLabels: Record<string, string> = {
  CULTIVO: "Cultivo",
  NUTRICION: "Nutrición",
  EQUIPAMIENTO: "Equipamiento",
  GENETICA: "Genética",
  GASTRONOMIA: "Gastronomía",
  PRODUCTOS_HEMP: "Hemp",
};

export default function AdminComunidadPage() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "post" | "reply"; id: number; label: string } | null>(null);
  const pageSize = 15;

  const isAdmin = user?.role === "ROLE_ADMIN" || user?.role === "ROLE_SUPER_ADMIN";

  // Fetch all posts (admin sees everything)
  const { data, isLoading } = useQuery({
    queryKey: ["admin-comunidad-posts", page],
    queryFn: () => apiService.getPosts({ page, size: pageSize }),
    enabled: isAdmin,
  });

  // Fetch hero posts for the hero section
  const { data: heroPosts = [] } = useQuery({
    queryKey: ["comunidad-hero"],
    queryFn: apiService.getHeroPosts,
    enabled: isAdmin,
  });

  const posts = data?.content || [];
  const totalPages = data?.totalPages || 0;

  // Toggle hero mutation
  const heroMutation = useMutation({
    mutationFn: (postId: number) => apiService.toggleHero(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comunidad-hero"] });
      queryClient.invalidateQueries({ queryKey: ["admin-comunidad-posts"] });
      toast({ title: "Hero actualizado" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "No se pudo cambiar el estado hero." });
    },
  });

  // Delete mutation (post or reply)
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deleteTarget) return;
      if (deleteTarget.type === "post") {
        await apiService.deletePostAdmin(deleteTarget.id);
      } else {
        await apiService.deleteReplyAdmin(deleteTarget.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comunidad-posts"] });
      toast({ title: "Eliminado correctamente" });
      setDeleteTarget(null);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar." });
    },
  });

  if (!isAdmin) {
    return (
      <SidebarProvider>
        <div className="min-h-screen w-full flex bg-background">
          <AppSidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="mx-auto mb-4 text-muted-foreground" size={48} />
              <p className="text-lg font-semibold mb-2">Acceso restringido</p>
              <p className="text-muted-foreground">Solo los administradores pueden acceder a esta página.</p>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

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
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-40 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="flex-1">
                <h1 className="text-2xl font-bold">Admin Comunidad</h1>
                <p className="text-sm text-muted-foreground">Gestionar posts hero y moderación</p>
              </div>
            </div>
          </header>

          <div className="p-6 max-w-5xl mx-auto space-y-8">
            {/* Hero Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Posts Hero</h2>
                <Badge variant="secondary" className="text-xs">
                  {heroPosts.length} / 5
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Los posts hero aparecen en el carrusel destacado de la Comunidad.
              </p>
              {heroPosts.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Star className="mx-auto mb-2" size={32} />
                    <p>No hay posts hero todavía.</p>
                    <p className="text-xs mt-1">Activá el toggle en la tabla de abajo para destacar posts.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {heroPosts.map((post) => (
                    <Card key={post.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/comunidad/${post.id}`)}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Star className="w-5 h-5 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{post.titulo}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>@{post.userUsername}</span>
                            <span>·</span>
                            <span>{categoriaLabels[post.categoria]}</span>
                            <span>·</span>
                            <span>{post.score} votos</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-shrink-0"
                          onClick={(e) => { e.stopPropagation(); heroMutation.mutate(post.id); }}
                          title="Quitar de hero"
                        >
                          <StarOff className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Moderation Table */}
            <section>
              <h2 className="text-lg font-bold mb-4">Todos los Posts</h2>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
                </div>
              ) : posts.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <MessageSquare className="mx-auto mb-2" size={32} />
                    <p>No hay posts todavía.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8"></TableHead>
                          <TableHead>Título</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead className="text-center">Votos</TableHead>
                          <TableHead className="text-center">Replys</TableHead>
                          <TableHead className="text-center">Vistas</TableHead>
                          <TableHead>Autor</TableHead>
                          <TableHead>Tiempo</TableHead>
                          <TableHead className="w-24 text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {posts.map((post) => (
                          <TableRow
                            key={post.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => navigate(`/comunidad/${post.id}`)}
                          >
                            <TableCell>
                              {post.isHero ? (
                                <Star className="w-4 h-4 text-primary fill-primary" />
                              ) : (
                                <StarOff className="w-4 h-4 text-muted-foreground/30" />
                              )}
                            </TableCell>
                            <TableCell className="font-medium max-w-[200px] truncate">
                              {post.titulo}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn(
                                "text-xs",
                                post.tipoPost === "DEBATE"
                                  ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                  : "bg-orange-500/10 text-orange-600 border-orange-500/20"
                              )}>
                                {post.tipoPost === "DEBATE" ? (
                                  <><Eye className="h-3 w-3 mr-1" /> Debate</>
                                ) : (
                                  <><BookOpen className="h-3 w-3 mr-1" /> Guía</>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-muted-foreground">{categoriaLabels[post.categoria]}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={cn("text-sm", post.score > 0 ? "text-green-600" : post.score < 0 ? "text-red-600" : "text-muted-foreground")}>
                                {post.score}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-sm text-muted-foreground">{post.replyCount}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-sm text-muted-foreground">{post.vistas}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-muted-foreground">@{post.userUsername}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-muted-foreground">{timeAgo(post.fechaCreacion)}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => heroMutation.mutate(post.id)}
                                  title={post.isHero ? "Quitar de hero" : "Hacer hero"}
                                >
                                  {post.isHero ? (
                                    <StarOff className="w-3.5 h-3.5 text-muted-foreground" />
                                  ) : (
                                    <Star className="w-3.5 h-3.5 text-primary" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteTarget({ type: "post", id: post.id, label: post.titulo })}
                                  title="Eliminar post"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Página {page + 1} de {totalPages}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page === 0}
                          onClick={() => setPage((p) => p - 1)}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page >= totalPages - 1}
                          onClick={() => setPage((p) => p + 1)}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar {deleteTarget?.type === "post" ? "Post" : "Reply"}</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro que querés eliminar <strong>{deleteTarget?.label}</strong>? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
