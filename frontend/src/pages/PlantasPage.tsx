import { useState, useCallback, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layouts/AppSidebar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PlantCard } from "@/components/dashboard/PlantCard";
import { PlantListView } from "@/components/plants/PlantListView";
import { SalaFilterPanel } from "@/components/plants/SalaFilterPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { useAuthContext } from "@/contexts/AuthContext";
import type { PlantaDto, SalaDto, UserDto, ZonaDto } from "@/interfaces/Planta";
import { LayoutGrid, List, Grid3x3, Leaf, Users, Pencil, MapPin } from "lucide-react";
import { FormularioSala } from "@/components/forms/FormularioSala";
import { ColaboradoresManager } from "@/components/panels/ColaboradoresManager";
import { SalaMetricsChart } from "@/components/sala/SalaMetricsChart";
import { UnifiedSalaView } from "@/components/sala/UnifiedSalaView";
import { ZonaGridModal } from "@/components/sala/ZonaGridModal";
import { usePlantas } from "@/hooks/usePlantas";

type ViewMode = "cards" | "list" | "visual";

function getStoredViewMode(): ViewMode {
  const stored = localStorage.getItem("plantas-view-mode");
  if (stored === "cards" || stored === "list" || stored === "visual") return stored;
  return "cards";
}

export default function PlantasPage() {
  const { user } = useAuthContext();

  // Read initial values from URL search params (e.g. from Dashboard sala click)
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialSalaId = params.get("sala");
  const initialView = params.get("view");

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (initialView === "cards" || initialView === "list" || initialView === "visual") return initialView;
    return getStoredViewMode();
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEtapa, setFilterEtapa] = useState("Todas");
  const [selectedSalas, setSelectedSalas] = useState<string[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedSalaId, setSelectedSalaId] = useState<number | null>(() => {
    return initialSalaId ? Number(initialSalaId) : null;
  });
  const [selectedZonaId, setSelectedZonaId] = useState<number | null>(null);

  // Sala editing dialog
  const [editSalaOpen, setEditSalaOpen] = useState(false);
  const [editSala, setEditSala] = useState<SalaDto | null>(null);

  // Sala collaborator dialog
  const [colabSala, setColabSala] = useState<SalaDto | null>(null);

  const isAdmin = user?.role === "ROLE_ADMIN" || user?.role === "ROLE_SUPER_ADMIN";

  const handleViewModeChange = useCallback((value: string) => {
    if (value === "cards" || value === "list" || value === "visual") {
      setViewMode(value);
      localStorage.setItem("plantas-view-mode", value);
    }
  }, []);

  // ─── Queries ──────────────────────────────────────────
  const plantasQueryKey = selectedUserId ? ["plantas", "user", selectedUserId] : ["plantas"];
  const plantasQueryFn = selectedUserId
    ? () => apiService.getPlantasByUserId(selectedUserId)
    : apiService.getPlantas;

  const { data: plantas = [], isLoading } = useQuery<PlantaDto[]>({
    queryKey: plantasQueryKey,
    queryFn: plantasQueryFn,
    staleTime: 1000 * 60 * 5,
  });

  const { data: salas = [] } = useQuery<SalaDto[]>({
    queryKey: ["salas"],
    queryFn: apiService.getSalas,
    staleTime: 1000 * 60 * 5,
  });

  // Auto-select the owner user when navigating from Dashboard with a specific sala (admin only)
  useEffect(() => {
    if (isAdmin && initialSalaId && salas.length > 0) {
      const sala = salas.find((s) => s.id === Number(initialSalaId));
      if (sala && sala.userId !== selectedUserId) {
        setSelectedUserId(sala.userId);
      }
    }
  }, [salas, initialSalaId, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: users = [] } = useQuery<UserDto[]>({
    queryKey: ["users"],
    queryFn: apiService.getUsers,
    enabled: isAdmin,
    staleTime: 1000 * 60 * 5,
  });

  // Zones for visual view when a specific sala is selected
  const { data: zonas = [] } = useQuery<ZonaDto[]>({
    queryKey: ["zonas", "sala", selectedSalaId],
    queryFn: () => apiService.getZonasBySala(selectedSalaId!),
    enabled: viewMode === "visual" && selectedSalaId !== null,
    staleTime: 1000 * 60 * 5,
  });

  // Plants by sala for visual view grid — uses usePlantas hook
  const { plantas: plantasBySala, byZona } = usePlantas(
    viewMode === "visual" ? selectedSalaId : null,
  );

  // ─── Derived ──────────────────────────────────────────
  const selectedSala = useMemo(
    () => salas.find((s) => s.id === selectedSalaId) ?? null,
    [salas, selectedSalaId],
  );

  // Filter salas by selected user (for admin user picker)
  const filteredSalas = useMemo(() => {
    if (isAdmin && selectedUserId !== null) {
      return salas.filter((s) => s.userId === selectedUserId);
    }
    return salas;
  }, [salas, isAdmin, selectedUserId]);

  // Reset selectedSalaId if it's no longer in filtered salas (only when salas are loaded)
  useMemo(() => {
    if (filteredSalas.length > 0 && selectedSalaId !== null && !filteredSalas.some((s) => s.id === selectedSalaId)) {
      setSelectedSalaId(null);
    }
  }, [filteredSalas, selectedSalaId]);

  // ─── Filtering ────────────────────────────────────────
  const filteredPlantas = useMemo(() => {
    return plantas.filter((plant) => {
      const matchesSearch =
        plant.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plant.cepaDto?.geneticaParental?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesEtapa = filterEtapa === "Todas" || plant.etapa === filterEtapa;
      const matchesSala =
        selectedSalas.length === 0 || selectedSalas.includes(plant.sala?.nombre || "");
      const matchesSelectedSala =
        selectedSalaId === null || plant.salaId === selectedSalaId;
      return matchesSearch && matchesEtapa && matchesSala && matchesSelectedSala;
    });
  }, [plantas, searchQuery, filterEtapa, selectedSalas, selectedSalaId]);

  // Group by sala for cards view
  const groupedBySala = useMemo(() => {
    return filteredPlantas.reduce((acc, plant) => {
      const salaName = plant.sala?.nombre || "Sin Sala";
      if (!acc[salaName]) acc[salaName] = [];
      acc[salaName].push(plant);
      return acc;
    }, {} as Record<string, PlantaDto[]>);
  }, [filteredPlantas]);

  // ─── Helpers ──────────────────────────────────────────
  const handleEditSala = useCallback(() => {
    if (selectedSala) {
      setEditSala(selectedSala);
      setEditSalaOpen(true);
    }
  }, [selectedSala]);

  const handleEditSalaSuccess = useCallback(() => {
    setEditSalaOpen(false);
    setEditSala(null);
  }, []);

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
        {/* Background overlay */}
        <div className="absolute inset-0 bg-background/60 pointer-events-none" style={{ position: "fixed" }} />

        <AppSidebar />
        <div className="flex-1 overflow-auto relative z-10">
          {/* ─── Header ─────────────────────────────── */}
          <header className="bg-card/70 backdrop-blur-sm border-b border-border px-4 md:px-6 py-3 sticky top-0 z-40 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Leaf className="text-primary" size={24} />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">Plantas</h1>
                    <p className="text-xs text-muted-foreground">
                      {filteredPlantas.length} plantas
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <ToggleGroup
                  type="single"
                  value={viewMode}
                  onValueChange={handleViewModeChange}
                  size="sm"
                  variant="outline"
                >
                  <ToggleGroupItem value="cards" aria-label="Vista de tarjetas">
                    <LayoutGrid size={16} />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="list" aria-label="Vista de lista">
                    <List size={16} />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="visual" aria-label="Vista visual">
                    <Grid3x3 size={16} />
                  </ToggleGroupItem>
                </ToggleGroup>

                {/* Floating Filter Trigger */}
                <SalaFilterPanel
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  filterEtapa={filterEtapa}
                  onEtapaChange={setFilterEtapa}
                  selectedSalas={selectedSalas}
                  onSalasChange={setSelectedSalas}
                  salas={salas}
                />
              </div>
            </div>
          </header>

          {/* ─── Sala Selector Bar ─────────────────────── */}
          <div className="bg-card/50 backdrop-blur-sm border-b border-border px-4 md:px-6 py-2 flex items-center gap-3 flex-wrap">
            {/* Admin User Selector — before sala selector */}
            {isAdmin && (
              <div className="flex items-center gap-2">
                <Users size={16} className="text-muted-foreground shrink-0" />
                <Select
                  value={selectedUserId?.toString() || "all"}
                  onValueChange={(val) => {
                    setSelectedUserId(val !== "all" ? Number(val) : null);
                    setSelectedSalaId(null); // reset sala when user changes
                  }}
                >
                  <SelectTrigger className="w-[160px] h-8 text-sm">
                    <SelectValue placeholder="Usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Mis plantas</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.nombre} {u.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Sala Selector */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <MapPin size={16} className="text-muted-foreground shrink-0" />
              <Select
                value={selectedSalaId?.toString() || "all"}
                onValueChange={(val) => {
                  const newSalaId = val !== "all" ? Number(val) : null;
                  setSelectedSalaId(newSalaId);
                  setSelectedSalas([]); // clear multi-select when single sala selected

                  // Auto-select the owner user when an admin picks a specific sala
                  if (isAdmin && newSalaId !== null) {
                    const sala = salas.find((s) => s.id === newSalaId);
                    if (sala && sala.userId !== selectedUserId) {
                      setSelectedUserId(sala.userId);
                    }
                  } else if (isAdmin && newSalaId === null) {
                    // Reset user to "all" when deselecting sala
                    setSelectedUserId(null);
                  }
                }}
              >
                <SelectTrigger className="w-full max-w-[280px] h-8 text-sm">
                  <SelectValue placeholder="🌱 Todas las salas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🌱 Todas las salas</SelectItem>
                  {filteredSalas.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Edit Sala — only when a specific sala is selected */}
              {selectedSala && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={handleEditSala}
                    title="Editar sala"
                  >
                    <Pencil size={14} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setColabSala(selectedSala)}
                    title="Colaboradores"
                  >
                    <Users size={14} />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* ─── Main content ─────────────────────────── */}
          <main className="p-4 md:p-6">
            {/* Loading skeletons */}
            {isLoading && viewMode !== "list" && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-48 rounded-lg" />
                ))}
              </div>
            )}
            {isLoading && viewMode === "list" && (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            )}

            {/* ── Cards View ──────────────────────────── */}
            {!isLoading && viewMode === "cards" && (
              <>
                {filteredPlantas.length === 0 ? (
                  <div className="text-center py-12">
                    <Leaf className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <p className="text-muted-foreground">No se encontraron plantas</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedBySala).map(([salaName, plants]) => (
                      <div key={salaName}>
                        <h2 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                          <Leaf size={14} />
                          {salaName}
                          <span className="text-muted-foreground font-normal">({plants.length})</span>
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {plants.map((plant) => (
                            <PlantCard
                              key={plant.id}
                              id={plant.id.toString()}
                              etiqueta={plant.nombre}
                              genetica={plant.cepaDto?.geneticaParental || "Desconocida"}
                              stage={plant.etapa}
                              health={0}
                              fechaCreacion={plant.fechaCreacion}
                              tipoAmbiente={plant.sala?.tipoAmbiente as "INTERIOR" | "EXTERIOR" | undefined}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── List View ───────────────────────────── */}
            {!isLoading && viewMode === "list" && (
              <PlantListView plantas={filteredPlantas} />
            )}

            {/* ── Visual View ─────────────────────────── */}
            {!isLoading && viewMode === "visual" && (
              <>
                {selectedSalaId === null ? (
                  <div className="text-center py-12">
                    <Grid3x3 className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <h3 className="text-lg font-semibold mb-2">Vista Visual</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Seleccioná una sala específica para ver las zonas y plantas en el grid visual.
                    </p>
                  </div>
                ) : zonas.length === 0 ? (
                  <div className="text-center py-12">
                    <Grid3x3 className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <h3 className="text-lg font-semibold mb-2">Sin zonas</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Esta sala no tiene zonas configuradas. Editá la sala para agregar zonas.
                    </p>
                  </div>
                ) : (
                  <>
                    <SalaMetricsChart salaId={selectedSalaId} months={6} />
                    <UnifiedSalaView
                      zonas={zonas}
                      salaId={selectedSalaId}
                      onZonaClick={(zonaId) => setSelectedZonaId(zonaId)}
                    />
                  </>
                )}
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
                onSuccess={handleEditSalaSuccess}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* ─── Colaboradores Dialog ──────────────────────── */}
        <ColaboradoresManager
          salaId={colabSala?.id ?? 0}
          salaNombre={colabSala?.nombre ?? ""}
          salaUserId={colabSala?.userId ?? 0}
          open={colabSala !== null}
          onOpenChange={(open) => {
            if (!open) setColabSala(null);
          }}
        />

        {/* ─── Zona Grid Modal ─────────────────────────── */}
        {selectedZonaId !== null && selectedSalaId !== null && (
          <ZonaGridModal
            zona={zonas.find(z => z.id === selectedZonaId)!}
            plantas={byZona(selectedZonaId)}
            open={selectedZonaId !== null}
            onClose={() => setSelectedZonaId(null)}
            salaId={selectedSalaId}
            salaNombre={selectedSala?.nombre ?? ""}
            zonas={zonas}
            allPlantasByZona={byZona}
          />
        )}
      </div>
    </SidebarProvider>
  );
}

