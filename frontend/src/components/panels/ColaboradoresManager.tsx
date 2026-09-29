import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { SalaColaboradorDto } from "@/interfaces/Planta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, UserMinus, UserPlus, Users, Eye, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";

interface ColaboradoresManagerProps {
    salaId: number;
    salaNombre: string;
    salaUserId: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ColaboradoresManager = ({
    salaId,
    salaNombre,
    salaUserId,
    open,
    onOpenChange,
}: ColaboradoresManagerProps) => {
    const { user } = useAuthContext();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [email, setEmail] = useState("");
    const [selectedTipo, setSelectedTipo] = useState<"EDITOR" | "LECTURA">("EDITOR");

    const isOwner = user?.id === salaUserId;
    const isSuperAdmin = user?.role === "ROLE_SUPER_ADMIN";
    const canManage = isOwner || isSuperAdmin;

    const { data: colaboradores = [], isLoading } = useQuery<SalaColaboradorDto[]>({
        queryKey: ["colaboradores", salaId],
        queryFn: () => apiService.getColaboradores(salaId),
        enabled: open,
    });

    const addMutation = useMutation({
        mutationFn: () => apiService.agregarColaborador(salaId, email.trim(), selectedTipo),
        onSuccess: (data) => {
            const tipoLabel = data.tipoColaborador === "LECTURA" ? "solo lectura" : "editor";
            toast({
                title: "Colaborador agregado",
                description: `${data.userNombre} ${data.userApellido} ahora es colaborador (${tipoLabel}) de "${salaNombre}".`,
            });
            queryClient.invalidateQueries({ queryKey: ["colaboradores", salaId] });
            setEmail("");
            setSelectedTipo("EDITOR");
        },
        onError: (err: any) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: err.message || "No se pudo agregar el colaborador.",
            });
        },
    });

    const removeMutation = useMutation({
        mutationFn: (userId: number) => apiService.removerColaborador(salaId, userId),
        onSuccess: () => {
            toast({
                title: "Colaborador removido",
                description: "El colaborador fue removido de la sala.",
            });
            queryClient.invalidateQueries({ queryKey: ["colaboradores", salaId] });
        },
        onError: (err: any) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: err.message || "No se pudo remover el colaborador.",
            });
        },
    });

    const tipoIcon = (tipo: string) => {
        if (tipo === "LECTURA") return <Eye className="w-3.5 h-3.5 text-blue-500" />;
        return <Pencil className="w-3.5 h-3.5 text-amber-500" />;
    };

    const tipoLabel = (tipo: string) => {
        return tipo === "LECTURA" ? "Solo lectura" : "Editor";
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users size={18} />
                        Colaboradores — {salaNombre}
                    </DialogTitle>
                    <DialogDescription>
                        Los colaboradores <strong>editores</strong> pueden ver, crear y editar todo el contenido de la sala.
                        Los de <strong>solo lectura</strong> solo pueden ver el contenido.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* ─── Current collaborators ─────── */}
                        <div>
                            <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                                Colaboradores actuales ({colaboradores.length})
                            </h4>
                            {colaboradores.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                                    No hay colaboradores en esta sala.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {colaboradores.map((col) => (
                                        <div
                                            key={col.id}
                                            className="flex items-center justify-between rounded-md border px-3 py-2"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">
                                                        {col.userNombre} {col.userApellido}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        @{col.userUsername}
                                                    </span>
                                                </div>
                                                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted">
                                                    {tipoIcon(col.tipoColaborador)}
                                                    {tipoLabel(col.tipoColaborador)}
                                                </span>
                                            </div>
                                            {canManage && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeMutation.mutate(col.userId)}
                                                    disabled={removeMutation.isPending}
                                                    title="Remover colaborador"
                                                >
                                                    <UserMinus className="w-4 h-4 text-destructive" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ─── Add collaborator ─────────── */}
                        {canManage && (
                            <div className="border-t pt-4">
                                <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                                    Agregar colaborador
                                </h4>
                                <div className="flex gap-2 mb-2">
                                    <Input
                                        type="email"
                                        placeholder="Email del usuario..."
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Select
                                        value={selectedTipo}
                                        onValueChange={(v) => setSelectedTipo(v as "EDITOR" | "LECTURA")}
                                    >
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="EDITOR">
                                                <div className="flex items-center gap-1">
                                                    <Pencil className="w-3.5 h-3.5 text-amber-500" />
                                                    Editor
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="LECTURA">
                                                <div className="flex items-center gap-1">
                                                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                                                    Solo lectura
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    onClick={() => addMutation.mutate()}
                                    disabled={!email.trim() || addMutation.isPending}
                                    className="w-full"
                                >
                                    {addMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <UserPlus className="w-4 h-4 mr-2" />
                                    )}
                                    Agregar colaborador
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
