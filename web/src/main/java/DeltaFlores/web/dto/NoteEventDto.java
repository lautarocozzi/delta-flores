package DeltaFlores.web.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.web.multipart.MultipartFile;

import java.io.Serializable;
import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
public class NoteEventDto extends PlantEventDto  {
    private String text;
    private List<MultipartFile> files;
    private List<String> mediaUrls;
}
