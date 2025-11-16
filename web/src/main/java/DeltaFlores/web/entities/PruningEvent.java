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
@DiscriminatorValue("PRUNING")
public class PruningEvent extends PlantEvent {

    @Enumerated(EnumType.STRING)
    private TipoPoda tipoPoda;
}
