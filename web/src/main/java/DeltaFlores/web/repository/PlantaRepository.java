package DeltaFlores.web.repository;

import DeltaFlores.web.entities.Planta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlantaRepository extends JpaRepository<Planta, Long> {

    List<Planta> findAll();
    Optional<Planta> findById(Long id);
    Planta save (Planta product);
    void deleteById(Long id);
    List<Planta> findByNombre(String palabraClave);
    List<Planta> findBySalaId(Long salaId);
}
