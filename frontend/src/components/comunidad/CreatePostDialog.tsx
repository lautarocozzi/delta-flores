import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, BookOpen, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categorias = [
  { value: "CULTIVO", label: "🌱 Cultivo" },
  { value: "NUTRICION", label: "🧪 Nutrición" },
  { value: "EQUIPAMIENTO", label: "🔧 Equipamiento" },
  { value: "GENETICA", label: "🧬 Genética" },
  { value: "GASTRONOMIA", label: "🍳 Gastronomía" },
  { value: "PRODUCTOS_HEMP", label: "🌿 Hemp" },
];

export function CreatePostDialog({ open, onOpenChange }: CreatePostDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [tipoPost, setTipoPost] = useState<"DEBATE" | "GUIA">("DEBATE");
  const [categoria, setCategoria] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      apiService.createPost({
        titulo,
        contenido,
        tipoPost,
        categoria,
      }),
    onSuccess: () => {
      toast({ title: "Post creado", description: "Tu post fue publicado correctamente." });
      queryClient.invalidateQueries({ queryKey: ["comunidad-posts"] });
      resetForm();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "No se pudo crear el post.",
      });
    },
  });

  const resetForm = () => {
    setTitulo("");
    setContenido("");
    setTipoPost("DEBATE");
    setCategoria("");
  };

  const isValid = titulo.trim().length > 0 && contenido.trim().length > 0 && categoria;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Post</DialogTitle>
          <DialogDescription>
            Compartí una duda o guía con la comunidad.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Tipo */}
          <div className="flex gap-2">
            <Button
              variant={tipoPost === "DEBATE" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setTipoPost("DEBATE")}
            >
              <MessageSquare className="h-4 w-4 mr-2" /> Debate
            </Button>
            <Button
              variant={tipoPost === "GUIA" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setTipoPost("GUIA")}
            >
              <BookOpen className="h-4 w-4 mr-2" /> Guía
            </Button>
          </div>

          {/* Categoría */}
          <Select value={categoria} onValueChange={setCategoria}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar categoría..." />
            </SelectTrigger>
            <SelectContent>
              {categorias.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Título */}
          <Input
            placeholder="Título del post..."
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            maxLength={200}
          />

          {/* Contenido */}
          <Textarea
            placeholder={tipoPost === "DEBATE" ? "Describí tu duda o debate..." : "Escribí tu guía paso a paso..."}
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            rows={8}
            className="resize-none"
          />

          {/* Submit */}
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!isValid || createMutation.isPending}
            className="w-full"
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Publicar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
