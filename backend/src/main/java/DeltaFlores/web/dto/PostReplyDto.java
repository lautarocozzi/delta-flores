package DeltaFlores.web.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class PostReplyDto implements Serializable {
    private Long id;
    private String contenido;
    private Long postId;

    // Author info
    private Long userId;
    private String userUsername;
    private String userNombre;
    private String userApellido;
    private String userImagenUrl;

    @JsonProperty("isSolucion")
    private boolean isSolucion;

    // Computed
    private int upCount;
    private int downCount;
    private int score;
    private String currentUserVote; // "UP", "DOWN", or null

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaCreacion;
}
