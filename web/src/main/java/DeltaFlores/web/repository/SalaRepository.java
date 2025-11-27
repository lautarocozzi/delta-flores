package DeltaFlores.web.repository;

import DeltaFlores.web.entities.Sala;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SalaRepository extends JpaRepository<Sala, Long> {
    
    /**
     * Busca todas las salas que pertenecen a un usuario específico.
     * @param userId El ID del usuario.
     * @return Una lista de salas pertenecientes al usuario.
     */
    List<Sala> findByUserId(Long userId);
}
