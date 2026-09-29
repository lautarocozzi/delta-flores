package DeltaFlores.web.dto;

import jakarta.validation.constraints.Min;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
public class UbicacionRequest implements Serializable {
    private Long zonaId;

    @Min(value = 0, message = "columna no puede ser negativa")
    private Integer columna;

    @Min(value = 0, message = "fila no puede ser negativa")
    private Integer fila;
}
