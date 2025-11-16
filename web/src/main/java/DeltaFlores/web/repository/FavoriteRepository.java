package DeltaFlores.web.repository;

import DeltaFlores.web.entities.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite,Long> {
    List<Favorite> findAll();
    Optional<Favorite> findById(Long id);
    Favorite save(Favorite favorite);
    void deleteById(Long id);
}
