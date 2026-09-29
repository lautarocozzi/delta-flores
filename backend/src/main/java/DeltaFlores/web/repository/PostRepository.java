package DeltaFlores.web.repository;

import DeltaFlores.web.entities.CategoriaPost;
import DeltaFlores.web.entities.Post;
import DeltaFlores.web.entities.TipoPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    Page<Post> findByCategoria(CategoriaPost categoria, Pageable pageable);

    Page<Post> findByTipoPost(TipoPost tipoPost, Pageable pageable);

    Page<Post> findByCategoriaAndTipoPost(CategoriaPost categoria, TipoPost tipoPost, Pageable pageable);

    Page<Post> findByUserIdOrderByFechaCreacionDesc(Long userId, Pageable pageable);

    List<Post> findByIsHeroTrueOrderByFechaCreacionDesc();

    @Query("SELECT p FROM Post p WHERE LOWER(p.titulo) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.contenido) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Post> searchByQuery(@Param("query") String query, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.isHero = true ORDER BY p.fechaCreacion DESC")
    List<Post> findHeroPosts();

    long countByUserId(Long userId);

    long countByCategoria(CategoriaPost categoria);
}
