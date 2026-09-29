package DeltaFlores.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@NoArgsConstructor
public class ZonaDto implements Serializable {

    private Long id;
    private Long salaId;
    private String salaNombre;
    private String nombre;

    @Min(value = 0, message = "posicionX debe ser >= 0")
    @Max(value = 100, message = "posicionX debe ser <= 100")
    private int posicionX;

    @Min(value = 0, message = "posicionY debe ser >= 0")
    @Max(value = 100, message = "posicionY debe ser <= 100")
    private int posicionY;

    @Min(value = 1, message = "columnas mínimo 1")
    @Max(value = 20, message = "columnas máximo 20")
    private int columnas;

    @Min(value = 1, message = "filas mínimo 1")
    @Max(value = 20, message = "filas máximo 20")
    private int filas;

    private List<Long> plantaIds;
}
