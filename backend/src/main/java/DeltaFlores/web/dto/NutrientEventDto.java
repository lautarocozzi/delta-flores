package DeltaFlores.web.dto;

import DeltaFlores.web.entities.Nutriente;
import DeltaFlores.web.entities.TipoNutriente;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class NutrientEventDto extends PlantEventDto {
private NutrienteDto nutriente;
}
