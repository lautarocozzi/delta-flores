package DeltaFlores.web.dto;

import DeltaFlores.web.entities.NuevaEtapa;
import DeltaFlores.web.entities.PlantEvent;
import DeltaFlores.web.entities.Planta;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
    private SalaDto sala;
    private int produccion;
    private LocalDate fechaCreacion;
    private LocalDate fechaFin;
    private List<PlantEventDto> events;
    private CepaDto cepaDto;
    private String ubicacion;
}
