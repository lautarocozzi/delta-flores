package DeltaFlores.web.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class TareaProgramadaDto implements Serializable {
    private Long id;
    private String titulo;
    private String descripcion;
    private String recurrencia; // NINGUNA, DIARIA, SEMANAL, MENSUAL
    private LocalDateTime fechaProgramada;
    private LocalDateTime fechaProximaEjecucion;

    @JsonProperty("isActiva")
    private boolean isActiva;

    private Long creadorId;
    private String creadorUsername;
    private Long usuarioDestinoId;
    private String usuarioDestinoUsername;
    private Long salaAsociadaId;
    private String salaAsociadaNombre;
    private Long plantaAsociadaId;
    private String plantaAsociadaNombre;
    private Long colaboradorAsignadoId;
    private String colaboradorAsignadoUsername;
    private String colaboradorAsignadoNombre;
    private LocalDateTime fechaCreacion;
}
