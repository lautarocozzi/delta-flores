import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { CepaDto } from "@/interfaces/Planta";
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
import { Loader2, Plus, Pencil, Trash2, Flower2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FormularioCepa } from "@/components/forms/FormularioCepa";

export const GeneticasManager = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCepa, setEditingCepa] = useState<CepaDto | null>(null);

    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: cepas = [] } = useQuery<CepaDto[]>({
        queryKey: ['cepas'],
        queryFn: apiService.getCepas,
    });

    const deleteMutation = useMutation({
        mutationFn: apiService.deleteCepa,
        onSuccess: () => {
            toast({
                title: "Genética Eliminada",
                description: "La genética ha sido eliminada correctamente."
            });
            queryClient.invalidateQueries({ queryKey: ['cepas'] });
        },
        onError: (err: any) => toast({
            variant: "destructive",
            title: "Error",
            description: err.message
        })
    });

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Listado de Genéticas</h3>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) setEditingCepa(null);
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" /> Nueva Genética
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingCepa ? `Editar: ${editingCepa.geneticaParental}` : 'Crear Nueva Genética'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingCepa
                                    ? 'Modifica los datos de la genética'
                                    : 'Completa los datos para crear una nueva genética'}
                            </DialogDescription>
                        </DialogHeader>
                        <FormularioCepa
                            mode={editingCepa ? 'edit' : 'create'}
                            initialData={editingCepa || undefined}
                            onSuccess={() => {
                                setIsDialogOpen(false);
                                setEditingCepa(null);
                            }}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Genética</TableHead>
                            <TableHead>Dominancia</TableHead>
                            <TableHead>THC</TableHead>
                            <TableHead>CBD</TableHead>
                            <TableHead className="text-center">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cepas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No hay genéticas registradas.
                                </TableCell>
                            </TableRow>
                        ) : (
                            cepas.map((cepa) => (
                                <TableRow key={cepa.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <Flower2 className="w-4 h-4 text-purple-500" />
                                        {cepa.geneticaParental}
                                    </TableCell>
                                    <TableCell>{cepa.dominancia || '-'}</TableCell>
                                    <TableCell>{cepa.thc || '-'}</TableCell>
                                    <TableCell>{cepa.cbd || '-'}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setEditingCepa(cepa);
                                                    setIsDialogOpen(true);
                                                }}
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
                                                            ¿Eliminar {cepa.geneticaParental}?
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Esta acción no se puede deshacer. general permanentemente esta genética del sistema.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => deleteMutation.mutate(cepa.id)}
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
