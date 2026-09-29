package DeltaFlores.web.repository;

import DeltaFlores.web.entities.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    @Query("SELECT f FROM Favorite f WHERE f.user.id = :userId AND f.favorableId = :favorableId AND f.favorableType = :favorableType")
    Optional<Favorite> findByUserIdAndFavorableIdAndFavorableType(@Param("userId") Long userId,
            @Param("favorableId") Long favorableId, @Param("favorableType") String favorableType);

    @Query("SELECT f.favorableId FROM Favorite f WHERE f.user.id = :userId AND f.favorableType = :favorableType")
    List<Long> findFavorableIdsByUserIdAndFavorableType(@Param("userId") Long userId,
            @Param("favorableType") String favorableType);

    @Query("SELECT f.favorableId, COUNT(f) FROM Favorite f WHERE f.favorableType = :favorableType AND f.favorableId IN :ids GROUP BY f.favorableId")
    List<Object[]> countByFavorableIdsAndType(@Param("ids") List<Long> ids, @Param("favorableType") String favorableType);

}
