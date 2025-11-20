package DeltaFlores.web.repository;

import DeltaFlores.web.entities.NutrientEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface NutrientEventRepository extends JpaRepository<NutrientEvent, Long> {

    /**
     * Finds all nutrient events associated with a specific plant ID.
     * @param plantaId The ID of the plant.
     * @return A list of nutrient events.
     */
    @Query("SELECT e FROM NutrientEvent e JOIN e.plantas p WHERE p.id = :plantaId")
    List<NutrientEvent> findByPlantaId(@Param("plantaId") Long plantaId);

    /**
     * Finds all nutrient events on a specific date.
     * @param fecha The date to search for.
     * @return A list of nutrient events.
     */
    List<NutrientEvent> findByFecha(LocalDate fecha);

    /**
     * Finds all nutrient events after a given date.
     * @param fecha The date to search after.
     * @return A list of nutrient events.
     */
    List<NutrientEvent> findByFechaAfter(LocalDate fecha);
}
