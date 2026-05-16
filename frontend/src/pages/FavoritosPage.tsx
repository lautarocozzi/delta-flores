import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layouts/AppSidebar";
import { PlantCard } from "@/components/dashboard/PlantCard";
import { Heart, Leaf } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { PlantaDto } from "@/interfaces/Planta";
import { Skeleton } from "@/components/ui/skeleton";

export default function FavoritosPage() {
    const { data: favoritePlantas = [], isLoading, isError } = useQuery<PlantaDto[]>({
        queryKey: ['favoritePlantas'],
        queryFn: apiService.getFavoritePlantas,
        staleTime: 1000 * 60 * 5,
    });

    // Ordenar alfabéticamente
    const sortedFavorites = [...favoritePlantas].sort((a, b) =>
        a.nombre.localeCompare(b.nombre)
    );

    return (
        <SidebarProvider>
            <div
                className="min-h-screen w-full flex relative"
                style={{
                    backgroundImage: 'url(/images/background.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed',
                }}
            >
                {/* Global background overlay */}
                <div className="absolute inset-0 bg-background/60 pointer-events-none" style={{ position: 'fixed' }} />

                <AppSidebar />
                <div className="flex-1 overflow-auto relative z-10">
                    <header className="bg-card/70 backdrop-blur-sm border-b border-border px-6 py-4 sticky top-0 z-40 shadow-sm">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger />
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg">
                                    <Heart className="text-primary" size={24} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold">Plantas Favoritas</h1>
                                    <p className="text-muted-foreground text-sm">
                                        Tus plantas marcadas como favoritas
                                    </p>
                                </div>
                            </div>
                        </div>
                    </header>

                    <main className="p-6">
                        {isLoading && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map((i) => (
                                    <Skeleton key={i} className="h-64 rounded-lg" />
                                ))}
                            </div>
                        )}

                        {isError && (
                            <div className="text-center py-12">
                                <p className="text-destructive">Error al cargar favoritos</p>
                            </div>
                        )}

                        {!isLoading && !isError && sortedFavorites.length === 0 && (
                            <div className="text-center py-16 bg-card/80 backdrop-blur-sm rounded-lg border border-primary/20">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="bg-primary/20 p-6 rounded-full">
                                        <Heart size={48} className="text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">
                                            No tienes plantas favoritas aún
                                        </h3>
                                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                            Marca tus plantas favoritas desde el dashboard o la vista de detalle
                                            para verlas aquí rápidamente.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isLoading && !isError && sortedFavorites.length > 0 && (
                            <>
                                <div className="mb-4 flex items-center gap-2">
                                    <Leaf className="text-primary" size={20} />
                                    <span className="text-sm text-muted-foreground">
                                        {sortedFavorites.length} {sortedFavorites.length === 1 ? 'planta favorita' : 'plantas favoritas'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {sortedFavorites.map((plant) => (
                                        <PlantCard
                                            key={plant.id}
                                            id={plant.id.toString()}
                                            etiqueta={plant.nombre}
                                            genetica={plant.cepaDto?.geneticaParental || 'Desconocida'}
                                            stage={plant.etapa}
                                            health={0}
                                            fechaCreacion={plant.fechaCreacion}
                                            tipoAmbiente={plant.sala?.tipoAmbiente as 'INTERIOR' | 'EXTERIOR' | undefined}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
