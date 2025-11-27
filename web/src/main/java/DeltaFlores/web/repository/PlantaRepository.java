package DeltaFlores.web.repository;

import DeltaFlores.web.entities.Planta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlantaRepository extends JpaRepository<Planta, Long> {

    @Query("SELECT p FROM Planta p LEFT JOIN FETCH p.events WHERE p.id = :id")
    Optional<Planta> findByIdWithEvents(@Param("id") Long id);

    List<Planta> findByUserId(Long userId);

    List<Planta> findByNombre(String palabraClave);

    List<Planta> findBySalaId(Long salaId);
}
