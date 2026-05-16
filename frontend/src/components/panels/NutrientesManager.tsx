import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Trash2, Droplets, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NutrienteDto } from "@/interfaces/Planta";

export const NutrientesManager = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [mode, setMode] = useState<'create' | 'edit'>('create');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ titulo: "", descripcion: "" });

    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: nutrientes = [], isLoading } = useQuery<NutrienteDto[]>({
        queryKey: ['nutrientes_catalog'],
        queryFn: apiService.getNutrientes,
    });

    const createMutation = useMutation({
        mutationFn: apiService.createNutriente,
        onSuccess: () => {
            toast({ title: "Producto Registrado", description: "El nutriente se agregó al catálogo." });
            queryClient.invalidateQueries({ queryKey: ['nutrientes_catalog'] });
            closeDialog();
        },
        onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message })
    });

    const updateMutation = useMutation({
        mutationFn: (data: { titulo: string, descripcion: string }) =>
            apiService.updateNutriente(editingId!, data),
        onSuccess: () => {
            toast({ title: "Producto Actualizado", description: "El nutriente se actualizó correctamente." });
            queryClient.invalidateQueries({ queryKey: ['nutrientes_catalog'] });
            closeDialog();
        },
        onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message })
    });

    const deleteMutation = useMutation({
        mutationFn: apiService.deleteNutriente,
        onSuccess: () => {
            toast({ title: "Producto Eliminado", description: "El nutriente ha sido borrado." });
            queryClient.invalidateQueries({ queryKey: ['nutrientes_catalog'] });
        },
        onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message })
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'create') {
            createMutation.mutate(formData);
        } else {
            updateMutation.mutate(formData);
        }
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setMode('create');
        setEditingId(null);
        setFormData({ titulo: "", descripcion: "" });
    };

    const handleEdit = (nutriente: NutrienteDto) => {
        setMode('edit');
        setEditingId(nutriente.id);
        setFormData({ titulo: nutriente.titulo, descripcion: nutriente.descripcion });
        setIsDialogOpen(true);
    };

    if (isLoading) return <div className="text-center py-4"><Loader2 className="animate-spin inline mr-2" /> Cargando catálogo...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Catálogo de Nutrientes</h3>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => { setMode('create'); setFormData({ titulo: "", descripcion: "" }); }}>
                            <Plus className="w-4 h-4 mr-2" /> Nuevo Producto
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{mode === 'create' ? 'Registrar Producto' : 'Editar Producto'}</DialogTitle>
                            <DialogDescription>
                                {mode === 'create' ? 'Agrega un nuevo nutriente o fertilizante a tu catálogo.' : 'Modifica los datos del producto.'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Nombre del Producto</label>
                                <Input
                                    value={formData.titulo}
                                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                    placeholder="Ej: Top Veg, Melaza..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Descripción / Marca</label>
                                <Input
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    placeholder="Ej: Fertilizante de crecimiento"
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                                {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                                {mode === 'create' ? 'Guardar en Catálogo' : 'Actualizar Producto'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead className="text-center">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {nutrientes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                    No hay productos registrados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            nutrientes.map((nutriente) => (
                                <TableRow key={nutriente.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <Droplets className="w-4 h-4 text-emerald-500" />
                                        {nutriente.titulo}
                                    </TableCell>
                                    <TableCell>{nutriente.descripcion}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(nutriente)}
                                            >
                                                <Pencil className="w-4 h-4 mr-1" />
                                                Editar
                                            </Button>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <Trash2 className="w-4 h-4 mr-1 text-destructive" />
                                                        Eliminar
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>
                                                            ¿Eliminar {nutriente.titulo}?
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Esta acción no se puede deshacer. Se eliminará permanentemente este producto del catálogo.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => deleteMutation.mutate(nutriente.id)}
                                                            className="bg-destructive hover:bg-destructive/90"
                                                        >
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
        </div>
    );
};
