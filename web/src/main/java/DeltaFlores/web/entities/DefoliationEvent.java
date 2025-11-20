package DeltaFlores.web.entities;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@DiscriminatorValue("DEFOLIATION")
public class DefoliationEvent extends PlantEvent {

    @NotNull
    @Enumerated(EnumType.STRING)
    private GradoDefoliacion gradoDefoliacion;
}
