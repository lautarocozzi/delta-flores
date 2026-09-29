import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RegistroEventoForm } from "@/components/shared/RegistroEventoForm";
import { AppRoutes } from "./routes";
import { SalaThemeProvider } from "@/contexts/SalaThemeContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SalaThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />

          {/* Global RegistroEventoForm - works on all pages */}
          <RegistroEventoForm />

          <AppRoutes />
        </TooltipProvider>
      </SalaThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
