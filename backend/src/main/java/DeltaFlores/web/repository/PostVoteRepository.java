package DeltaFlores.web.repository;

import DeltaFlores.web.entities.PostVote;
import DeltaFlores.web.entities.TipoVoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostVoteRepository extends JpaRepository<PostVote, Long> {

    Optional<PostVote> findByPostIdAndUserId(Long postId, Long userId);

    Optional<PostVote> findByReplyIdAndUserId(Long replyId, Long userId);

    @Query("SELECT COUNT(v) FROM PostVote v WHERE v.post.id = :postId AND v.tipo = :tipo")
    long countByPostIdAndTipo(@Param("postId") Long postId, @Param("tipo") TipoVoto tipo);

    @Query("SELECT COUNT(v) FROM PostVote v WHERE v.reply.id = :replyId AND v.tipo = :tipo")
    long countByReplyIdAndTipo(@Param("replyId") Long replyId, @Param("tipo") TipoVoto tipo);

    @Query("SELECT v.post.id FROM PostVote v WHERE v.user.id = :userId")
    List<Long> findPostIdsVotedByUserId(@Param("userId") Long userId);

    void deleteByPostId(Long postId);

    void deleteByReplyId(Long replyId);
}
