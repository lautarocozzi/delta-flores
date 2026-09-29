import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import PlantDetailPage from "@/pages/PlantDetailPage";
import EditPlantPage from "@/pages/EditPlantPage";
import SalaDetailPage from "@/pages/SalaDetailPage";
import MainLogPage from "@/pages/MainLogPage";
import ProfilePage from "@/pages/ProfilePage";
import SecurityPage from "@/pages/SecurityPage";
import PasswordPage from "@/pages/PasswordPage";
import DevicesPage from "@/pages/DevicesPage";
import FavoritosPage from "@/pages/FavoritosPage";
import ComunidadPage from "@/pages/ComunidadPage";
import PostDetailPage from "@/pages/PostDetailPage";
import AdminComunidadPage from "@/pages/AdminComunidadPage";
import AdminUsuariosPage from "@/pages/AdminUsuariosPage";
import NotFound from "@/pages/NotFound";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/comunidad" element={<ComunidadPage />} />
        <Route path="/comunidad/:postId" element={<PostDetailPage />} />
        <Route path="/admin/comunidad" element={<AdminComunidadPage />} />
        <Route path="/admin/usuarios" element={<AdminUsuariosPage />} />
        <Route path="/plant/:id" element={<PlantDetailPage />} />
        <Route path="/plantas/:id/editar" element={<EditPlantPage />} />
        <Route path="/bitacora" element={<MainLogPage />} />
        <Route path="/bitacora-maestra" element={<Navigate to="/bitacora" replace />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/security" element={<SecurityPage />} />
        <Route path="/profile/security/password" element={<PasswordPage />} />
        <Route path="/profile/security/devices" element={<DevicesPage />} />
        <Route path="/favoritos" element={<FavoritosPage />} />
        <Route path="/:username" element={<ProfilePage />} />
        <Route path="/:username/sala/:salaId" element={<SalaDetailPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
