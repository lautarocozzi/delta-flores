package DeltaFlores.web.dto;

import DeltaFlores.web.entities.NuevaEtapa;
import DeltaFlores.web.entities.PlantEvent;
import DeltaFlores.web.entities.Planta;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
public class PlantaDto implements Serializable {
    private Long id;
    private Long userId; // ID of the user who owns the plant
    private String nombre;
    private boolean isPublic;
    private NuevaEtapa etapa;
    private Long salaId;
    private int produccion;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern="yyyy-MM-dd")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDate fechaCreacion;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern="yyyy-MM-dd")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDate fechaFin;
    private List<Long> eventIds;
    private Long cepaId;
    private String ubicacion;
}
