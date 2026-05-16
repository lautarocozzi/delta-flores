import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast"; // Importar useToast

const newCepaSchema = z.object({
  geneticaParental: z.string().min(1, "El nombre/genética es requerido"),
  abreviatura: z.string().min(1, "La abreviatura es requerida").max(10, "Máximo 10 caracteres"),
  dominancia: z.string().optional(),
  aromaSabor: z.string().optional(),
  thc: z.string().optional(),
  cbd: z.string().optional(),
});

type NewCepaFormData = z.infer<typeof newCepaSchema>;

interface NewCepaFormProps {
  onBack: () => void;
  onClose: () => void;
}

export const NewCepaForm = ({ onBack, onClose }: NewCepaFormProps) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast(); // Inicializar el hook

  const createCepaMutation = useMutation({
    mutationFn: apiService.createCepa,
    onSuccess: (data) => {
      toast({
        title: "¡Genética Registrada!",
        description: `La cepa '${data.geneticaParental}' (ID: ${data.id}) ha sido creada con éxito.`,
      });
      setIsSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['cepas'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error al crear la genética",
        description: error.message || "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
      });
    }
  });

  const form = useForm<NewCepaFormData>({
    resolver: zodResolver(newCepaSchema),
    defaultValues: {
      geneticaParental: "",
      abreviatura: "",
      dominancia: "",
      aromaSabor: "",
      thc: "",
      cbd: "",
    },
  });

  const onSubmit = (data: NewCepaFormData) => {
    createCepaMutation.mutate(data);
  };

  const handleReset = () => {
    form.reset();
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-foreground">¡Cepa Registrada!</h3>
          <p className="text-muted-foreground">La genética ha sido guardada.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <Button onClick={handleReset} variant="outline" className="flex-1">
            <Plus className="mr-2 h-4 w-4" />
            Crear Otra
          </Button>
          <Button onClick={onClose} className="flex-1">
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h3 className="text-xl font-bold text-foreground">Nueva Genética</h3>
          <p className="text-sm text-muted-foreground">Registra una nueva variedad</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="geneticaParental"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre / Genética</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Gelato #33" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="abreviatura"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ABR — Abreviatura</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: GEL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="dominancia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dominancia (Sativa/Indica)</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: 70% Indica" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="thc"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>THC</FormLabel>
                    <FormControl>
                    <Input placeholder="24%" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="cbd"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>CBD</FormLabel>
                    <FormControl>
                    <Input placeholder="< 1%" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>

          <Button type="submit" className="w-full" size="lg" disabled={createCepaMutation.isPending}>
             {createCepaMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-5 w-5" />
            )}
            Guardar Genética
          </Button>
        </form>
      </Form>
    </div>
  );
};
