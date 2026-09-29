package DeltaFlores.web.service;

import DeltaFlores.web.dto.PostCreateDto;
import DeltaFlores.web.dto.PostDetailDto;
import DeltaFlores.web.dto.PostDto;
import DeltaFlores.web.entities.*;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.PostRepository;
import DeltaFlores.web.repository.PostReplyRepository;
import DeltaFlores.web.repository.PostVoteRepository;
import DeltaFlores.web.repository.UserRepository;
import DeltaFlores.web.security.CustomUserDetails;
import DeltaFlores.web.utils.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Log4j2
public class PostService {

    private final PostRepository postRepository;
    private final PostReplyRepository postReplyRepository;
    private final PostVoteRepository postVoteRepository;
    private final UserRepository userRepository;

    // ─── Queries ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<PostDto> getPosts(CategoriaPost categoria, TipoPost tipoPost, String sort, String search, int page, int size) {
        Pageable pageable = buildPageable(sort, page, size);
        Page<Post> posts;

        if (search != null && !search.isBlank()) {
            posts = postRepository.searchByQuery(search.trim(), pageable);
        } else if (categoria != null && tipoPost != null) {
            posts = postRepository.findByCategoriaAndTipoPost(categoria, tipoPost, pageable);
        } else if (categoria != null) {
            posts = postRepository.findByCategoria(categoria, pageable);
        } else if (tipoPost != null) {
            posts = postRepository.findByTipoPost(tipoPost, pageable);
        } else {
            posts = postRepository.findAll(pageable);
        }

