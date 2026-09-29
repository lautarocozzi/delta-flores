package DeltaFlores.web.service;

import DeltaFlores.web.dto.PostReplyDto;
import DeltaFlores.web.entities.*;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.PostReplyRepository;
import DeltaFlores.web.repository.PostRepository;
import DeltaFlores.web.repository.PostVoteRepository;
import DeltaFlores.web.repository.UserRepository;
import DeltaFlores.web.security.CustomUserDetails;
import DeltaFlores.web.utils.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Log4j2
public class PostReplyService {

    private final PostReplyRepository postReplyRepository;
    private final PostRepository postRepository;
    private final PostVoteRepository postVoteRepository;
    private final UserRepository userRepository;

    @Transactional
    public PostReplyDto createReply(Long postId, String contenido) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post no encontrado con id: " + postId));
        User user = getCurrentUser();

        PostReply reply = PostReply.builder()
                .contenido(contenido)
                .post(post)
                .user(user)
                .build();

        PostReply saved = postReplyRepository.save(reply);
        log.info("Reply creado: postId={}, replyId={}, user={}", postId, saved.getId(), user.getUsername());
        return DtoMapper.replyToDto(saved, user.getId(), postVoteRepository);
    }

    @Transactional
    public void deleteReply(Long replyId) {
        PostReply reply = postReplyRepository.findById(replyId)
                .orElseThrow(() -> new ResourceNotFoundException("Reply no encontrado con id: " + replyId));
        User user = getCurrentUser();
        boolean isOwner = reply.getUser().getId().equals(user.getId());
        boolean isPostOwner = reply.getPost().getUser().getId().equals(user.getId());
        boolean isAdmin = user.getRol().name().equals("ROLE_ADMIN") || user.getRol().name().equals("ROLE_SUPER_ADMIN");
        if (!isOwner && !isPostOwner && !isAdmin) {
            throw new AccessDeniedException("No tenés permiso para eliminar esta respuesta.");
        }
        postVoteRepository.deleteByReplyId(replyId);
        postReplyRepository.delete(reply);
        log.info("Reply eliminado: replyId={}, by={}", replyId, user.getUsername());
    }

    @Transactional
    public PostReplyDto voteReply(Long replyId, TipoVoto tipo) {
        PostReply reply = postReplyRepository.findById(replyId)
                .orElseThrow(() -> new ResourceNotFoundException("Reply no encontrado con id: " + replyId));
        User user = getCurrentUser();

        var existingVote = postVoteRepository.findByReplyIdAndUserId(replyId, user.getId());

        if (existingVote.isPresent()) {
            PostVote vote = existingVote.get();
            if (vote.getTipo() == tipo) {
                postVoteRepository.delete(vote);
            } else {
                vote.setTipo(tipo);
                postVoteRepository.save(vote);
            }
        } else {
            PostVote vote = PostVote.builder()
                    .tipo(tipo)
                    .reply(reply)
                    .user(user)
                    .build();
            postVoteRepository.save(vote);
        }

        return DtoMapper.replyToDto(reply, user.getId(), postVoteRepository);
    }

    @Transactional
    public PostReplyDto markSolucion(Long replyId) {
        PostReply reply = postReplyRepository.findById(replyId)
                .orElseThrow(() -> new ResourceNotFoundException("Reply no encontrado con id: " + replyId));
        User user = getCurrentUser();

        // Only the post author can mark a reply as solution
        if (!reply.getPost().getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Solo el autor del post puede marcar una respuesta como solución.");
        }
        if (reply.getPost().getTipoPost() != TipoPost.DEBATE) {
            throw new IllegalArgumentException("Solo posts de tipo DEBATE pueden tener soluciones.");
        }

        // Unmark previous solution if any
        postReplyRepository.findByPostIdOrderByFechaCreacionAsc(reply.getPost().getId()).stream()
                .filter(PostReply::isSolucion)
                .forEach(r -> {
                    r.setSolucion(false);
                    postReplyRepository.save(r);
                });

        reply.setSolucion(!reply.isSolucion());
        PostReply saved = postReplyRepository.save(reply);
        return DtoMapper.replyToDto(saved, user.getId(), postVoteRepository);
    }

    private User getCurrentUser() {
        CustomUserDetails userDetails = (CustomUserDetails) getAuthentication().getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    private Authentication getAuthentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }
}
