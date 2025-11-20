package DeltaFlores.web.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
public class NutrienteDto implements Serializable {

    private Long id;
    private String titulo;
    private String descripcion;

    public NutrienteDto(Long id, String titulo) {
        this.id = id;
        this.titulo = titulo;
    }

}
