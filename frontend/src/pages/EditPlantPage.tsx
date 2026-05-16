import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { PlantaDto } from '@/interfaces/Planta';
import { FormularioPlanta } from '@/components/forms/FormularioPlanta';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function EditPlantPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: planta, isLoading, isError } = useQuery<PlantaDto>({
        queryKey: ['planta', id],
        queryFn: () => apiService.getPlantaById(id!),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Cargando planta...</p>
            </div>
        );
    }

    if (isError || !planta) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-8">
                <p className="text-destructive mb-4">Error al cargar la planta</p>
                <Button onClick={() => navigate(-1)}>
                    <ArrowLeft className="mr-2" /> Volver
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-background p-4 sm:p-6 lg:p-8">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/plant/${id}`)}>
                        <ArrowLeft />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Editar Planta</h1>
                        <p className="text-muted-foreground">{planta.nombre}</p>
                    </div>
                </div>

                <FormularioPlanta
                    mode="edit"
                    initialData={planta}
                    onSuccess={() => navigate(`/plant/${id}`)}
                />
            </div>
        </div>
    );
}
