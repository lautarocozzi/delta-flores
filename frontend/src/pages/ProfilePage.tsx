import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layouts/AppSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Eye, Building2, Heart, Activity, Pencil, Calendar, Share2, Sun, Thermometer, Droplets, MessageSquare, Pin, Plus, Clock, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";
import { PlantCard } from "@/components/dashboard/PlantCard";
import { UnifiedSalaView } from "@/components/sala/UnifiedSalaView";
import { SalaMetricsChart } from "@/components/sala/SalaMetricsChart";
import { ZonaGridModal } from "@/components/sala/ZonaGridModal";
import { SalaCardMenu } from "@/components/sala/SalaCardMenu";
import { ConfirmVisibilityModal } from "@/components/sala/ConfirmVisibilityModal";
import { FormularioSalaInfo } from "@/components/sala/FormularioSalaInfo";
import { FormularioSalaZonas } from "@/components/sala/FormularioSalaZonas";
import { ColaboradoresManager } from "@/components/panels/ColaboradoresManager";
import { ExpandCard } from "@/components/comunidad/ExpandCard";
import TareaProgramadaForm from "@/components/shared/TareaProgramadaForm";
import { usePlantas } from "@/hooks/usePlantas";
import { useSalaTheme } from "@/contexts/SalaThemeContext";
import { useToast } from "@/hooks/use-toast";
import type { SalaDto, PlantaDto, ZonaDto } from "@/schemas/DTOSchemas";

