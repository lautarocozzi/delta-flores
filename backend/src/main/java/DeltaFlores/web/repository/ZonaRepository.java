package DeltaFlores.web.repository;

import DeltaFlores.web.entities.Zona;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ZonaRepository extends JpaRepository<Zona, Long> {

    List<Zona> findBySalaId(Long salaId);

    List<Zona> findBySalaIdOrderByPosicionXAscPosicionYAsc(Long salaId);

    @Query("SELECT z FROM Zona z JOIN FETCH z.plantas WHERE z.id = :zonaId")
    Optional<Zona> findByIdWithPlantas(@Param("zonaId") Long zonaId);
}
