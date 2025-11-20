package DeltaFlores.web.dto;

import DeltaFlores.web.entities.NuevaEtapa;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

@Data
@EqualsAndHashCode(callSuper = true)

public class StageChangeEventDto extends PlantEventDto{
    private NuevaEtapa nuevaEtapa;
}
