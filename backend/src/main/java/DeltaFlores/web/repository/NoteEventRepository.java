package DeltaFlores.web.repository;

import DeltaFlores.web.entities.NoteEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface NoteEventRepository extends JpaRepository<NoteEvent, Long> {

    /**
     * Finds all note events associated with a specific plant ID.
     * @param plantaId The ID of the plant.
     * @return A list of note events.
     */
    @Query("SELECT e FROM NoteEvent e JOIN e.plantas p WHERE p.id = :plantaId")
    List<NoteEvent> findByPlantaId(@Param("plantaId") Long plantaId);

    /**
     * Finds all note events on a specific date.
     * @param fecha The date to search for.
     * @return A list of note events.
     */
    List<NoteEvent> findByFecha(LocalDate fecha);

    /**
     * Finds all note events after a given date.
     * @param fecha The date to search after.
     * @return A list of note events.
     */
    List<NoteEvent> findByFechaAfter(LocalDate fecha);
}
