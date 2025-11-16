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

    private Integer phAgua;
    private Integer ecAgua;
    private Integer tempAgua;
}
