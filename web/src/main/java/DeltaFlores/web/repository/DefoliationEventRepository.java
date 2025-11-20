package DeltaFlores.web.repository;

import DeltaFlores.web.entities.DefoliationEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DefoliationEventRepository extends JpaRepository<DefoliationEvent, Long> {

    /**
     * Finds all defoliation events associated with a specific plant ID.
     * @param plantaId The ID of the plant.
     * @return A list of defoliation events.
     */
    @Query("SELECT e FROM DefoliationEvent e JOIN e.plantas p WHERE p.id = :plantaId")
    List<DefoliationEvent> findByPlantaId(@Param("plantaId") Long plantaId);

    List<DefoliationEvent> findByFecha(LocalDate fecha);

    /**
     * Finds all defoliation events after a given date.
     * @param fecha The date to search after.
     * @return A list of defoliation events.
     */
    List<DefoliationEvent> findByFechaAfter(LocalDate fecha);
}
