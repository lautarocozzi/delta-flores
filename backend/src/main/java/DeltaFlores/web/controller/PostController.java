package DeltaFlores.web.controller;

import DeltaFlores.web.dto.PostCreateDto;
import DeltaFlores.web.dto.PostDetailDto;
import DeltaFlores.web.dto.PostDto;
import DeltaFlores.web.dto.PostReplyDto;
import DeltaFlores.web.dto.TopPlantaDto;
import DeltaFlores.web.entities.CategoriaPost;
import DeltaFlores.web.entities.TipoPost;
import DeltaFlores.web.entities.TipoVoto;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.service.PostReplyService;
import DeltaFlores.web.service.PostService;
import DeltaFlores.web.service.TopPlantaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/comunidad")
@RequiredArgsConstructor
@Log4j2
public class PostController {

    private final PostService postService;
    private final PostReplyService postReplyService;
    private final TopPlantaService topPlantaService;

    // ─── Posts (públicos) ──────────────────────────────────

    @GetMapping("/posts")
    public ResponseEntity<Page<PostDto>> getPosts(
            @RequestParam(required = false) CategoriaPost categoria,
            @RequestParam(required = false) TipoPost tipo,
            @RequestParam(required = false, defaultValue = "recent") String sort,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Page<PostDto> posts = postService.getPosts(categoria, tipo, sort, search, page, size);
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            log.error("Error al obtener posts: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/posts/hero")
    public ResponseEntity<List<PostDto>> getHeroPosts() {
        try {
            return ResponseEntity.ok(postService.getHeroPosts());
        } catch (Exception e) {
            log.error("Error al obtener posts hero: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/posts/{id}")
    public ResponseEntity<PostDetailDto> getPostById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(postService.getPostById(id));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error al obtener post {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/posts/user/{userId}")
    public ResponseEntity<Page<PostDto>> getUserPosts(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            return ResponseEntity.ok(postService.getUserPosts(userId, page, size));
        } catch (Exception e) {
            log.error("Error al obtener posts del usuario {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/posts/{id}/replies")
    public ResponseEntity<List<PostReplyDto>> getReplies(@PathVariable Long id) {
        try {
            PostDetailDto detail = postService.getPostById(id);
            return ResponseEntity.ok(detail.getReplies());
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error al obtener replies del post {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/top-plantas")
    public ResponseEntity<List<TopPlantaDto>> getTopPlantas(
            @RequestParam(defaultValue = "10") int limit) {
        try {
            return ResponseEntity.ok(topPlantaService.getTopPlantas(limit));
        } catch (Exception e) {
            log.error("Error al obtener top plantas: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Map<String, String>>> getCategories() {
        List<Map<String, String>> categories = Arrays.stream(CategoriaPost.values())
                .map(c -> Map.of(
                        "value", c.name(),
                        "label", formatCategoria(c.name())))
                .collect(Collectors.toList());
        return ResponseEntity.ok(categories);
    }

    // ─── Posts (requieren auth) ─────────────────────────────

    @PostMapping("/posts")
    public ResponseEntity<?> createPost(@RequestBody PostCreateDto dto) {
        try {
            PostDto created = postService.createPost(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            log.error("Error al crear post: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PutMapping("/posts/{id}")
    public ResponseEntity<?> updatePost(@PathVariable Long id, @RequestBody PostCreateDto dto) {
        try {
            return ResponseEntity.ok(postService.updatePost(id, dto));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            log.error("Error al actualizar post {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id) {
        try {
            postService.deletePost(id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            log.error("Error al eliminar post {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/posts/{id}/vote")
    public ResponseEntity<?> votePost(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            TipoVoto tipo = TipoVoto.valueOf(body.get("tipo").toUpperCase());
            return ResponseEntity.ok(postService.votePost(id, tipo));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Tipo de voto inválido. Use UP o DOWN.");
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error al votar post {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/posts/{id}/resolve")
    public ResponseEntity<?> markResuelto(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(postService.markResuelto(id));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error al marcar resuelto {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ─── Replies ───────────────────────────────────────────

    @PostMapping("/posts/{id}/replies")
    public ResponseEntity<?> createReply(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String contenido = body.get("contenido");
            if (contenido == null || contenido.isBlank()) {
                return ResponseEntity.badRequest().body("El contenido es requerido.");
            }
            PostReplyDto reply = postReplyService.createReply(id, contenido);
            return ResponseEntity.status(HttpStatus.CREATED).body(reply);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error al crear reply en post {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/posts/replies/{replyId}")
    public ResponseEntity<?> deleteReply(@PathVariable Long replyId) {
        try {
            postReplyService.deleteReply(replyId);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            log.error("Error al eliminar reply {}: {}", replyId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/posts/replies/{replyId}/vote")
    public ResponseEntity<?> voteReply(@PathVariable Long replyId, @RequestBody Map<String, String> body) {
        try {
            TipoVoto tipo = TipoVoto.valueOf(body.get("tipo").toUpperCase());
            return ResponseEntity.ok(postReplyService.voteReply(replyId, tipo));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Tipo de voto inválido. Use UP o DOWN.");
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error al votar reply {}: {}", replyId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/posts/replies/{replyId}/solve")
    public ResponseEntity<?> markSolucion(@PathVariable Long replyId) {
        try {
            return ResponseEntity.ok(postReplyService.markSolucion(replyId));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error al marcar solución {}: {}", replyId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ─── Admin ─────────────────────────────────────────────

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @DeleteMapping("/admin/posts/{id}")
    public ResponseEntity<?> deletePostAdmin(@PathVariable Long id) {
        try {
            postService.deletePost(id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Admin: error al eliminar post {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @DeleteMapping("/admin/replies/{replyId}")
    public ResponseEntity<?> deleteReplyAdmin(@PathVariable Long replyId) {
        try {
            postReplyService.deleteReply(replyId);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Admin: error al eliminar reply {}: {}", replyId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/posts/{id}/hero")
    public ResponseEntity<?> toggleHero(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(postService.toggleHero(id));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error al toggle hero {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ─── Helpers ───────────────────────────────────────────

    private String formatCategoria(String name) {
        return switch (name) {
            case "CULTIVO" -> "Cultivo";
            case "NUTRICION" -> "Nutrición";
            case "EQUIPAMIENTO" -> "Equipamiento";
            case "GENETICA" -> "Genética";
            case "GASTRONOMIA" -> "Gastronomía";
            case "PRODUCTOS_HEMP" -> "Productos Hemp";
            default -> name;
        };
    }
}
