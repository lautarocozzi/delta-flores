package DeltaFlores.web.repository;

import DeltaFlores.web.entities.PlantEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlantEventRepository extends JpaRepository<PlantEvent, Long> {
    // @Query("SELECT e FROM PlantEvent e WHERE e.plantas IS EMPTY")
    // List<PlantEvent> findEventosSinPlantas();
    List<PlantEvent> findByPlantasIsEmpty();
    void deleteAll(List<PlantEvent> events);

}
