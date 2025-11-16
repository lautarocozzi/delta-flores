package DeltaFlores.web.dto;

import DeltaFlores.web.entities.PlantEvent;
import DeltaFlores.web.entities.Planta;
import DeltaFlores.web.entities.Sala;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class PlantaDto {
    private Long id;
    private String genetica;
    private Planta.etapa etapa;
    private Sala sala;
    private LocalDate fechaCreacion;
    private String nombre;
    private List<PlantEvent> events;
}
