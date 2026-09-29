package DeltaFlores.web.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
public class SalaColaboradorDto implements Serializable {

    private Long id;
    private Long salaId;
    private String salaNombre;
    private Long userId;
    private String userNombre;
    private String userApellido;
    private String userUsername;
    private String tipoColaborador;
}
