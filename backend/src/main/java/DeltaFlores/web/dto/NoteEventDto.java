package DeltaFlores.web.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;
import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
public class NoteEventDto extends PlantEventDto {
    private String text;
    private List<String> mediaUrls;
}
