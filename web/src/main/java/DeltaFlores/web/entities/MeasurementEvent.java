package DeltaFlores.web.entities;

import DeltaFlores.web.entities.PlantEvent;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Entity
@DiscriminatorValue("MEASUREMENT")
@Getter
@Setter
public class MeasurementEvent extends PlantEvent {

    private String horasLuz;
    private Double humedad;
    private Double temperaturaAmbiente;
    private int alturaPlanta;
    private int distanciaLuz;

}
