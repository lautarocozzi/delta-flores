import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormFocused, setIsFormFocused] = useState(false);
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const usernameTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const checkUsernameDebounced = useCallback(async (value: string) => {
    if (!value || value.length < 3) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    try {
      const available = await apiService.checkUsername(value);
      setUsernameStatus(available ? "available" : "taken");
    } catch {
      setUsernameStatus("idle");
    }
  }, []);

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    clearTimeout(usernameTimeoutRef.current);
    usernameTimeoutRef.current = setTimeout(() => checkUsernameDebounced(value), 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (usernameStatus === "taken") {
        throw new Error("El nombre de usuario ya está en uso");
      }
      // Force synchronous check if debounce hasn't fired yet
      if (usernameStatus !== "available") {
        const available = await apiService.checkUsername(username);
        if (!available) {
          throw new Error("El nombre de usuario ya está en uso o no es válido");
        }
      }
      await apiService.registerUser(email, password, username);
      toast({
        title: "¡Cuenta creada!",
        description: "Ahora podés iniciar sesión con tus credenciales.",
      });
      navigate("/login");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocurrió un error inesperado.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => clearTimeout(usernameTimeoutRef.current);
  }, []);

  const backgroundPosition = isMobile ? "center center" : "right center";

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: "url('/LOGO_LANDING_3.png')",
        backgroundSize: "cover",
        backgroundPosition: backgroundPosition,
        backgroundRepeat: "no-repeat",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
        onFocus={() => setIsFormFocused(true)}
        onBlur={() => setIsFormFocused(false)}
        onMouseEnter={() => setIsFormFocused(true)}
        onMouseLeave={() => setIsFormFocused(false)}
      >
        <Card
          className={`
            backdrop-blur-md shadow-2xl rounded-2xl 
            border-2 border-primary/50 
            transition-all duration-300 ease-in-out
            ${isFormFocused
              ? 'bg-background/70 backdrop-blur-lg border-primary/80'
              : 'bg-background/30 backdrop-blur-sm'
            }
          `}
        >
          <CardContent className="p-8 flex flex-col items-center">
            <h1 className="text-3xl font-bold text-primary mb-2 text-center">
              Flores Delta
            </h1>
            <p className="text-muted-foreground text-center mb-6">
              Creá tu cuenta para empezar a cultivar.
            </p>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <div>
                <Label htmlFor="username" className="text-sm text-muted-foreground">
                  Nombre de usuario
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className="bg-background/30 text-foreground border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/50 [&:-webkit-autofill]:bg-background [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_hsl(215,28%,9%)] [&:-webkit-autofill]:[-webkit-text-fill-color:hsl(210,20%,98%)]"
                  placeholder="tu_usuario"
                  required
                  autoComplete="off"
                />
                {usernameStatus === "checking" && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Verificando...
                  </p>
                )}
                {usernameStatus === "available" && (
                  <p className="text-xs text-green-500 mt-1">Nombre de usuario disponible</p>
                )}
                {usernameStatus === "taken" && (
                  <p className="text-xs text-destructive mt-1">Este nombre de usuario ya está en uso</p>
                )}
              </div>
              <div>
                <Label htmlFor="email" className="text-sm text-muted-foreground">
                  Correo electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/30 text-foreground border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/50 [&:-webkit-autofill]:bg-background [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_hsl(215,28%,9%)] [&:-webkit-autofill]:[-webkit-text-fill-color:hsl(210,20%,98%)]"
                  placeholder="tuemail@ejemplo.com"
                  required
                  autoComplete="off"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-sm text-muted-foreground">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background/30 text-foreground border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/50 pr-10 [&:-webkit-autofill]:bg-background [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_hsl(215,28%,9%)] [&:-webkit-autofill]:[-webkit-text-fill-color:hsl(210,20%,98%)]"
                    placeholder="••••••••"
                    required
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="pt-4 flex flex-col space-y-3">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold w-full shadow-lg shadow-primary/25"
                >
                  {isLoading ? "Cargando..." : "Crear Cuenta"}
                </Button>
              </div>
            </form>

            <p className="text-sm text-muted-foreground mt-6 text-center">
              ¿Ya tenés una cuenta?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Iniciar sesión
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
