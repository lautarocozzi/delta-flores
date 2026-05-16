import { Navigate, Outlet } from "react-router-dom";
import { useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { MobileBottomNav } from "@/components/layouts/MobileBottomNav";
import { SplashScreen } from "@/components/shared/SplashScreen";

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuthContext();

  // ─── Splash state (must be before early returns due to hook rules) ───
  const [showSplash, setShowSplash] = useState(() => {
    const hasSeenSplash = sessionStorage.getItem('floresdelta_splash_shown');
    return !hasSeenSplash;
  });

  // ─── Loading: don't redirect yet, we're checking session ───
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // ─── Not authenticated → login ───
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ─── Splash (once per session) ───
  const handleSplashComplete = () => {
    sessionStorage.setItem('floresdelta_splash_shown', 'true');
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <>
      <div className="pb-16 md:pb-0">
        <Outlet />
      </div>
      <MobileBottomNav />
    </>
  );
}
