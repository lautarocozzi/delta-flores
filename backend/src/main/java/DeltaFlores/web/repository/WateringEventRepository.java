package DeltaFlores.web.repository;

import DeltaFlores.web.entities.WateringEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface WateringEventRepository extends JpaRepository<WateringEvent, Long> {

    /**
     * Finds all watering events associated with a specific plant ID.
     * @param plantaId The ID of the plant.
     * @return A list of watering events.
     */
    @Query("SELECT e FROM WateringEvent e JOIN e.plantas p WHERE p.id = :plantaId")
    List<WateringEvent> findByPlantaId(@Param("plantaId") Long plantaId);

    /**
     * Finds all watering events on a specific date.
     * @param fecha The date to search for.
     * @return A list of watering events.
     */
    List<WateringEvent> findByFecha(LocalDate fecha);

    /**
     * Finds all watering events after a given date.
     * @param fecha The date to search after.
     * @return A list of watering events.
     */
    List<WateringEvent> findByFechaAfter(LocalDate fecha);
}
