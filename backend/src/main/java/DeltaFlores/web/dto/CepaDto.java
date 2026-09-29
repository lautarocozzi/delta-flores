package DeltaFlores.web.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
public class CepaDto implements Serializable {

    private Long id;
    private String geneticaParental;
    private String dominancia;
    private String aromaSabor;
    private String thc;
    private String cbd;
    private String detalle;
    private String abreviatura;
    private Long userId;

}
