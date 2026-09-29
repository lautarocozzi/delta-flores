package DeltaFlores.web.dto;

import DeltaFlores.web.entities.CategoriaPost;
import DeltaFlores.web.entities.TipoPost;
import lombok.Data;

import java.io.Serializable;

@Data
public class PostCreateDto implements Serializable {
    private String titulo;
    private String contenido;
    private TipoPost tipoPost;
    private CategoriaPost categoria;
}
