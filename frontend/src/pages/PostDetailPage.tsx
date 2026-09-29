import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  MessageSquare,
  BookOpen,
  CheckCircle2,
  Eye,
  Loader2,
  Send,
  Trash2,
} from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layouts/AppSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { VoteButtons } from "@/components/comunidad/VoteButtons";
import { PostDetailDto, PostReplyDto } from "@/schemas/DTOSchemas";
import { apiService } from "@/services/api";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const categoriaLabels: Record<string, string> = {
  CULTIVO: "Cultivo",
  NUTRICION: "Nutrición",
  EQUIPAMIENTO: "Equipamiento",
  GENETICA: "Genética",
  GASTRONOMIA: "Gastronomía",
  PRODUCTOS_HEMP: "Hemp",
};

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [replyContent, setReplyContent] = useState("");

  const { data: post, isLoading } = useQuery<PostDetailDto>({
    queryKey: ["comunidad-post", postId],
    queryFn: () => apiService.getPost(Number(postId)),
    enabled: !!postId,
  });

  const voteMutation = useMutation({
    mutationFn: (params: { id: number; tipo: "UP" | "DOWN" }) =>
      apiService.votePost(params.id, params.tipo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comunidad-post", postId] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: () => apiService.markResuelto(Number(postId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comunidad-post", postId] });
      toast({ title: post?.isResuelto ? "Marcado como no resuelto" : "Marcado como resuelto" });
    },
  });

  const replyMutation = useMutation({
    mutationFn: () => apiService.createReply(Number(postId), replyContent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comunidad-post", postId] });
      setReplyContent("");
      toast({ title: "Respuesta publicada" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const replyVoteMutation = useMutation({
    mutationFn: (params: { id: number; tipo: "UP" | "DOWN" }) =>
      apiService.voteReply(params.id, params.tipo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comunidad-post", postId] });
    },
  });

  const solveMutation = useMutation({
    mutationFn: (replyId: number) => apiService.markSolucion(replyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comunidad-post", postId] });
      toast({ title: "Solución marcada" });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: () => apiService.deletePost(Number(postId)),
    onSuccess: () => {
      toast({ title: "Post eliminado" });
      navigate("/comunidad");
    },
  });

  const deleteReplyMutation = useMutation({
    mutationFn: (replyId: number) => apiService.deleteReply(replyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comunidad-post", postId] });
      toast({ title: "Respuesta eliminada" });
    },
  });

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMin / 60);
    const diffD = Math.floor(diffH / 24);
    if (diffD > 0) return `hace ${diffD}d`;
    if (diffH > 0) return `hace ${diffH}h`;
    if (diffMin > 0) return `hace ${diffMin}m`;
    return "ahora";
  };

  const isAuthor = user?.id === post?.userId;

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen w-full flex bg-background">
          <AppSidebar />
          <main className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!post) {
    return (
      <SidebarProvider>
        <div className="min-h-screen w-full flex bg-background">
          <AppSidebar />
          <main className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Post no encontrado.</p>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-background">
        <AppSidebar />
        <main className="flex-1">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="flex items-center gap-3 px-4 py-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => navigate("/comunidad")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <SidebarTrigger />
              <h1 className="text-sm font-medium truncate flex-1">{post.titulo}</h1>
              {isAuthor && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive"
                  onClick={() => {
                    if (confirm("¿Eliminar este post?")) deletePostMutation.mutate();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="max-w-3xl mx-auto p-4">
            {/* Post */}
            <Card className="p-6 mb-6">
              {/* Badges */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    post.tipoPost === "DEBATE"
                      ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                      : "bg-orange-500/10 text-orange-600 border-orange-500/20"
                  )}
                >
                  {post.tipoPost === "DEBATE" ? (
                    <><Eye className="h-3 w-3 mr-1" /> Debate</>
                  ) : (
                    <><BookOpen className="h-3 w-3 mr-1" /> Guía</>
                  )}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {categoriaLabels[post.categoria]}
                </Badge>
                {post.isResuelto && (
                  <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Resuelto
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold mb-3">{post.titulo}</h1>

              {/* Author */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <span className="font-medium text-foreground">@{post.userUsername}</span>
                <span>·</span>
                <span>{timeAgo(post.fechaCreacion)}</span>
                <span>·</span>
                <span>{post.vistas} vistas</span>
              </div>

              {/* Body */}
              <div className="prose prose-sm max-w-none whitespace-pre-wrap mb-6">
                {post.contenido}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-4 border-t">
                <VoteButtons
                  upCount={post.upCount}
                  downCount={post.downCount}
                  score={post.score}
                  currentUserVote={post.currentUserVote}
                  onVote={(tipo) => voteMutation.mutate({ id: post.id, tipo })}
                />
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" /> {post.replies.length} respuestas
                </span>
                {isAuthor && post.tipoPost === "DEBATE" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resolveMutation.mutate()}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    {post.isResuelto ? "Desmarcar resuelto" : "Marcar resuelto"}
                  </Button>
                )}
              </div>
            </Card>

            {/* Replies */}
            <div className="space-y-3 mb-6">
              <h2 className="text-sm font-medium text-muted-foreground">
                {post.replies.length} respuesta{post.replies.length !== 1 && "s"}
              </h2>
              {post.replies.map((reply) => (
                <ReplyCard
                  key={reply.id}
                  reply={reply}
                  isPostAuthor={isAuthor}
                  currentUserId={user?.id}
                  onVote={(tipo) => replyVoteMutation.mutate({ id: reply.id, tipo })}
                  onSolve={() => solveMutation.mutate(reply.id)}
                  onDelete={() => {
                    if (confirm("¿Eliminar esta respuesta?")) deleteReplyMutation.mutate(reply.id);
                  }}
                  timeAgo={timeAgo}
                />
              ))}
            </div>

            {/* Reply input */}
            <Card className="p-4">
              <Textarea
                placeholder="Escribí tu respuesta..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={3}
                className="resize-none mb-3"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  disabled={!replyContent.trim() || replyMutation.isPending}
                  onClick={() => replyMutation.mutate()}
                >
                  {replyMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Responder
                </Button>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

// ─── Reply Card ────────────────────────────────────────────

interface ReplyCardProps {
  reply: PostReplyDto;
  isPostAuthor: boolean;
  currentUserId?: number;
  onVote: (tipo: "UP" | "DOWN") => void;
  onSolve: () => void;
  onDelete: () => void;
  timeAgo: (dateStr: string) => string;
}

function ReplyCard({ reply, isPostAuthor, currentUserId, onVote, onSolve, onDelete, timeAgo }: ReplyCardProps) {
  const isReplyAuthor = currentUserId === reply.userId;

  return (
    <Card
      className={cn(
        "p-4",
        reply.isSolucion && "ring-2 ring-green-500/30 bg-green-500/5"
      )}
    >
      {reply.isSolucion && (
        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20 mb-2">
          <CheckCircle2 className="h-3 w-3 mr-1" /> Solución aceptada
        </Badge>
      )}

      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <span className="font-medium text-foreground">@{reply.userUsername}</span>
        <span>·</span>
        <span>{timeAgo(reply.fechaCreacion)}</span>
      </div>

      <p className="text-sm whitespace-pre-wrap mb-3">{reply.contenido}</p>

      <div className="flex items-center gap-3">
        <VoteButtons
          upCount={reply.upCount}
          downCount={reply.downCount}
          score={reply.score}
          currentUserVote={reply.currentUserVote}
          onVote={onVote}
          size="sm"
        />
        {isPostAuthor && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={onSolve}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            {reply.isSolucion ? "Desmarcar" : "Solución"}
          </Button>
        )}
        {(isReplyAuthor || isPostAuthor) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Eliminar
          </Button>
        )}
      </div>
    </Card>
  );
}
