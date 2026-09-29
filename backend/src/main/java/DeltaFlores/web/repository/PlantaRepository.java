package DeltaFlores.web.repository;

import DeltaFlores.web.entities.Planta;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlantaRepository extends JpaRepository<Planta, Long> {

    @Query("SELECT DISTINCT p FROM Planta p LEFT JOIN FETCH p.events LEFT JOIN FETCH p.cepa LEFT JOIN FETCH p.sala LEFT JOIN FETCH p.zona WHERE p.id = :id")
    Optional<Planta> findByIdWithEvents(@Param("id") Long id);

    @EntityGraph(attributePaths = {"cepa", "sala", "zona"})
    List<Planta> findByUserId(Long userId);

    @EntityGraph(attributePaths = {"cepa", "sala", "zona"})
    List<Planta> findByNombre(String palabraClave);

    @EntityGraph(attributePaths = {"cepa", "sala", "zona"})
    List<Planta> findBySalaId(Long salaId);

    @Override
    @EntityGraph(attributePaths = {"cepa", "sala", "zona"})
    List<Planta> findAll();

    @Override
    @EntityGraph(attributePaths = {"cepa", "sala", "zona"})
    Optional<Planta> findById(Long id);

    boolean existsByZonaIdAndColumnaEnZonaAndFilaEnZona(Long zonaId, Integer columnaEnZona, Integer filaEnZona);

    @Query("SELECT COUNT(p) > 0 FROM Planta p WHERE p.zona.id = :zonaId AND p.columnaEnZona = :columna AND p.filaEnZona = :fila AND p.id <> :excludePlantaId")
    boolean existsOtherAtCell(@Param("zonaId") Long zonaId, @Param("columna") Integer columna, @Param("fila") Integer fila, @Param("excludePlantaId") Long excludePlantaId);

    @EntityGraph(attributePaths = {"cepa", "sala", "zona"})
    List<Planta> findByIsPublicTrue();

    @EntityGraph(attributePaths = {"cepa", "sala", "zona"})
    List<Planta> findByIsPublicTrueAndUserId(Long userId);

    @Modifying
    @Query(value = "DELETE FROM plants_has_events WHERE planta_id = :plantaId", nativeQuery = true)
    void deleteEventsByPlantaId(@Param("plantaId") Long plantaId);

    @Modifying
    @Query(value = "DELETE FROM plants_has_events WHERE planta_id IN :plantaIds", nativeQuery = true)
    void deleteEventsByPlantaIds(@Param("plantaIds") List<Long> plantaIds);
}
