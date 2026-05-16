package DeltaFlores.web.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@DiscriminatorValue("NUTRIENT")
public class NutrientEvent extends PlantEvent {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nutriente_id")
    private Nutriente nutriente;

}
