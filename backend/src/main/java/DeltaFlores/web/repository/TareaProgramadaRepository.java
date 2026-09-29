package DeltaFlores.web.repository;

import DeltaFlores.web.entities.TareaProgramada;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TareaProgramadaRepository extends JpaRepository<TareaProgramada, Long> {

    List<TareaProgramada> findByCreadorIdOrderByFechaProgramadaDesc(Long creadorId);

    List<TareaProgramada> findByUsuarioDestinoIdOrderByFechaProgramadaDesc(Long usuarioDestinoId);

    List<TareaProgramada> findByCreadorIdOrUsuarioDestinoIdOrderByFechaProgramadaDesc(Long userId, Long userId2);

    @Query("SELECT t FROM TareaProgramada t WHERE t.activa = true AND t.fechaProximaEjecucion <= :now")
    List<TareaProgramada> findDueTasks(@Param("now") LocalDateTime now);
}
