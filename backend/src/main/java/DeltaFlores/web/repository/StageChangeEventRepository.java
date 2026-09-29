package DeltaFlores.web.repository;

import DeltaFlores.web.entities.StageChangeEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface StageChangeEventRepository extends JpaRepository<StageChangeEvent, Long> {

    /**
     * Finds all stage change events associated with a specific plant ID.
     * 
     * @param plantaId The ID of the plant.
     * @return A list of stage change events.
     */
    @Query("SELECT e FROM StageChangeEvent e JOIN e.plantas p WHERE p.id = :plantaId")
    List<StageChangeEvent> findByPlantaId(@Param("plantaId") Long plantaId);

    /**
     * Finds all stage change events on a specific date.
     * 
     * @param fecha The date to search for.
     * @return A list of stage change events.
     */
    List<StageChangeEvent> findByFecha(LocalDate fecha);

    /**
     * Finds all stage change events after a given date.
     * 
     * @param fecha The date to search after.
     * @return A list of stage change events.
     */
    List<StageChangeEvent> findByFechaAfter(LocalDate fecha);

    /**
     * Finds the latest stage change event for a specific plant.
     * Ordered by date descending and then by ID descending (to handle multiple
     * events on same day).
     * 
     * @param plantaId The ID of the plant.
     * @return The latest stage change event, or null (wrapped in Optional if
     *         preferred, but Spring Data nullable return is fine here)
     */
    StageChangeEvent findTopByPlantas_IdOrderByFechaDescIdDesc(Long plantaId);
}
