package DeltaFlores.web.repository;

import DeltaFlores.web.entities.PlantEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlantEventRepository extends JpaRepository<PlantEvent, Long> {
    // @Query("SELECT e FROM PlantEvent e WHERE e.plantas IS EMPTY")
    // List<PlantEvent> findEventosSinPlantas();
    List<PlantEvent> findByPlantasIsEmpty();
    /**
     * @Query("SELECT e FROM PlantEvent e JOIN e.plantas p WHERE p.id = :plantaId ORDER BY e.fecha ASC")
     */
    List<PlantEvent> findByPlantasIdOrderByFechaAsc(@Param("plantaId") Long plantaId);

}

