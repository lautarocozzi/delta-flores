package DeltaFlores.web.repository;

import DeltaFlores.web.entities.SalaColaborador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SalaColaboradorRepository extends JpaRepository<SalaColaborador, Long> {

    List<SalaColaborador> findBySalaId(Long salaId);

    List<SalaColaborador> findByUserId(Long userId);

    boolean existsBySalaIdAndUserId(Long salaId, Long userId);

    void deleteBySalaIdAndUserId(Long salaId, Long userId);

    java.util.Optional<SalaColaborador> findBySalaIdAndUserId(Long salaId, Long userId);

    /**
     * Find all unique collaborators from salas where the given userId is the owner.
     * Returns collaborators (not the owner themselves).
     */
    @Query("SELECT DISTINCT sc FROM SalaColaborador sc JOIN FETCH sc.user u JOIN FETCH sc.sala s WHERE s.user.id = :ownerId ORDER BY s.nombre, u.username")
    List<SalaColaborador> findColaboradoresByOwnerId(@Param("ownerId") Long ownerId);
}
