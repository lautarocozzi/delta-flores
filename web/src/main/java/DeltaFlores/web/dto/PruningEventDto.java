package DeltaFlores.web.dto;

import DeltaFlores.web.entities.TipoPoda;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)

public class PruningEventDto extends PlantEventDto {
    private TipoPoda tipoPoda;
}
