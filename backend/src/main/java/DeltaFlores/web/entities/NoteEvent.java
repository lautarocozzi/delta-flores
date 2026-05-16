package DeltaFlores.web.entities;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Entity
@Getter
@Setter
@DiscriminatorValue("NOTE")
public class NoteEvent extends PlantEvent {

    private String text;

    @ElementCollection
    private List<String> mediaUrls;
}
