package DeltaFlores.web.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Data
public class NoteEventDto {
    private String text;
    private List<MultipartFile> files;
}
