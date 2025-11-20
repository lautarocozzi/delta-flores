package DeltaFlores.web.repository;

import DeltaFlores.web.entities.MeasurementEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MeasurementEventRepository extends JpaRepository<MeasurementEvent, Long> {

    /**
     * Finds all measurement events associated with a specific plant ID.
     * @param plantaId The ID of the plant.
     * @return A list of measurement events.
     */
    @Query("SELECT e FROM MeasurementEvent e JOIN e.plantas p WHERE p.id = :plantaId")
    List<MeasurementEvent> findByPlantaId(@Param("plantaId") Long plantaId);

    /**
     * Finds all measurement events on a specific date.
     * @param fecha The date to search for.
     * @return A list of measurement events.
     */
    List<MeasurementEvent> findByFecha(LocalDate fecha);

    /**
     * Finds all measurement events after a given date.
     * @param fecha The date to search after.
     * @return A list of measurement events.
     */
    List<MeasurementEvent> findByFechaAfter(LocalDate fecha);
}
