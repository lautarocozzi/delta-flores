import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
import { useAuthContext } from "@/contexts/AuthContext";
import { useDirectAccessMenuStore } from "@/stores/useDirectAccessMenuStore";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isFormFocused, setIsFormFocused] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { openMenu } = useDirectAccessMenuStore();
  const { login } = useAuthContext();
  const isMobile = useIsMobile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        await apiService.registerUser(email, password);
        toast({
          title: "¡Cuenta creada!",
          description: "Ahora puedes iniciar sesión con tus credenciales.",
        });
        setIsSignUp(false);
      } else {
        await login({ email, password });

        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión correctamente.",
        });

        navigate("/dashboard");
        // Menu no longer opens automatically - user can click + when ready
      }
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

  // Responsive background position: mobile shows centered, desktop shows right
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
              Cultiva mejor, produce mejor.
            </p>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
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
                  {isLoading ? "Cargando..." : "Ingresar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
