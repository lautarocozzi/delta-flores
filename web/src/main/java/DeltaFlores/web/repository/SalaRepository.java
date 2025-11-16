package DeltaFlores.web.repository;

import DeltaFlores.web.entities.Sala;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalaRepository extends JpaRepository<Sala, Long> {
    List<Sala> findAll();
    Optional<Sala> findById(Long id);
    Sala save(Sala category);
    void deleteById(Long id);
}
