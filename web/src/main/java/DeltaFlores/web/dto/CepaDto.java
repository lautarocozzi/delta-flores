package DeltaFlores.web.dto;

import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.List;

@Data
@Getter
@Setter
@NoArgsConstructor
public class CepaDto implements Serializable {

    private Long id;
    private String geneticaParental;
    private String Dominancia;
    private String AromaSabor;
    private String thc;
    private String cbd;
    private String detalle;
    private Long userId;
    
}
