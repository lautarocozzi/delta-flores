package DeltaFlores.web.dto;


import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;

@Data
@EqualsAndHashCode(callSuper = true)
public class MeasurementEventDto extends PlantEventDto  {
    private String horasLuz;
    private Double humedad;
    private Double temperaturaAmbiente;
    private int alturaPlanta;
    private int distanciaLuz;
}
