package DeltaFlores.web.dto;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.List;

@Data
public abstract class PlantEventDto implements Serializable {
    private Long id;
    private LocalDate fecha;
    private List<Long> plantaIds;
}
