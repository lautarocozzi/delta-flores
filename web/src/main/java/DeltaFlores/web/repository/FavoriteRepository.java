package DeltaFlores.web.repository;

import DeltaFlores.web.entities.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite,Long> {
    
    Optional<Favorite> findByUserIdAndPlantaId(Long userId, Long plantaId);

    
    List<Favorite> findByUserId(Long userId);

    @Query("SELECT f FROM Favorite f JOIN FETCH f.planta WHERE f.user.id = :userId")
    List<Favorite> findByUserIdWithPlanta(@Param("userId") Long userId);

}