        Long currentUserId = getCurrentUserIdOrNull();
        return posts.map(p -> DtoMapper.postToDto(p, currentUserId, postVoteRepository, postReplyRepository));
    }

    @Transactional(readOnly = true)
    public PostDetailDto getPostById(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post no encontrado con id: " + id));
        post.setVistas(post.getVistas() + 1);
        postRepository.save(post);

        Long currentUserId = getCurrentUserIdOrNull();
        PostDto dto = DtoMapper.postToDto(post, currentUserId, postVoteRepository, postReplyRepository);
        PostDetailDto detail = new PostDetailDto();
        // Copy fields from dto to detail
        detail.setId(dto.getId());
        detail.setTitulo(dto.getTitulo());
        detail.setContenido(dto.getContenido());
        detail.setContenidoPreview(dto.getContenidoPreview());
        detail.setTipoPost(dto.getTipoPost());
        detail.setCategoria(dto.getCategoria());
        detail.setResuelto(dto.isResuelto());
        detail.setHero(dto.isHero());
        detail.setVistas(dto.getVistas());
        detail.setUserId(dto.getUserId());
        detail.setUserUsername(dto.getUserUsername());
        detail.setUserNombre(dto.getUserNombre());
        detail.setUserApellido(dto.getUserApellido());
        detail.setUserImagenUrl(dto.getUserImagenUrl());
        detail.setUpCount(dto.getUpCount());
        detail.setDownCount(dto.getDownCount());
        detail.setScore(dto.getScore());
        detail.setReplyCount(dto.getReplyCount());
        detail.setCurrentUserVote(dto.getCurrentUserVote());
        detail.setFechaCreacion(dto.getFechaCreacion());
        // Load replies
        detail.setReplies(postReplyRepository.findByPostIdOrderByFechaCreacionAsc(id).stream()
                .map(r -> DtoMapper.replyToDto(r, currentUserId, postVoteRepository))
                .toList());
        return detail;
    }

    @Transactional(readOnly = true)
    public Page<PostDto> getUserPosts(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "fechaCreacion"));
        Page<Post> posts = postRepository.findByUserIdOrderByFechaCreacionDesc(userId, pageable);
        Long currentUserId = getCurrentUserIdOrNull();
        return posts.map(p -> DtoMapper.postToDto(p, currentUserId, postVoteRepository, postReplyRepository));
    }

    // ─── Crear / Editar / Eliminar ─────────────────────────

    @Transactional
    public PostDto createPost(PostCreateDto dto) {
        User user = getCurrentUser();
        Post post = Post.builder()
                .titulo(dto.getTitulo())
                .contenido(dto.getContenido())
                .tipoPost(dto.getTipoPost())
                .categoria(dto.getCategoria())
                .user(user)
                .build();
        post.prePersist();
        Post saved = postRepository.save(post);
        log.info("Post creado: id={}, titulo={}, user={}", saved.getId(), saved.getTitulo(), user.getUsername());
        return DtoMapper.postToDto(saved, user.getId(), postVoteRepository, postReplyRepository);
    }

    @Transactional
    public PostDto updatePost(Long id, PostCreateDto dto) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post no encontrado con id: " + id));
        User user = getCurrentUser();
        if (!post.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("No tenés permiso para editar este post.");
        }
        post.setTitulo(dto.getTitulo());
        post.setContenido(dto.getContenido());
        post.setTipoPost(dto.getTipoPost());
        post.setCategoria(dto.getCategoria());
        post.preUpdate();
        Post saved = postRepository.save(post);
        return DtoMapper.postToDto(saved, user.getId(), postVoteRepository, postReplyRepository);
    }

    @Transactional
    public void deletePost(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post no encontrado con id: " + id));
        User user = getCurrentUser();
        boolean isOwner = post.getUser().getId().equals(user.getId());
        boolean isAdmin = user.getRol().name().equals("ROLE_ADMIN") || user.getRol().name().equals("ROLE_SUPER_ADMIN");
        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("No tenés permiso para eliminar este post.");
        }
        // Delete votes and replies first
        postVoteRepository.deleteByPostId(id);
        postRepository.delete(post);
        log.info("Post eliminado: id={}, by={}", id, user.getUsername());
    }

    // ─── Votar ─────────────────────────────────────────────

    @Transactional
    public PostDto votePost(Long postId, TipoVoto tipo) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post no encontrado con id: " + postId));
        User user = getCurrentUser();

        Optional<PostVote> existingVote = postVoteRepository.findByPostIdAndUserId(postId, user.getId());

        if (existingVote.isPresent()) {
            PostVote vote = existingVote.get();
            if (vote.getTipo() == tipo) {
                // Same vote → remove it (toggle off)
                postVoteRepository.delete(vote);
            } else {
                // Different vote → change it
                vote.setTipo(tipo);
                postVoteRepository.save(vote);
            }
        } else {
            // No vote yet → create
            PostVote vote = PostVote.builder()
                    .tipo(tipo)
                    .post(post)
                    .user(user)
                    .build();
            postVoteRepository.save(vote);
        }

        return DtoMapper.postToDto(post, user.getId(), postVoteRepository, postReplyRepository);
    }

    // ─── Resolver ──────────────────────────────────────────

    @Transactional
    public PostDto markResuelto(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post no encontrado con id: " + postId));
        User user = getCurrentUser();
        if (!post.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Solo el autor puede marcar como resuelto.");
        }
        if (post.getTipoPost() != TipoPost.DEBATE) {
            throw new IllegalArgumentException("Solo los posts de tipo DEBATE pueden marcarse como resueltos.");
        }
        post.setResuelto(!post.isResuelto());
        Post saved = postRepository.save(post);
        return DtoMapper.postToDto(saved, user.getId(), postVoteRepository, postReplyRepository);
    }

    // ─── Hero (Admin) ─────────────────────────────────────

    @Transactional
    public PostDto toggleHero(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post no encontrado con id: " + postId));
        User user = getCurrentUser();
        boolean isAdmin = user.getRol().name().equals("ROLE_ADMIN") || user.getRol().name().equals("ROLE_SUPER_ADMIN");
        if (!isAdmin) {
            throw new AccessDeniedException("Solo los admins pueden gestionar posts hero.");
        }
        // Limit hero posts to 5
        if (!post.isHero()) {
            long heroCount = postRepository.findByIsHeroTrueOrderByFechaCreacionDesc().stream().count();
            if (heroCount >= 5) {
                throw new IllegalArgumentException("Ya hay 5 posts hero. Eliminá uno antes de agregar otro.");
            }
        }
        post.setHero(!post.isHero());
        Post saved = postRepository.save(post);
        return DtoMapper.postToDto(saved, user.getId(), postVoteRepository, postReplyRepository);
    }

    @Transactional(readOnly = true)
    public java.util.List<PostDto> getHeroPosts() {
        Long currentUserId = getCurrentUserIdOrNull();
        return postRepository.findHeroPosts().stream()
                .map(p -> DtoMapper.postToDto(p, currentUserId, postVoteRepository, postReplyRepository))
                .toList();
    }

    // ─── Helpers ───────────────────────────────────────────

    private Pageable buildPageable(String sort, int page, int size) {
        Sort springSort;
        if ("votes".equals(sort)) {
            springSort = Sort.by(Sort.Direction.DESC, "fechaCreacion"); // TODO: sort by score when computed
        } else if ("replies".equals(sort)) {
            springSort = Sort.by(Sort.Direction.DESC, "fechaCreacion");
        } else {
            springSort = Sort.by(Sort.Direction.DESC, "fechaCreacion");
        }
        return PageRequest.of(page, size, springSort);
    }

    private User getCurrentUser() {
        CustomUserDetails userDetails = (CustomUserDetails) getAuthentication().getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    private Long getCurrentUserIdOrNull() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails) {
            return ((CustomUserDetails) auth.getPrincipal()).getId();
        }
        return null;
    }

    private Authentication getAuthentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }
}
