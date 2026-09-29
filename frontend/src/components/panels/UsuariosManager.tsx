import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Loader2, Users, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserDto {
    id: number;
    email: string;
    nombre: string;
    apellido: string;
    rol: string;
}

export const UsuariosManager = () => {
    const { data: users = [], isLoading, isError } = useQuery<UserDto[]>({
        queryKey: ['users_list'],
        queryFn: apiService.getUsers,
        retry: 1
    });

    if (isLoading) return <div className="text-center py-4"><Loader2 className="animate-spin inline mr-2" /> Cargando usuarios...</div>;

    // Fallback if endpoint fails (e.g., 403 Forbidden for non-admins)
    if (isError) return (
        <div className="text-center py-8 text-destructive">
            <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No tienes permisos para ver el listado de usuarios.</p>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Gestión de Usuarios</h3>
                {/* Add User button could go here if register logic allows admin creation */}
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Usuario</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead className="text-right">ID</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    No hay usuarios encontrados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <Users className="w-4 h-4 text-blue-500" />
                                        {user.nombre || 'Sin Nombre'} {user.apellido}
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.rol === 'ADMIN' ? 'default' : 'secondary'}>
                                            {user.rol}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{user.id}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};
