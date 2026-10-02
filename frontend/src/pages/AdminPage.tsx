import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { Loader2, Search, ShieldAlert, Users } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layouts/AppSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiService } from "@/services/api";
import { useAuthContext } from "@/contexts/AuthContext";
import type { UserDto } from "@/schemas/DTOSchemas";

const roleLabel: Record<string, string> = {
  ROLE_SUPER_ADMIN: "Super Admin",
  ROLE_ADMIN: "Admin",
  ROLE_GROWER: "Grower",
};

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-AR");
}

function matchesQuery(user: UserDto, query: string) {
  if (!query) return true;
  const haystack = [user.nombre, user.apellido, user.username, user.email, user.rol]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export default function AdminPage() {
  const { user } = useAuthContext();
  const [query, setQuery] = useState("");
  const isAdmin = user?.role === "ROLE_ADMIN" || user?.role === "ROLE_SUPER_ADMIN";

  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ["admin-users"],
    queryFn: apiService.getUsers,
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const normalized = query.trim().toLowerCase();
  const filtered = users.filter((item) => matchesQuery(item, normalized));
  const adminCount = users.filter(
    (item) => item.rol === "ROLE_ADMIN" || item.rol === "ROLE_SUPER_ADMIN",
  ).length;

  return (
    <SidebarProvider>
      <div
        className="min-h-screen w-full flex relative"
        style={{
          backgroundImage: "url(/images/background.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-background/60 pointer-events-none" style={{ position: "fixed" }} />
        <AppSidebar />
        <div className="flex-1 overflow-auto relative z-10">
          <header className="bg-card/70 backdrop-blur-sm border-b border-border px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-40 shadow-lg">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold text-foreground flex items-center">
                <ShieldAlert className="mr-3 text-primary" />
                Panel Admin
              </h1>
            </div>
          </header>

          <main className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="bg-card/70 backdrop-blur-sm border-border">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Registrados</p>
                  <p className="text-2xl font-bold text-foreground">{users.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-card/70 backdrop-blur-sm border-border">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Admins</p>
                  <p className="text-2xl font-bold text-foreground">{adminCount}</p>
                </CardContent>
              </Card>
              <Card className="bg-card/70 backdrop-blur-sm border-border">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Growers</p>
                  <p className="text-2xl font-bold text-foreground">{users.length - adminCount}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card/70 backdrop-blur-sm border-border">
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Usuarios registrados
                  </h2>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Buscar nombre, usuario o email"
                      className="pl-9"
                    />
                  </div>
                </div>

                {isLoading ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Loader2 className="animate-spin inline mr-2" />
                    Cargando usuarios...
                  </div>
                ) : isError ? (
                  <div className="text-center py-10 text-destructive">
                    <ShieldAlert className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No se pudo cargar el listado de usuarios.</p>
                  </div>
                ) : (
                  <div className="border border-border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Rol</TableHead>
                          <TableHead className="text-right">Registro</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              No hay usuarios que coincidan.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filtered.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div className="font-medium text-foreground">
                                  {[item.nombre, item.apellido].filter(Boolean).join(" ") || "Sin nombre"}
                                </div>
                                <div className="text-sm text-muted-foreground">{item.username || "—"}</div>
                              </TableCell>
                              <TableCell>{item.email || "—"}</TableCell>
                              <TableCell>
                                <Badge variant={item.rol === "ROLE_GROWER" ? "secondary" : "default"}>
                                  {roleLabel[item.rol] || item.rol}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {item.fechaRegistro ? formatDate(item.fechaRegistro) : "—"}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
