import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layouts/AppSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { SecuritySection } from "@/components/profile/SecuritySection";

export default function DevicesPage() {
    const navigate = useNavigate();
    const { user } = useAuthContext();

    const roleLabel = user?.role === 'ROLE_ADMIN' ? 'Admin' : user?.role === 'ROLE_SUPER_ADMIN' ? 'Super Admin' : 'Grower';

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
                                <h1 className="text-2xl font-bold">Dispositivos</h1>
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
                            <CardContent className="p-6">
                                <SecuritySection />
                            </CardContent>
                        </Card>
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
