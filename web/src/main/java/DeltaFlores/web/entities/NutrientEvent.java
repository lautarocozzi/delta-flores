package DeltaFlores.web.entities;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@DiscriminatorValue("NUTRIENT")
public class NutrientEvent extends PlantEvent {

    @Enumerated(EnumType.STRING)
    private TipoNutriente tipoNutriente;
}
