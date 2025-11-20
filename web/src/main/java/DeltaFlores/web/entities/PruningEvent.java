package DeltaFlores.web.entities;

import jakarta.persistence.*;
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

    
