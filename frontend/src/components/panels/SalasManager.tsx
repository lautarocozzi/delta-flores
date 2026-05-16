import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { SalaDto } from "@/interfaces/Planta";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Pencil, Trash2, MapPin, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FormularioSala } from "@/components/forms/FormularioSala";
import { ColaboradoresManager } from "@/components/panels/ColaboradoresManager";

export const SalasManager = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSala, setEditingSala] = useState<SalaDto | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [colaboradoresSala, setColaboradoresSala] = useState<SalaDto | null>(null);

    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: salas = [], isLoading } = useQuery<SalaDto[]>({
        queryKey: ['salas'],
        queryFn: apiService.getSalas,
    });

    const deleteMutation = useMutation({
        mutationFn: apiService.deleteSala,
        onSuccess: () => {
            toast({
                title: "Sala Eliminada",
                description: "La sala ha sido eliminada correctamente."
            });
            queryClient.invalidateQueries({ queryKey: ['salas'] });
            setDeleteConfirmId(null);
        },
        onError: (err: any) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: err.message || "No se pudo eliminar la sala."
            });
            setDeleteConfirmId(null);
        }
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Listado de Salas</h3>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) setEditingSala(null);
                }}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setEditingSala(null)}>
                            <Plus className="w-4 h-4 mr-2" /> Nueva Sala
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingSala ? `Editar: ${editingSala.nombre}` : 'Crear Nueva Sala'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingSala
                                    ? 'Modificá los datos de la sala, su imagen y configuración de zonas.'
                                    : 'Completa los datos para crear una nueva sala'}
                            </DialogDescription>
                        </DialogHeader>
                        <FormularioSala
                            mode={editingSala ? 'edit' : 'create'}
                            initialData={editingSala || undefined}
                            onSuccess={() => {
                                setIsDialogOpen(false);
                                setEditingSala(null);
                            }}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Horas de Luz</TableHead>
                            <TableHead>Humedad (%)</TableHead>
                            <TableHead>Temp (°C)</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {salas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No hay salas registradas. Crea una sala para comenzar.
                                </TableCell>
                            </TableRow>
                        ) : (
                            salas.map((sala) => (
                                <TableRow key={sala.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-green-500" />
                                        {sala.nombre}
                                    </TableCell>
                                    <TableCell>{sala.horasLuz || '-'}</TableCell>
                                    <TableCell>{sala.humedad !== null ? `${sala.humedad}%` : '-'}</TableCell>
                                    <TableCell>{sala.temperaturaAmbiente !== null ? `${sala.temperaturaAmbiente}°C` : '-'}</TableCell>
                                    <TableCell className="max-w-[200px] truncate">{sala.descripcion || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setEditingSala(sala);
                                                    setIsDialogOpen(true);
                                                }}
                                            >
                                                <Pencil className="w-4 h-4 mr-1" />
                                                Editar
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setColaboradoresSala(sala)}
                                            >
                                                <Users className="w-4 h-4 mr-1" />
                                                Colab.
                                            </Button>

                                            <AlertDialog
                                                open={deleteConfirmId === sala.id}
                                                onOpenChange={(open) => !open && setDeleteConfirmId(null)}
                                            >
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setDeleteConfirmId(sala.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-1 text-destructive" />
                                                        Eliminar
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>
                                                            ¿Eliminar {sala.nombre}?
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Esta acción no se puede deshacer. Se eliminará
                                                            permanentemente esta sala y todas las plantas asociadas.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => deleteMutation.mutate(sala.id)}
                                                            className="bg-destructive hover:bg-destructive/90"
                                                            disabled={deleteMutation.isPending}
                                                        >
                                                            {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                                            Eliminar
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* ─── Colaboradores Dialog ─────────────── */}
            <ColaboradoresManager
                salaId={colaboradoresSala?.id ?? 0}
                salaNombre={colaboradoresSala?.nombre ?? ""}
                salaUserId={colaboradoresSala?.userId ?? 0}
                open={colaboradoresSala !== null}
                onOpenChange={(open) => {
                    if (!open) setColaboradoresSala(null);
                }}
            />
        </div>
    );
};
