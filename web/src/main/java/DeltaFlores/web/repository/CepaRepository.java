package DeltaFlores.web.repository;

import DeltaFlores.web.entities.Cepa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CepaRepository extends JpaRepository<Cepa,Long> {
    Optional<Cepa> findById(Long id);

    List<Cepa> findByUserId(Long userId);
    
    List<Cepa> findByGeneticaParentalContaining(String palabraClave);
    List<Cepa> findByDominanciaContaining(String palabraClave);
    List<Cepa> findByDetalleContaining(String palabraClave);
}
