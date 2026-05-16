import { AlertTriangle } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlantaDto } from "@/interfaces/Planta";

interface BatchConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    actionName: string;
    actionIcon?: React.ReactNode;
    plants: PlantaDto[];
    onConfirm: () => void;
    isLoading?: boolean;
}

export const BatchConfirmDialog = ({
    open,
    onOpenChange,
    actionName,
    actionIcon,
    plants,
    onConfirm,
    isLoading = false,
}: BatchConfirmDialogProps) => {
    const plantCount = plants.length;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        Confirmar Operación Masiva
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3">
                            <p>
                                ¿Estás seguro de aplicar <strong className="text-primary">{actionName}</strong> a{" "}
                                <strong>{plantCount} planta{plantCount !== 1 ? "s" : ""}</strong>?
                            </p>

                            {/* Scrollable list of affected plants */}
                            <ScrollArea className="h-32 rounded-md border bg-muted/30 p-2">
                                <ul className="space-y-1">
                                    {plants.map((plant) => (
                                        <li
                                            key={plant.id}
                                            className="flex items-center gap-2 text-sm text-foreground"
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            {plant.nombre}
                                        </li>
                                    ))}
                                </ul>
                            </ScrollArea>

                            <p className="text-xs text-muted-foreground">
                                Esta acción se aplicará a todas las plantas listadas.
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="bg-primary hover:bg-primary/90"
                    >
                        {actionIcon}
                        {isLoading ? "Aplicando..." : `Aplicar a ${plantCount}`}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
