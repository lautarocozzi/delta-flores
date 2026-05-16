package DeltaFlores.web.entities;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@DiscriminatorValue("WATERING")
public class WateringEvent extends PlantEvent {

    private double phAgua;
    private double ecAgua;
    private double tempAgua;


}
