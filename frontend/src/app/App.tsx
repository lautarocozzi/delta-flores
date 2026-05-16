import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DirectAccessMenu } from "@/components/shared/DirectAccessMenu";
import { AppRoutes } from "./routes";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        {/* Global DirectAccessMenu - works on all pages */}
        <DirectAccessMenu />

        <AppRoutes />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
