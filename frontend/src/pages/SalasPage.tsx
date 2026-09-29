import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layouts/AppSidebar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { SalaDto, UserDto, ZonaDto } from "@/schemas/DTOSchemas";
import { Building2, Users, Pencil, Trash2, MapPin, Search, Sun, Thermometer, Droplets } from "lucide-react";
import { FormularioSala } from "@/components/forms/FormularioSala";
import { ColaboradoresManager } from "@/components/panels/ColaboradoresManager";
import { SalaMetricsChart } from "@/components/sala/SalaMetricsChart";
import { UnifiedSalaView } from "@/components/sala/UnifiedSalaView";
import { ZonaGridModal } from "@/components/sala/ZonaGridModal";
import { SalaCardMenu } from "@/components/sala/SalaCardMenu";
import { FormularioSalaInfo } from "@/components/sala/FormularioSalaInfo";
import { FormularioSalaZonas } from "@/components/sala/FormularioSalaZonas";
import { usePlantas } from "@/hooks/usePlantas";

export default function SalasPage() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const carouselRef = useRef<HTMLDivElement>(null);

  const [selectedSalaId, setSelectedSalaId] = useState<number | null>(() => {
    const params = new URLSearchParams(location.search);
    const initialSalaId = params.get("sala");
    if (initialSalaId) return Number(initialSalaId);
    const stored = localStorage.getItem("salas-selected-sala-id");
    return stored ? Number(stored) : null;
  });
  const [selectedZonaId, setSelectedZonaId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Edit dialog
  const [editSalaOpen, setEditSalaOpen] = useState(false);
  const [editSala, setEditSala] = useState<SalaDto | null>(null);

  // Delete dialog
  const [deleteSala, setDeleteSala] = useState<SalaDto | null>(null);
  const [deletePlants, setDeletePlants] = useState(false);

  // Collaborators dialog
  const [colabSala, setColabSala] = useState<SalaDto | null>(null);

  // Info / Zonas modals from menu
  const [infoSala, setInfoSala] = useState<SalaDto | null>(null);
  const [zonasSala, setZonasSala] = useState<SalaDto | null>(null);

  // User search popover
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  const isAdmin = user?.role === "ROLE_ADMIN" || user?.role === "ROLE_SUPER_ADMIN";

  // Persist selected sala
  useEffect(() => {
    if (selectedSalaId !== null) {
      localStorage.setItem("salas-selected-sala-id", selectedSalaId.toString());
    } else {
      localStorage.removeItem("salas-selected-sala-id");
    }
  }, [selectedSalaId]);

  // ─── Queries ──────────────────────────────────────────
  const { data: salas = [], isLoading } = useQuery<SalaDto[]>({
    queryKey: ["salas"],
    queryFn: apiService.getSalas,
    staleTime: 1000 * 60 * 5,
  });

  const { data: users = [] } = useQuery<UserDto[]>({
    queryKey: ["users"],
    queryFn: apiService.getUsers,
    enabled: isAdmin,
    staleTime: 1000 * 60 * 5,
  });

  // US-22: Memoize filtered users to avoid duplicate .filter() calls
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery) return users;
    const q = userSearchQuery.toLowerCase();
    return users.filter((u) =>
      u.nombre?.toLowerCase().includes(q) ||
      u.apellido?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q)
    );
  }, [users, userSearchQuery]);

  const { data: zonas = [] } = useQuery<ZonaDto[]>({
    queryKey: ["zonas", "sala", selectedSalaId],
    queryFn: () => apiService.getZonasBySala(selectedSalaId!),
    enabled: selectedSalaId !== null,
    staleTime: 1000 * 60 * 5,
  });

  const { plantas: plantasBySala, byZona } = usePlantas(selectedSalaId);

  // ─── Derived ──────────────────────────────────────────
  const selectedSala = useMemo(
    () => salas.find((s) => s.id === selectedSalaId) ?? null,
    [salas, selectedSalaId],
  );

  const filteredSalas = useMemo(() => {
    if (isAdmin && selectedUserId !== null) {
      return salas.filter((s) => s.userId === selectedUserId);
    }
    return salas;
  }, [salas, isAdmin, selectedUserId]);

  // US-20: Memoize selectedUser lookup
  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) ?? null,
    [users, selectedUserId],
  );

  // US-25: Reset selectedSalaId if no longer in filtered list, and clear stale localStorage
  useEffect(() => {
    if (selectedSalaId !== null && !filteredSalas.some((s) => s.id === selectedSalaId)) {
      setSelectedSalaId(null);
      localStorage.removeItem("salas-selected-sala-id");
    }
  }, [filteredSalas, selectedSalaId]);

  // Auto-select sala from URL params (admin navigating from Dashboard)
  useEffect(() => {
    const salaIdFromUrl = new URLSearchParams(location.search).get("sala");
    if (isAdmin && salaIdFromUrl && salas.length > 0) {
      const sala = salas.find((s) => s.id === Number(salaIdFromUrl));
      if (sala && sala.userId !== selectedUserId) {
        setSelectedUserId(sala.userId);
      }
    }
  }, [salas, location.search, isAdmin, selectedUserId]);

  // ─── Mutations ────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deleteSala) return;
      await apiService.deleteSala(deleteSala.id, deletePlants);
    },
    onSuccess: () => {
      toast({
        title: "Sala Eliminada",
        description: deletePlants
          ? "La sala y todas sus plantas han sido eliminadas."
          : "La sala ha sido eliminada. Las plantas quedaron sin sala.",
      });
      queryClient.invalidateQueries({ queryKey: ["salas"] });
      queryClient.invalidateQueries({ queryKey: ["plantas"] });
      if (selectedSalaId === deleteSala?.id) {
        setSelectedSalaId(null);
      }
      setDeleteSala(null);
      setDeletePlants(false);
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Error", description: err.message || "No se pudo eliminar la sala." });
    },
  });

  // ─── Handlers ─────────────────────────────────────────
  const handleSelectSala = useCallback((salaId: number) => {
    setSelectedSalaId((prev) => (prev === salaId ? null : salaId));
    setSelectedZonaId(null);
  }, []);

  const handleEditSala = useCallback(() => {
    if (selectedSala) {
      setEditSala(selectedSala);
      setEditSalaOpen(true);
    }
  }, [selectedSala]);

  return (
    <SidebarProvider>
      <div
        className="min-h-screen w-full flex relative"
        style={{
          backgroundImage: "url(/images/background.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-background/60 pointer-events-none" style={{ position: "fixed" }} />
        <AppSidebar />

        <div className="flex-1 overflow-auto relative z-10">
          {/* ─── Header ─────────────────────────────── */}
          <header className="bg-card/70 backdrop-blur-sm border-b border-border px-4 md:px-6 py-3 sticky top-0 z-40 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
              </div>

              <div className="flex items-center gap-2">
                {/* Admin User Search */}
                {isAdmin && (
                  <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-8 px-3 gap-2 text-sm">
                        <Users size={14} />
                        <span className="max-w-[100px] truncate">
                          {selectedUserId
                            ? selectedUser
                                ? `${selectedUser.nombre} ${selectedUser.apellido}`
                                : "Usuario"
                            : "Todos"}
                        </span>
                        <Search size={14} className="text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2" align="end">
                      <Input
                        placeholder="Buscar usuario..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="h-8 text-sm mb-2"
                        autoFocus
                      />
                      <div className="max-h-48 overflow-y-auto space-y-0.5">
                        <button
                          className={`w-full text-left px-2 py-1.5 rounded text-sm hover:bg-accent transition-colors ${
                            selectedUserId === null ? "bg-accent font-medium" : ""
                          }`}
                          onClick={() => {
                            setSelectedUserId(null);
                            setSelectedSalaId(null);
                            setUserSearchOpen(false);
                            setUserSearchQuery("");
                          }}
                        >
                          Todos
                        </button>
                        {filteredUsers.map((u) => (
                            <button
                              key={u.id}
                              className={`w-full text-left px-2 py-1.5 rounded text-sm hover:bg-accent transition-colors ${
                                selectedUserId === u.id ? "bg-accent font-medium" : ""
                              }`}
                              onClick={() => {
                                setSelectedUserId(u.id);
                                setSelectedSalaId(null);
                                setUserSearchOpen(false);
                                setUserSearchQuery("");
                              }}
                            >
                              {u.nombre} {u.apellido}
                            </button>
                          ))}
                        {filteredUsers.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-2">
                            Sin resultados
                          </p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}

                {/* Action buttons when sala selected */}
                {selectedSala && (
                  <>
                    <Button variant="ghost" size="sm" className="h-8 px-2" onClick={handleEditSala} title="Editar sala">
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setColabSala(selectedSala)} title="Colaboradores">
                      <Users size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-destructive hover:text-destructive"
                      onClick={() => { setDeleteSala(selectedSala); setDeletePlants(false); }}
                      title="Eliminar sala"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* ─── Carousel de Salas ──────────────────── */}
          <div className="bg-card/50 backdrop-blur-sm border-b border-border">
            {isLoading ? (
              <div className="flex gap-3 p-4 overflow-hidden">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="w-16 h-16 rounded-full shrink-0" />
                ))}
              </div>
            ) : filteredSalas.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No hay salas disponibles
              </div>
            ) : (
              <div
                ref={carouselRef}
                className="flex gap-3 p-4 overflow-x-auto scrollbar-hide"
                style={{ scrollBehavior: "smooth" }}
              >
                {filteredSalas.map((sala) => {
                  const isSelected = sala.id === selectedSalaId;
                  return (
                    <button
                      key={sala.id}
                      onClick={() => handleSelectSala(sala.id)}
                      className="flex flex-col items-center gap-1 shrink-0 group"
                    >
                      <div className="relative">
                        <div
                          className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-all ${
                            isSelected
                              ? "border-primary ring-2 ring-primary/30 scale-110"
                              : "border-border hover:border-primary/50 hover:scale-105"
                          }`}
                        >
                          {sala.imagenUrl ? (
                            <img
                              src={sala.imagenUrl}
                              alt={sala.nombre}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-primary/40" />
                            </div>
                          )}
                        </div>
                        {/* ⋮ Menu on selected */}
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 z-10">
                            <SalaCardMenu
                              isOwner={true}
                              onInfo={() => setInfoSala(sala)}
                              onZonas={() => setZonasSala(sala)}
                              onDelete={() => { setDeleteSala(sala); setDeletePlants(false); }}
                            />
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <span className="text-xs font-medium text-primary truncate max-w-[80px]">
                          {sala.nombre}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ─── Main content ─────────────────────────── */}
          <main className="p-4 md:p-6">
            {selectedSalaId === null ? (
              <div className="text-center py-16">
                <Building2 className="mx-auto mb-4 text-muted-foreground" size={48} />
                <h3 className="text-lg font-semibold mb-2">Elegí una sala</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Seleccioná una sala del carousel para ver sus zonas y plantas.
                </p>
              </div>
            ) : zonas.length === 0 ? (
              <div className="text-center py-16">
                <MapPin className="mx-auto mb-4 text-muted-foreground" size={48} />
                <h3 className="text-lg font-semibold mb-2">Sin zonas</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Esta sala no tiene zonas configuradas. Editá la sala para agregar zonas.
                </p>
              </div>
            ) : (
              <>
                {/* ── Sala info: name, owner, description ── */}
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-lg font-bold">{selectedSala?.nombre}</h2>
                    {selectedSala?.ownerUsername && (
                      <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                        @{selectedSala.ownerUsername}
                      </span>
                    )}
                  </div>
                  {selectedSala?.descripcion && (
                    <p className="text-sm text-muted-foreground">{selectedSala.descripcion}</p>
                  )}
                </div>

                {/* ── Metrics row: stats left, chart right ── */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                  {/* Current sala stats — icons only */}
                  <div className="md:col-span-2 bg-card/50 backdrop-blur-sm rounded-xl border border-border p-4 flex items-center justify-around">
                    <div className="flex flex-col items-center gap-1">
                      <Sun size={18} className="text-primary" />
                      <span className="text-sm font-medium">{selectedSala?.horasLuz || "-"}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Thermometer size={18} className="text-orange-500" />
                      <span className="text-sm font-medium">{selectedSala?.temperaturaAmbiente != null ? `${selectedSala.temperaturaAmbiente}°` : "-"}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Droplets size={18} className="text-blue-500" />
                      <span className="text-sm font-medium">{selectedSala?.humedad != null ? `${selectedSala.humedad}%` : "-"}</span>
                    </div>
                  </div>
                  {/* 6-month metrics chart */}
                  <div className="md:col-span-3">
                    <SalaMetricsChart salaId={selectedSalaId} months={6} />
                  </div>
                </div>

                <UnifiedSalaView
                  zonas={zonas}
                  salaId={selectedSalaId}
                  onZonaClick={(zonaId) => setSelectedZonaId(zonaId)}
                />
              </>
            )}
          </main>
        </div>

        {/* ─── Edit Sala Dialog ────────────────────────── */}
        <Dialog open={editSalaOpen} onOpenChange={setEditSalaOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Sala</DialogTitle>
              <DialogDescription>
                Modificá los datos de la sala, su imagen y configuración de zonas.
              </DialogDescription>
            </DialogHeader>
            {editSala && (
              <FormularioSala
                mode="edit"
                initialData={editSala}
                onSuccess={() => { setEditSalaOpen(false); setEditSala(null); }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* ─── Delete Sala AlertDialog ──────────────────── */}
        <AlertDialog open={deleteSala !== null} onOpenChange={(open) => { if (!open) { setDeleteSala(null); setDeletePlants(false); } }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar sala "{deleteSala?.nombre}"</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-3 py-2">
              <div className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium">Eliminar plantas</p>
                  <p className="text-xs text-muted-foreground">
                    {deletePlants
                      ? "Las plantas serán eliminadas permanentemente."
                      : "Las plantas quedarán sin sala asignada."}
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
                {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ─── Colaboradores Dialog — US-15: only render when sala selected ── */}
        {colabSala && (
          <ColaboradoresManager
            salaId={colabSala.id}
            salaNombre={colabSala.nombre ?? ""}
            salaUserId={colabSala.userId}
            open={colabSala !== null}
            onOpenChange={(open) => { if (!open) setColabSala(null); }}
          />
        )}

        {/* ─── Zona Grid Modal — US-16: guard non-null ── */}
        {selectedZonaId !== null && selectedSalaId !== null && (() => {
          const selectedZona = zonas.find(z => z.id === selectedZonaId);
          if (!selectedZona) return null;
          return (
            <ZonaGridModal
              zona={selectedZona}
              plantas={byZona(selectedZonaId)}
              open={selectedZonaId !== null}
              onClose={() => setSelectedZonaId(null)}
              salaId={selectedSalaId}
              salaNombre={selectedSala?.nombre ?? ""}
              zonas={zonas}
              allPlantasByZona={byZona}
            />
          );
        })()}

        {/* ─── Info Modal — US-8: key for remount ── */}
        {infoSala && (
          <FormularioSalaInfo key={`info-${infoSala.id}`} open={infoSala !== null} onOpenChange={(open) => { if (!open) setInfoSala(null); }} sala={infoSala} />
        )}

        {/* ─── Zonas Modal — US-8: key for remount ── */}
        {zonasSala && (
          <FormularioSalaZonas key={`zonas-${zonasSala.id}`} open={zonasSala !== null} onOpenChange={(open) => { if (!open) setZonasSala(null); }} sala={zonasSala} />
        )}
      </div>
    </SidebarProvider>
  );
}