export default function ProfilePage() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const { username: routeUsername } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isRadiant } = useSalaTheme();

  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("publicas");
  const [selectedPublicSalaId, setSelectedPublicSalaId] = useState<number | null>(null);
  const [selectedPublicZonaId, setSelectedPublicZonaId] = useState<number | null>(null);

  // Menu / modal state
  const [menuSalaId, setMenuSalaId] = useState<number | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [zonasOpen, setZonasOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePlants, setDeletePlants] = useState(false);
  const [publicConfirmOpen, setPublicConfirmOpen] = useState(false);
  const [pendingPublicSalaId, setPendingPublicSalaId] = useState<number | null>(null);
  const [pendingMakingPublic, setPendingMakingPublic] = useState(true);
  const [colabOpen, setColabOpen] = useState(false);
  const [postsPage, setPostsPage] = useState(0);


  // ── Data fetching ────────────────────────────
  const { data: profileUser, isLoading: loadingProfile } = useQuery({
    queryKey: ["publicProfile", routeUsername],
    queryFn: () => apiService.getPublicProfileByUsername(routeUsername!),
    enabled: !!routeUsername,
    staleTime: 1000 * 60 * 5,
  });

  const displayUser = routeUsername ? profileUser ?? user : user;
  const isOwnProfile = !routeUsername || displayUser?.id === user?.id;
  const profileNotFound = routeUsername && !loadingProfile && !profileUser;

  const { data: userPlantas = [] } = useQuery({
    queryKey: ["plantas"],
    queryFn: apiService.getPlantas,
    staleTime: 1000 * 60 * 5,
    enabled: isOwnProfile,
  });

  const { data: userEvents = [] } = useQuery({
    queryKey: ["allEventsForMetrics"],
    queryFn: () => apiService.getAllEventsForCurrentUser(),
    staleTime: 1000 * 60 * 5,
    enabled: isOwnProfile,
  });

  const { data: publicSalas = [], isLoading: loadingPublicSalas } = useQuery({
    queryKey: ["salas", "public", routeUsername || "own", isOwnProfile],
    queryFn: () =>
      routeUsername
        ? apiService.getPublicSalasByUsername(routeUsername, isOwnProfile)
        : apiService.getSalas(),
    staleTime: 1000 * 60 * 5,
    enabled: activeTab === "publicas",
  });

  const { data: selectedPublicZonas = [], isLoading: loadingSelectedZonas } = useQuery({
    queryKey: ["zonas", "sala", selectedPublicSalaId],
    queryFn: () => apiService.getZonasBySala(selectedPublicSalaId!),
    enabled: selectedPublicSalaId !== null,
    staleTime: 1000 * 60 * 5,
  });

  const { byZona: publicByZona } = usePlantas(selectedPublicSalaId);

  const { data: favoritePlantas = [], isLoading: loadingFavorites } = useQuery({
    queryKey: ["favorites"],
    queryFn: apiService.getFavoritePlantas,
    staleTime: 1000 * 60 * 5,
    enabled: activeTab === "favoritos" && isOwnProfile,
  });

  const { data: publicPlantas = [], isLoading: loadingPublicPlantas } = useQuery({
    queryKey: ["publicPlantas", displayUser?.username],
    queryFn: () => apiService.getPublicPlantasByUsername(displayUser!.username!),
    staleTime: 1000 * 60 * 5,
    enabled: activeTab === "publicas" && !!displayUser?.username,
  });

  const displayUserId = displayUser?.id;
  const { data: userPostsData, isLoading: loadingPosts } = useQuery({
    queryKey: ["user-posts", displayUserId, postsPage],
    queryFn: () => apiService.getUserPosts(displayUserId!, postsPage, 10),
    enabled: activeTab === "posts" && isOwnProfile && !!displayUserId,
    staleTime: 1000 * 60 * 2,
  });

  // ── Derived ──────────────────────────────────
  const menuSala = menuSalaId ? publicSalas.find((s) => s.id === menuSalaId) ?? null : null;

  // Plantas to show in the profile tab: public, sorted by favoriteCount desc
  const profilePlantas = useMemo(() => {
    return [...publicPlantas].sort((a, b) => (b.favoriteCount ?? 0) - (a.favoriteCount ?? 0));
  }, [publicPlantas]);

  // Auto-select sala: pinned first, then most recently modified
  useEffect(() => {
    if (publicSalas.length === 0 || selectedPublicSalaId !== null) return;

    const sorted = [...publicSalas].sort((a, b) => {
      // Pinned always first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Then by fechaModificacion (most recent first)
      const dateA = a.fechaModificacion ? new Date(a.fechaModificacion).getTime() : 0;
      const dateB = b.fechaModificacion ? new Date(b.fechaModificacion).getTime() : 0;
      return dateB - dateA;
    });

    setSelectedPublicSalaId(sorted[0].id);
  }, [publicSalas, selectedPublicSalaId]);

  // US-19: Memoize activityStats
  const activityStats = useMemo(() => ({
    totalPlantas: userPlantas.length,
    totalEventos: userEvents.length,
    eventosRecientes: (() => {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      return userEvents.filter((event) => new Date(event.fecha) >= lastWeek).length;
    })(),
    plantasFloración: userPlantas.filter((p) => p.etapa === "FLORACION").length,
  }), [userPlantas, userEvents]);

  // Handle both auth context (.role) and API UserDto (.rol) field names
  const userRole = isOwnProfile ? user?.role : displayUser?.rol;
  const roleLabel = userRole === "ROLE_ADMIN" ? "Admin" : userRole === "ROLE_SUPER_ADMIN" ? "Super Admin" : "Grower";

  // US-17: Clipboard with error handling
  const handleShare = () => {
    if (!displayUser?.username) return;
    const url = `${window.location.origin}/${displayUser.username}`;
    navigator.clipboard.writeText(url).then(
      () => toast({ title: "Link copiado", description: "Se copió el link del perfil al portapapeles." }),
      () => toast({ variant: "destructive", title: "Error", description: "No se pudo copiar el link al portapapeles." }),
    );
  };

  // ── Menu handlers ────────────────────────────
  const handleMenuInfo = useCallback(() => {
    setInfoOpen(true);
  }, []);

  const handleMenuZonas = useCallback(() => {
    setZonasOpen(true);
  }, []);

  const handleMenuDelete = useCallback(() => {
    setDeletePlants(false);
    setDeleteOpen(true);
  }, []);

  // ── Delete mutation ──────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!menuSala) return;
      await apiService.deleteSala(menuSala.id, deletePlants);
    },
    onSuccess: () => {
      toast({ title: "Sala Eliminada", description: "La sala fue eliminada correctamente." });
      queryClient.invalidateQueries({ queryKey: ["salas"] });
      setDeleteOpen(false);
      setMenuSalaId(null);
      setSelectedPublicSalaId(null);
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo eliminar la sala." });
    },
  });

  // ── Toggle sala visibility ───────────────────
  const toggleSalaPublic = useMutation({
    mutationFn: ({ salaId, propagateVisibility }: { salaId: number; propagateVisibility: boolean }) =>
      apiService.toggleSalaPublic(salaId, propagateVisibility),
    onSuccess: (updated) => {
      queryClient.setQueryData(["salas"], (old: SalaDto[] | undefined) =>
        old?.map((s) => (s.id === updated.id ? updated : s))
      );
      queryClient.invalidateQueries({ queryKey: ["salas"] });
      toast({ title: "Visibilidad actualizada", description: updated.isPublic ? "Sala ahora es pública." : "Sala ahora es privada." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "No se pudo cambiar la visibilidad de la sala." });
    },
  });

  // ── Toggle sala pin ─────────────────────────
  const pinMutation = useMutation({
    mutationFn: (salaId: number) => apiService.toggleSalaPin(salaId),
    onSuccess: (updated) => {
      queryClient.setQueryData(["salas"], (old: SalaDto[] | undefined) =>
        old?.map((s) => (s.id === updated.id ? updated : s))
      );
      queryClient.invalidateQueries({ queryKey: ["salas"] });
      toast({ title: updated.isPinned ? "Sala fijada" : "Sala desfijada", description: updated.isPinned ? "La sala aparece primero en tu perfil." : "La sala ya no está fijada." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "No se pudo cambiar el pin de la sala." });
    },
  });

  // ── Tareas programadas ────────────────────
  const [tareasOpen, setTareasOpen] = useState(false);
  const { data: tareas = [] } = useQuery({
    queryKey: ["tareas"],
    queryFn: () => apiService.getTareas(),
    enabled: isOwnProfile,
  });
  const toggleTareaMutation = useMutation({
    mutationFn: (id: number) => apiService.toggleTarea(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tareas"] });
      toast({ title: "Tarea actualizada" });
    },
    onError: () => toast({ variant: "destructive", title: "Error al actualizar tarea" }),
  });
  const deleteTareaMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteTarea(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tareas"] });
      toast({ title: "Tarea eliminada" });
    },
    onError: () => toast({ variant: "destructive", title: "Error al eliminar tarea" }),
  });

  // ── Handle sala visibility toggle ────────────
  const handleSalaVisibilityToggle = (sala: SalaDto, makePublic: boolean) => {
    // Always show modal — user chooses whether to propagate visibility to plants
    setPendingPublicSalaId(sala.id);
    setPendingMakingPublic(makePublic);
    setPublicConfirmOpen(true);
  };

  // ── Determine if a sala is "own" for theme ──
  const isOwnSala = (sala: SalaDto) => sala.userId === user?.id;

  // ── Loading / not-found states ───────────────
  if (!user || (routeUsername && loadingProfile)) {
    return (
      <SidebarProvider>
        <div className="min-h-screen w-full flex bg-background">
          <AppSidebar />
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Cargando perfil...</p>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (profileNotFound) {
    return (
      <SidebarProvider>
        <div className="min-h-screen w-full flex bg-background">
          <AppSidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">Usuario no encontrado</p>
              <p className="text-muted-foreground">No existe un usuario con el nombre &quot;{routeUsername}&quot;</p>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-background">
        <AppSidebar />
        <div className="flex-1 overflow-auto">
          <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-40 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{roleLabel}</h1>
              </div>
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </header>

          <main className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Profile Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={displayUser?.imagenUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${displayUser?.nombre || displayUser?.username || "User"}`} />
                      <AvatarFallback>{displayUser?.nombre?.[0] || displayUser?.username?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    {isOwnProfile && (
                      <button
                        onClick={() => setEditOpen(true)}
                        className="absolute -bottom-1 -right-1 p-1 rounded-full bg-muted border border-border hover:bg-accent transition-colors"
                        title="Editar perfil"
                      >
                        <Pencil className="w-3 h-3 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold truncate">
                      {displayUser?.nombre} {displayUser?.apellido}
                    </p>
                    {displayUser?.username && <p className="text-sm text-muted-foreground">@{displayUser.username}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs — Icons only */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="publicas" className="px-2">
                  <Eye className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="favoritos" className="px-2">
                  <Heart className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="posts" className="px-2">
                  <MessageSquare className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="actividad" className="px-2">
                  <Activity className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>

              {/* ── Públicas Tab ── */}
              <TabsContent value="publicas" className="mt-4">
                {/* Public Salas Carousel */}
                {loadingPublicSalas ? (
                  <div className="flex gap-3 mb-4 overflow-hidden">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="w-16 h-16 rounded-full shrink-0" />
                    ))}
                  </div>
                ) : publicSalas.length > 0 ? (
                  <div className="mb-6">
                    <div className="h-[120px]">
                      <div className="flex gap-3 overflow-x-auto scrollbar-hide py-3 px-1 h-full items-start">
                        {publicSalas.map((sala) => {
                          const isSelected = sala.id === selectedPublicSalaId;
                          const own = isOwnSala(sala);
                          return (
                            <div key={sala.id} className="flex flex-col items-center gap-1 shrink-0">
                              <div className="relative">
                                <button
                                  onClick={() => setSelectedPublicSalaId((prev) => (prev === sala.id ? null : sala.id))}
                                  className="flex flex-col items-center gap-1"
                                >
                                  <div
                                    className={`rounded-full overflow-hidden border-2 transition-all duration-200 ${
                                      isSelected
                                        ? own
                                          ? "border-primary ring-2 ring-primary/30 w-[72px] h-[72px]"
                                          : "border-muted-foreground/40 ring-2 ring-muted-foreground/20 w-[72px] h-[72px]"
                                        : own
                                          ? "border-border hover:border-primary/50 w-14 h-14"
                                          : "border-muted-foreground/20 opacity-55 hover:border-muted-foreground/30 w-14 h-14"
                                    }`}
                                  >
                                    {sala.imagenUrl ? (
                                      <img src={sala.imagenUrl} alt={sala.nombre} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className={`w-full h-full flex items-center justify-center ${own ? "bg-gradient-to-br from-primary/20 to-primary/5" : "bg-gradient-to-br from-muted/30 to-muted/10"}`}>
                                        <Building2 className={`h-5 w-5 ${own ? "text-primary/40" : "text-muted-foreground/30"}`} />
                                      </div>
                                    )}
                                  </div>
                                  {/* Pin indicator */}
                                  {sala.isPinned && own && (
                                    <Pin className="absolute -top-0.5 -right-0.5 w-3 h-3 text-primary fill-primary" />
                                  )}
                                  <span className={`truncate max-w-[72px] ${
                                    isSelected
                                      ? "text-xs font-medium"
                                      : "text-[10px] text-muted-foreground/60"
                                  } ${isSelected && own ? "text-primary" : ""} ${isSelected && !own ? "text-muted-foreground" : ""}`}>
                                    {sala.nombre}
                                  </span>
                                </button>
                              </div>
                            </div>
                        );
                      })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Building2 className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <p className="text-muted-foreground">No hay salas públicas</p>
                  </div>
                )}

                {/* Selected sala info + zone map + metrics + plants */}
                {selectedPublicSalaId !== null &&
                  (() => {
                    const sala = publicSalas.find((s) => s.id === selectedPublicSalaId);
                    if (!sala) return null;
                    const own = isOwnSala(sala);
                    return (
                      <>
                        {/* Sala header */}
                        <div className="mb-4">
                          <div className="mb-3">
                            <div className="flex items-center gap-2 mb-1">
                              <h2 className="text-lg font-bold">{sala.nombre}</h2>
                              {!own && (
                                <Badge variant="secondary" className="text-[10px] bg-muted/30 text-muted-foreground border border-muted-foreground/20">
                                  Colaborador
                                </Badge>
                              )}
                              {isOwnProfile && (
                                <div className="ml-auto">
                                  <SalaCardMenu
                                    isOwner={own}
                                    tipoColaborador={sala.tipoColaborador}
                                    isPublic={sala.isPublic}
                                    onInfo={() => { setMenuSalaId(sala.id); handleMenuInfo(); }}
                                    onZonas={() => { setMenuSalaId(sala.id); handleMenuZonas(); }}
                                    onDelete={() => { setMenuSalaId(sala.id); handleMenuDelete(); }}
                                    onTogglePublic={own ? (makePublic) => handleSalaVisibilityToggle(sala, makePublic) : undefined}
                                    onColaboradores={own ? () => { setMenuSalaId(sala.id); setColabOpen(true); } : undefined}
                                  />
                                </div>
                              )}
                            </div>
                            {sala.ownerUsername && (
                              <p className="text-xs text-muted-foreground mb-1">@{sala.ownerUsername}</p>
                            )}
                            {sala.descripcion && <p className="text-sm text-muted-foreground">{sala.descripcion}</p>}
                          </div>
                        </div>

                        {/* Zone Map */}
                        {loadingSelectedZonas ? (
                          <div className="mb-4">
                            <Skeleton className="w-full aspect-square rounded-lg" />
                          </div>
                        ) : (
                          <UnifiedSalaView zonas={selectedPublicZonas} salaId={selectedPublicSalaId} onZonaClick={(zonaId) => setSelectedPublicZonaId(zonaId)} />
                        )}

                        {/* Metrics row */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 my-4">
                          <div className="md:col-span-2 bg-card/50 backdrop-blur-sm rounded-xl border border-border p-4 flex items-center justify-around">
                            <div className="flex flex-col items-center gap-1">
                              <Sun size={18} className="text-primary" />
                              <span className="text-sm font-medium">{sala.horasLuz || "-"}</span>
                              <span className="text-[10px] text-muted-foreground">Luz</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                              <Thermometer size={18} className="text-orange-500" />
                              <span className="text-sm font-medium">{sala.temperaturaAmbiente != null ? `${sala.temperaturaAmbiente}°` : "-"}</span>
                              <span className="text-[10px] text-muted-foreground">Temp</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                              <Droplets size={18} className="text-blue-500" />
                              <span className="text-sm font-medium">{sala.humedad != null ? `${sala.humedad}%` : "-"}</span>
                              <span className="text-[10px] text-muted-foreground">Humedad</span>
                            </div>
                          </div>
                          <div className="md:col-span-3">
                            <SalaMetricsChart salaId={selectedPublicSalaId} months={6} />
                          </div>
                        </div>

                        {/* Plants grid with lazy loading */}
                        <SalaPlantsSection salaId={sala.id} plantas={profilePlantas} />
                      </>
                    );
                  })()}
              </TabsContent>

              {/* ── Favoritos Tab ── */}
              <TabsContent value="favoritos" className="mt-4">
                {!isOwnProfile ? (
                  <div className="text-center py-12">
                    <Heart className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <p className="text-muted-foreground">Los favoritos son privados</p>
                  </div>
                ) : loadingFavorites ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-48 rounded-lg" />
                    ))}
                  </div>
                ) : favoritePlantas.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <p className="text-muted-foreground">No tenés plantas favoritas</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {favoritePlantas.map((plant) => (
                      <PlantCard
                        key={plant.id}
                        id={plant.id.toString()}
                        etiqueta={plant.nombre}
                        genetica={plant.cepaDto?.geneticaParental || "Desconocida"}
                        stage={plant.etapa}
                        health={0}
                        fechaCreacion={plant.fechaCreacion}
                        tipoAmbiente={plant.sala?.tipoAmbiente as "INTERIOR" | "EXTERIOR" | undefined}
                        favoriteCount={plant.favoriteCount}
                        userId={plant.userId}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ── Posts Tab ── */}
              <TabsContent value="posts" className="mt-4">
                {!isOwnProfile ? (
                  <div className="text-center py-12">
                    <MessageSquare className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <p className="text-muted-foreground">Los posts son privados</p>
                  </div>
                ) : loadingPosts ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
                  </div>
                ) : !userPostsData || userPostsData.content.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <p className="text-muted-foreground">No publicaste nada todavía</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/comunidad")}>
                      Ir a Comunidad
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {userPostsData.content.map((post) => (
                        <ExpandCard key={post.id} post={post} />
                      ))}
                    </div>
                    {userPostsData.totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                          Página {postsPage + 1} de {userPostsData.totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" disabled={postsPage === 0} onClick={() => setPostsPage((p) => p - 1)}>
                            Anterior
                          </Button>
                          <Button variant="outline" size="sm" disabled={userPostsData.last} onClick={() => setPostsPage((p) => p + 1)}>
                            Siguiente
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              {/* ── Actividad Tab ── */}
              <TabsContent value="actividad" className="mt-4">
                {!isOwnProfile ? (
                  <div className="text-center py-12">
                    <Activity className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <p className="text-muted-foreground">La actividad es privada</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Stats */}
                    <Card>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-4 border rounded-lg text-center">
                            <p className="text-3xl font-bold text-primary">{activityStats.totalPlantas}</p>
                            <p className="text-sm text-muted-foreground mt-1">Plantas Totales</p>
                          </div>
                          <div className="p-4 border rounded-lg text-center">
                            <p className="text-3xl font-bold text-primary">{activityStats.plantasFloración}</p>
                            <p className="text-sm text-muted-foreground mt-1">En Floración</p>
                          </div>
                          <div className="p-4 border rounded-lg text-center">
                            <p className="text-3xl font-bold text-primary">{activityStats.totalEventos}</p>
                            <p className="text-sm text-muted-foreground mt-1">Eventos Totales</p>
                          </div>
                          <div className="p-4 border rounded-lg text-center">
                            <p className="text-3xl font-bold text-primary">{activityStats.eventosRecientes}</p>
                            <p className="text-sm text-muted-foreground mt-1">Eventos (7 días)</p>
                          </div>
                        </div>
                        <div className="text-center mt-4">
                          <Button variant="outline" onClick={() => navigate("/bitacora")}>
                            <Calendar className="w-4 h-4 mr-2" />
                            Ver Bitácora Completa
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Tareas Programadas */}
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 text-text-primary font-semibold">
                            <Clock className="w-5 h-5 text-accent-green" />
                            Tareas Programadas
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTareasOpen(true)}
                            className="text-accent-green border-accent-green/30 hover:bg-accent-green/10"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Nueva tarea
                          </Button>
                        </div>

                        {tareas.length === 0 ? (
                          <div className="text-center py-8 text-text-secondary text-sm">
                            <Clock className="mx-auto mb-2 w-8 h-8 opacity-30" />
                            No tenés tareas programadas
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {tareas.map((t) => (
                              <div
                                key={t.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border ${
                                  t.activa ? 'border-accent-green/20 bg-accent-green/5' : 'border-border/30 bg-background-base opacity-60'
                                }`}
                              >
                                <button
                                  onClick={() => t.id && toggleTareaMutation.mutate(t.id)}
                                  className="shrink-0"
                                >
                                  {t.activa
                                    ? <ToggleRight className="w-6 h-6 text-accent-green" />
                                    : <ToggleLeft className="w-6 h-6 text-text-secondary" />
                                  }
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-text-primary font-medium truncate">{t.titulo}</p>
                                  <p className="text-xs text-text-secondary">
                                    {t.recurrencia !== 'NINGUNA' ? `${t.recurrencia.charAt(0) + t.recurrencia.slice(1).toLowerCase()} · ` : ''}
                                    {new Date(t.fechaProgramada).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    {t.salaAsociadaNombre && <span className="ml-2 text-accent-green/60">· {t.salaAsociadaNombre}</span>}
                                    {t.plantaAsociadaNombre && <span className="ml-2 text-accent-green/60">· 🌱 {t.plantaAsociadaNombre}</span>}
                                  </p>
                                </div>
                                <button
                                  onClick={() => t.id && deleteTareaMutation.mutate(t.id)}
                                  className="shrink-0 p-1 hover:bg-red-500/10 rounded text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </main>
        </div>

        {/* Edit Profile Dialog */}
        <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} />

        {/* Zona Grid Modal */}
        {selectedPublicZonaId !== null && selectedPublicSalaId !== null && (() => {
          const selectedZona = selectedPublicZonas.find((z) => z.id === selectedPublicZonaId);
          const selectedSalaNombre = publicSalas.find((s) => s.id === selectedPublicSalaId)?.nombre ?? "";
          if (!selectedZona) return null;
          return (
            <ZonaGridModal
              zona={selectedZona}
              plantas={publicByZona(selectedPublicZonaId)}
              open={selectedPublicZonaId !== null}
              onClose={() => setSelectedPublicZonaId(null)}
              salaId={selectedPublicSalaId}
              salaNombre={selectedSalaNombre}
              zonas={selectedPublicZonas}
              allPlantasByZona={publicByZona}
            />
          );
        })()}

        {/* Sala Info Modal — US-8: key forces remount on sala change */}
        {menuSala && (
          <FormularioSalaInfo key={`info-${menuSala.id}`} open={infoOpen} onOpenChange={setInfoOpen} sala={menuSala} />
        )}

        {/* Sala Zonas Modal — US-8: key forces remount on sala change */}
        {menuSala && (
          <FormularioSalaZonas key={`zonas-${menuSala.id}`} open={zonasOpen} onOpenChange={setZonasOpen} sala={menuSala} />
        )}

        {/* Delete Sala AlertDialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar Sala</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro que querés eliminar <strong>{menuSala?.nombre}</strong>? Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-3 py-2">
              <div className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium">Eliminar plantas</p>
                  <p className="text-xs text-muted-foreground">
                    Si está activado, se eliminan las plantas de esta sala.
                  </p>
                </div>
                <Switch checked={deletePlants} onCheckedChange={setDeletePlants} />
              </div>
              <p className="text-xs text-muted-foreground">
                Las zonas se eliminan automáticamente. Los eventos compartidos con otras plantas se conservan.
              </p>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? "Eliminando..." : "Eliminar Sala"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Confirm Visibility Modal */}
        <ConfirmVisibilityModal
          open={publicConfirmOpen}
          onOpenChange={setPublicConfirmOpen}
          salaName={publicSalas.find((s) => s.id === pendingPublicSalaId)?.nombre ?? ""}
          makingPublic={pendingMakingPublic}
          onConfirm={(propagate, pin) => {
            if (pendingPublicSalaId !== null) {
              toggleSalaPublic.mutate({ salaId: pendingPublicSalaId, propagateVisibility: propagate });
              if (pin) {
                pinMutation.mutate(pendingPublicSalaId);
              }
              setPendingPublicSalaId(null);
            }
          }}
        />

        {/* Colaboradores Dialog */}
        {menuSalaId && (
          <ColaboradoresManager
            salaId={menuSalaId}
            salaNombre={publicSalas.find((s) => s.id === menuSalaId)?.nombre ?? ""}
            salaUserId={publicSalas.find((s) => s.id === menuSalaId)?.userId ?? 0}
            open={colabOpen}
            onOpenChange={setColabOpen}
          />
        )}

        {/* Tarea Programada Form */}
        {tareasOpen && (
          <TareaProgramadaForm onClose={() => setTareasOpen(false)} />
        )}
      </div>
    </SidebarProvider>
  );
}

// ── PublicSalaSection ─────────────────────────────────────────
// Displays a sala header + its plants with lazy loading via IntersectionObserver

interface PublicSalaSectionProps {
  sala: SalaDto;
  plantas: PlantaDto[];
  isOwnProfile: boolean;
  selectedPublicSalaId: number | null;
  selectedPublicZonas: { id: number; posicionX: number; posicionY: number; nombre: string }[];
  onToggleSelect: (salaId: number) => void;
  onMenuInfo: () => void;
  onMenuZonas: () => void;
  onMenuDelete: () => void;
  onTogglePublic: (makePublic: boolean) => void;
  onColaboradores: () => void;
  onZonaClick: (zonaId: number) => void;
}

function SalaPlantsSection({ plantas }: { plantas: PlantaDto[] }) {
  const [visibleCount, setVisibleCount] = useState(6);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || visibleCount >= plantas.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < plantas.length) {
          setVisibleCount((prev) => Math.min(prev + 6, plantas.length));
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, plantas.length]);

  if (plantas.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No hay plantas públicas en esta sala</p>;
  }

  const visiblePlantas = plantas.slice(0, visibleCount);

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">
        Plantas ({plantas.length})
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {visiblePlantas.map((plant) => (
          <PlantCard
            key={plant.id}
            id={plant.id.toString()}
            etiqueta={plant.nombre}
            genetica={plant.cepaDto?.geneticaParental || "Desconocida"}
            stage={plant.etapa}
            health={0}
            fechaCreacion={plant.fechaCreacion}
            tipoAmbiente={plant.sala?.tipoAmbiente as "INTERIOR" | "EXTERIOR" | undefined}
            favoriteCount={plant.favoriteCount}
            userId={plant.userId}
          />
        ))}
      </div>

      {/* Lazy loading sentinel */}
      {visibleCount < plantas.length && (
        <div ref={sentinelRef} className="h-12 flex items-center justify-center mt-4">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {visibleCount >= plantas.length && plantas.length > 6 && (
        <p className="text-xs text-center text-muted-foreground mt-3">
          {plantas.length} plantas en total
        </p>
      )}
    </div>
  );
}
