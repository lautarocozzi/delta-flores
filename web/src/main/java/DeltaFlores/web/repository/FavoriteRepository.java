package DeltaFlores.web.repository;

import DeltaFlores.web.entities.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite,Long> {

    Optional<Favorite> findByUserIdAndFavorableIdAndFavorableType(Long userId, Long favorableId, String favorableType);

    @Query("SELECT f.favorableId FROM Favorite f WHERE f.user.id = :userId AND f.favorableType = :favorableType")
    List<Long> findFavorableIdsByUserIdAndFavorableType(@Param("userId") Long userId, @Param("favorableType") String favorableType);

}
