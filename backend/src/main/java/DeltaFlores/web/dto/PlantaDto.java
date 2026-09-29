package DeltaFlores.web.dto;

import DeltaFlores.web.entities.NuevaEtapa;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
public class PlantaDto implements Serializable {
    private Long id;
    private Long userId; // ID of the user who owns the plant

    @NotBlank(message = "El nombre de la planta es requerido")
    @Size(max = 100, message = "El nombre no puede superar los 100 caracteres")
    private String nombre;

    @JsonProperty("isPublic")
    private boolean isPublic;

    @NotNull(message = "La etapa es requerida")
    private NuevaEtapa etapa;

    @NotNull(message = "La sala es requerida")
    private Long salaId;

    @Min(value = 0, message = "La producción no puede ser negativa")
    private int produccion;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate fechaCreacion;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate fechaFin;

    private List<Long> eventIds;

    @NotNull(message = "La cepa es requerida")
    private Long cepaId;

    private Long zonaId;
    private String zonaNombre;

    @Min(value = 0, message = "columnaEnZona no puede ser negativo")
    private Integer columnaEnZona;

    @Min(value = 0, message = "filaEnZona no puede ser negativo")
    private Integer filaEnZona;

    private String ubicacion;

    private String imagenUrl;

    // Enriched: number of users who favorited this plant (only populated in specific endpoints)
    private int favoriteCount;

    // Nested objects for frontend display
    private SalaDto sala;
    private CepaDto cepaDto;
}
