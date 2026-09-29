package DeltaFlores.web.dto;

import DeltaFlores.web.entities.CategoriaPost;
import DeltaFlores.web.entities.TipoPost;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class PostDto implements Serializable {
    private Long id;
    private String titulo;
    private String contenido;
    private String contenidoPreview;
    private TipoPost tipoPost;
    private CategoriaPost categoria;
    @JsonProperty("isResuelto")
    private boolean isResuelto;
    @JsonProperty("isHero")
    private boolean isHero;
    private int vistas;

    // Author info
    private Long userId;
    private String userUsername;
    private String userNombre;
    private String userApellido;
    private String userImagenUrl;

    // Computed
    private int upCount;
    private int downCount;
    private int score;
    private int replyCount;
    private String currentUserVote; // "UP", "DOWN", or null

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaCreacion;
}
