package DeltaFlores.web.repository;

import DeltaFlores.web.entities.PostReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostReplyRepository extends JpaRepository<PostReply, Long> {

    List<PostReply> findByPostIdOrderByFechaCreacionAsc(Long postId);

    long countByPostId(Long postId);

    @Query("SELECT r.post.id FROM PostReply r WHERE r.user.id = :userId")
    List<Long> findPostIdsWithRepliesByUserId(@Param("userId") Long userId);
}
