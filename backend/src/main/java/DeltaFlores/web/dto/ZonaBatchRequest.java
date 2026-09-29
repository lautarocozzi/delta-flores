package DeltaFlores.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class ZonaBatchRequest {

    @NotEmpty(message = "La lista de zonas no puede estar vacía")
    @Size(max = 25, message = "Máximo 25 zonas por lote")
    private List<@Valid ZonaBatchItemDto> zonas;
}
