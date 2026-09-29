import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import type { DeviceSessionGroup } from "@/interfaces/Planta";

const SESSIONS_QUERY_KEY = ['auth', 'sessions'];

export const useSessions = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const {
        data: devices = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: SESSIONS_QUERY_KEY,
        queryFn: apiService.getSessions,
        staleTime: 1000 * 60, // 1 minute
        retry: false, // Validation errors are deterministic — no point retrying
    });

    // Optimistic revoke single device's sessions
    const revokeDeviceMutation = useMutation({
        mutationFn: apiService.revokeDeviceSessions,
        onMutate: async (deviceKey) => {
            await queryClient.cancelQueries({ queryKey: SESSIONS_QUERY_KEY });
            const previousDevices = queryClient.getQueryData<DeviceSessionGroup[]>(SESSIONS_QUERY_KEY);
            queryClient.setQueryData<DeviceSessionGroup[]>(SESSIONS_QUERY_KEY, (old) =>
                old?.filter((d) => d.deviceKey !== deviceKey || d.isCurrent) ?? []
            );
            return { previousDevices };
        },
        onSuccess: () => {
            toast({ title: "Dispositivo desconectado" });
        },
        onError: (_error, _deviceKey, context) => {
            if (context?.previousDevices) {
                queryClient.setQueryData(SESSIONS_QUERY_KEY, context.previousDevices);
            }
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo desconectar el dispositivo. Intentá de nuevo.",
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
        },
    });

    // Optimistic revoke all other devices
    const revokeAllDevicesMutation = useMutation({
        mutationFn: apiService.revokeAllSessions,
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: SESSIONS_QUERY_KEY });
            const previousDevices = queryClient.getQueryData<DeviceSessionGroup[]>(SESSIONS_QUERY_KEY);
            queryClient.setQueryData<DeviceSessionGroup[]>(SESSIONS_QUERY_KEY, (old) =>
                old?.filter((d) => d.isCurrent) ?? []
            );
            return { previousDevices };
        },
        onSuccess: () => {
            toast({ title: "Todas las demás sesiones fueron cerradas" });
        },
        onError: (_error, _variables, context) => {
            if (context?.previousDevices) {
                queryClient.setQueryData(SESSIONS_QUERY_KEY, context.previousDevices);
            }
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudieron cerrar las sesiones. Intentá de nuevo.",
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
        },
    });

    return {
        devices,
        isLoading,
        error,
        revokeDevice: revokeDeviceMutation.mutate,
        isRevoking: revokeDeviceMutation.isPending,
        revokeAllDevices: revokeAllDevicesMutation.mutate,
        isRevokingAll: revokeAllDevicesMutation.isPending,
    };
};
