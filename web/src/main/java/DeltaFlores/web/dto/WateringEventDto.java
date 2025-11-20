package DeltaFlores.web.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class WateringEventDto extends PlantEventDto {
    private double phAgua;
    private double ecAgua;
    private double tempAgua;

}
