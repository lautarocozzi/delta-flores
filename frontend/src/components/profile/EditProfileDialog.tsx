import { useState, useRef, useCallback, useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Loader2, Camera } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { ImageCropper } from "./ImageCropper";

interface EditProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditProfileDialog({ open, onOpenChange }: EditProfileDialogProps) {
    const { user, dispatch } = useAuthContext();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const usernameTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

    const [username, setUsername] = useState(user?.username || "");
    const [nombre, setNombre] = useState(user?.nombre || "");
    const [apellido, setApellido] = useState(user?.apellido || "");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Cropper state
    const [showCropper, setShowCropper] = useState(false);
    const [cropperSrc, setCropperSrc] = useState<string | null>(null);

    // Username availability
    const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

    // Sync form state when dialog opens
    useEffect(() => {
        if (open) {
            if (!user?.id) {
                toast({ variant: "destructive", title: "Sesión no válida", description: "Iniciá sesión nuevamente." });
                onOpenChange(false);
                return;
            }
            clearTimeout(usernameTimeoutRef.current);
            setUsername(user?.username || "");
            setNombre(user?.nombre || "");
            setApellido(user?.apellido || "");
            setSelectedFile(null);
            setPreviewUrl(null);
            setShowCropper(false);
            setCropperSrc(null);
            setUsernameStatus("idle");
        }
    }, [open, user]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearTimeout(usernameTimeoutRef.current);
        };
    }, []);

    const checkUsernameDebounced = useCallback(async (value: string) => {
        if (!value || value === user?.username) {
            setUsernameStatus("idle");
            return;
        }
        if (value.length < 3) {
            setUsernameStatus("idle");
            return;
        }
        setUsernameStatus("checking");
        try {
            const available = await apiService.checkUsername(value);
            setUsernameStatus(available ? "available" : "taken");
        } catch {
            setUsernameStatus("idle");
        }
    }, [user?.username]);

    const handleUsernameChange = (value: string) => {
        setUsername(value);
        clearTimeout(usernameTimeoutRef.current);
        usernameTimeoutRef.current = setTimeout(() => checkUsernameDebounced(value), 400);
    };

    // Profile update mutation
    const profileMutation = useMutation({
        mutationFn: async () => {
            if (!user?.id) throw new Error("No hay sesión activa. Iniciá sesión nuevamente.");
            const updatedUser = await apiService.updateUserProfile(user.id, { username, nombre, apellido });
            let imageFailed = false;
            if (selectedFile) {
                try {
                    await apiService.uploadProfileImage(user.id, selectedFile);
                } catch {
                    imageFailed = true;
                }
            }
            return { updatedUser, imageFailed };
        },
        onSuccess: async ({ updatedUser, imageFailed }) => {
            if (imageFailed) {
                toast({ title: "Perfil actualizado", description: "La foto de perfil no se pudo subir. Intentá de nuevo." });
            } else {
                toast({ title: "Perfil actualizado" });
            }
            queryClient.invalidateQueries({ queryKey: ["plantas"] });
            try {
                const meResponse = await apiService.getMe();
                dispatch({ type: 'SET_USER', payload: { ...user, ...meResponse } });
            } catch {
                dispatch({ type: 'SET_USER', payload: { ...user, ...updatedUser } });
            }
            onOpenChange(false);
        },
        onError: (error: unknown) => {
            const message = error instanceof Error ? error.message : "No se pudo actualizar el perfil.";
            toast({ variant: "destructive", title: "Error", description: message });
        },
    });

    // File selected → open cropper
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast({ variant: "destructive", title: "Imagen muy grande", description: "Máximo 5MB." });
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            setCropperSrc(reader.result as string);
            setShowCropper(true);
        };
        reader.readAsDataURL(file);
        // Reset input so same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Cropper confirmed → store cropped file
    const handleCropDone = (file: File) => {
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setShowCropper(false);
        setCropperSrc(null);
    };

    // Cropper cancelled
    const handleCropCancel = () => {
        setShowCropper(false);
        setCropperSrc(null);
    };

    const handleSave = () => {
        if (usernameStatus === "taken") return;
        profileMutation.mutate();
    };

    const displayImage = previewUrl || user?.imagenUrl;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Perfil</DialogTitle>
                    <DialogDescription>
                        Actualizá tu información personal y foto de perfil.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Photo section */}
                    {showCropper && cropperSrc ? (
                        <div className="flex flex-col items-center gap-2">
                            <p className="text-sm text-muted-foreground">Acomodá tu foto de perfil</p>
                            <ImageCropper
                                imageSrc={cropperSrc}
                                onCrop={handleCropDone}
                                onCancel={handleCropCancel}
                                size={400}
                            />
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={displayImage || undefined} />
                                    <AvatarFallback>{nombre?.[0] || user?.username?.[0] || "U"}</AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-5 h-5 text-white" />
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                            </div>
                            <div className="flex-1 space-y-2">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Email</Label>
                                    <p className="text-sm">{user?.email}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <Separator />

                    {/* Profile Fields */}
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="username">Nombre de usuario</Label>
                            <Input
                                id="username"
                                value={username}
                                onChange={(e) => handleUsernameChange(e.target.value)}
                                className="mt-1"
                            />
                            {usernameStatus === "checking" && (
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Verificando...
                                </p>
                            )}
                            {usernameStatus === "available" && (
                                <p className="text-xs text-green-500 mt-1">Nombre de usuario disponible</p>
                            )}
                            {usernameStatus === "taken" && (
                                <p className="text-xs text-destructive mt-1">Este nombre de usuario ya está en uso</p>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="nombre">Nombre</Label>
                                <Input
                                    id="nombre"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="apellido">Apellido</Label>
                                <Input
                                    id="apellido"
                                    value={apellido}
                                    onChange={(e) => setApellido(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={profileMutation.isPending || usernameStatus === "taken" || showCropper}
                        className="w-full"
                    >
                        {profileMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Guardar Cambios
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
