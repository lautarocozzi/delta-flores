package DeltaFlores.web.dto;

import DeltaFlores.web.entities.GradoDefoliacion;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;
@Data
@EqualsAndHashCode(callSuper = true)
public class DefoliationEventDto extends PlantEventDto {
    private GradoDefoliacion gradoDefoliacion;
}
