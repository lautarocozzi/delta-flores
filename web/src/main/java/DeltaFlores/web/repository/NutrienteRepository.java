package DeltaFlores.web.repository;

import DeltaFlores.web.entities.Nutriente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NutrienteRepository extends JpaRepository<Nutriente,Long> {

    List<Nutriente> findByTitulo(String titulo);

    List<Nutriente> findByUserId(Long userId);
}
