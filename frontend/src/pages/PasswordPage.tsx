import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layouts/AppSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import api from "@/utils/api";

export default function PasswordPage() {
    const navigate = useNavigate();
    const { user, dispatch } = useAuthContext();
    const { toast } = useToast();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [passwordError, setPasswordError] = useState("");

    const roleLabel = user?.role === 'ROLE_ADMIN' ? 'Admin' : user?.role === 'ROLE_SUPER_ADMIN' ? 'Super Admin' : 'Grower';

    // Refresh user profile on mount to avoid stale data after back navigation
    useEffect(() => {
        api.get("/api/auth/me")
            .then((res) => {
                if (res.data) {
                    dispatch({ type: "SET_USER", payload: res.data });
                }
            })
            .catch(() => {
                // Silent — auth context will handle 401
            });
    }, [dispatch]);

    const passwordMutation = useMutation({
        mutationFn: async () => {
            if (!user?.id) throw new Error("No hay sesión activa. Iniciá sesión nuevamente.");
            await apiService.updatePassword(user.id, currentPassword, newPassword);
        },
        onSuccess: () => {
            toast({ title: "Contraseña actualizada" });
            setCurrentPassword("");
            setNewPassword("");
        },
        onError: (error: unknown) => {
            const message = error instanceof Error ? error.message : "No se pudo cambiar la contraseña.";
            toast({ variant: "destructive", title: "Error", description: message });
        },
    });

    const handlePasswordChange = () => {
        setPasswordError("");
        if (!currentPassword || !newPassword) return;
        if (newPassword.length < 8) {
            setPasswordError("La contraseña debe tener al menos 8 caracteres.");
            return;
        }
        passwordMutation.mutate();
    };

    return (
        <SidebarProvider>
            <div className="min-h-screen w-full flex bg-background">
                <AppSidebar />
                <div className="flex-1 overflow-auto">
                    <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-40 shadow-sm">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger />
                            <div>
                                <Badge variant="secondary" className="text-xs mb-1">{roleLabel}</Badge>
                                <h1 className="text-2xl font-bold">Contraseña</h1>
                            </div>
                        </div>
                    </header>

                    <main className="p-6 max-w-4xl mx-auto space-y-6">
                        <Button
                            variant="ghost"
                            className="gap-2"
                            onClick={() => navigate("/profile/security")}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Volver a Seguridad
                        </Button>

                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <div>
                                    <Label htmlFor="currentPassword">Contraseña actual</Label>
                                    <div className="relative mt-1">
                                        <Input
                                            id="currentPassword"
                                            type={showCurrentPassword ? "text" : "password"}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="pr-10"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full px-3"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        >
                                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="newPassword">Nueva contraseña</Label>
                                    <div className="relative mt-1">
                                        <Input
                                            id="newPassword"
                                            type={showNewPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => {
                                                setNewPassword(e.target.value);
                                                setPasswordError("");
                                            }}
                                            minLength={8}
                                            className="pr-10"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full px-3"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Mínimo 8 caracteres</p>
                                </div>
                                {passwordError && (
                                    <p className="text-sm text-destructive">{passwordError}</p>
                                )}
                                <Button
                                    onClick={handlePasswordChange}
                                    disabled={passwordMutation.isPending || !currentPassword || !newPassword}
                                    className="w-full"
                                >
                                    {passwordMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Actualizar Contraseña
                                </Button>
                            </CardContent>
                        </Card>
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
