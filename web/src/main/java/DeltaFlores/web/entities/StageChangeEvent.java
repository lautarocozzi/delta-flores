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
@DiscriminatorValue("STAGE_CHANGE")
public class StageChangeEvent extends PlantEvent {

    @Enumerated(EnumType.STRING)
    private NuevaEtapa nuevaEtapa;
}
