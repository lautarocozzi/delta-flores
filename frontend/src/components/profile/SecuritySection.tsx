import { useState, useEffect } from "react";
import { useSessions } from "@/hooks/useSessions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Monitor, Smartphone, Globe, Loader2, Shield } from "lucide-react";
import type { DeviceSessionGroup } from "@/interfaces/Planta";

function getDeviceIcon(os: string) {
    const lower = os.toLowerCase();
    if (lower.includes("iphone") || lower.includes("android") || lower.includes("ios")) {
        return Smartphone;
    }
    return Monitor;
}

function formatRelativeTime(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "ahora mismo";
    if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `hace ${Math.floor(seconds / 86400)}d`;
    return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

function SessionSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </div>
                    <Skeleton className="h-8 w-20" />
                </div>
            ))}
        </div>
    );
}

function DeviceEntry({
    device,
    onRevoke,
    isRevoking,
}: {
    device: DeviceSessionGroup;
    onRevoke: (deviceKey: string) => void;
    isRevoking: boolean;
}) {
    const DeviceIcon = getDeviceIcon(device.os);
    const ariaLabel = `Cerrar sesión en ${device.browser} ${device.os}`;

    return (
        <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-3 min-w-0">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                            {device.browser} en {device.os}
                        </span>
                        {device.sessionCount > 1 && (
                            <Badge variant="outline" className="flex-shrink-0 text-xs">
                                {device.sessionCount} sesiones
                            </Badge>
                        )}
                        {device.isCurrent ? (
                            <Badge variant="default" className="flex-shrink-0 bg-green-600 hover:bg-green-600">
                                Activa
                            </Badge>
                        ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {device.ipAddress || "IP desconocida"} · {formatRelativeTime(device.lastActive)}
                    </p>
                </div>
            </div>
            {!device.isCurrent && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0 text-destructive hover:text-destructive"
                    onClick={() => onRevoke(device.deviceKey)}
                    disabled={isRevoking}
                    aria-label={ariaLabel}
                >
                    {isRevoking ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        "Cerrar"
                    )}
                </Button>
            )}
        </div>
    );
}

export function SecuritySection() {
    const { devices, isLoading, error, revokeDevice, isRevoking, revokeAllDevices, isRevokingAll } = useSessions();
    const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);
    const [revokingKey, setRevokingKey] = useState<string | null>(null);

    // Reset revokingKey when mutation settles
    useEffect(() => {
        if (!isRevoking) setRevokingKey(null);
    }, [isRevoking]);

    const otherDevices = devices.filter((d) => !d.isCurrent);
    const hasOtherDevices = otherDevices.length > 0;

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <h3 className="text-sm font-semibold">Sesiones Activas</h3>
                </div>
                <SessionSkeleton />
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <h3 className="text-sm font-semibold">Sesiones Activas</h3>
                </div>
                <p className="text-sm text-destructive py-2">
                    Error al cargar las sesiones. Intentá recargar la página.
                </p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                >
                    Reintentar
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <h3 className="text-sm font-semibold">Sesiones Activas</h3>
            </div>

            {devices.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                    No hay sesiones activas.
                </p>
            ) : (
                <>
                    <div className="space-y-2">
                        {devices.map((device) => (
                            <DeviceEntry
                                key={device.deviceKey}
                                device={device}
                                onRevoke={(deviceKey) => {
                                    setRevokingKey(deviceKey);
                                    revokeDevice(deviceKey);
                                }}
                                isRevoking={isRevoking && revokingKey === device.deviceKey}
                            />
                        ))}
                    </div>

                    {hasOtherDevices && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-destructive hover:text-destructive"
                            disabled={isRevokingAll || !hasOtherDevices}
                            onClick={() => setShowRevokeAllDialog(true)}
                        >
                            {isRevokingAll ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Globe className="h-4 w-4 mr-2" />
                            )}
                            Cerrar todas las demás sesiones
                        </Button>
                    )}
                </>
            )}

            <AlertDialog open={showRevokeAllDialog} onOpenChange={setShowRevokeAllDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Cerrar todas las demás sesiones?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esto cerrará tu sesión en todos los demás dispositivos. Solo se mantendrá
                            abierta la sesión en este dispositivo.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                revokeAllDevices();
                                setShowRevokeAllDialog(false);
                            }}
                        >
                            Cerrar sesiones
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
