package DeltaFlores.web.repository;

import DeltaFlores.web.entities.PruningEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PruningEventRepository extends JpaRepository<PruningEvent, Long> {

    /**
     * Finds all pruning events associated with a specific plant ID.
     * @param plantaId The ID of the plant.
     * @return A list of pruning events.
     */
    @Query("SELECT e FROM PruningEvent e JOIN e.plantas p WHERE p.id = :plantaId")
    List<PruningEvent> findByPlantaId(@Param("plantaId") Long plantaId);

    /**
     * Finds all pruning events on a specific date.
     * @param fecha The date to search for.
     * @return A list of pruning events.
     */
    List<PruningEvent> findByFecha(LocalDate fecha);

    /**
     * Finds all pruning events after a given date.
     * @param fecha The date to search after.
     * @return A list of pruning events.
     */
    List<PruningEvent> findByFechaAfter(LocalDate fecha);
}
