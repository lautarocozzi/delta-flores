package DeltaFlores.web.dto;

import DeltaFlores.web.entities.TipoAmbiente;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Data
public class SalaDto implements Serializable {
    private Long id;
    private String nombre;
    private String descripcion;
    private Long userId; // ID of the user who owns the sala
    private String ownerUsername; // Username of the sala owner

    private String horasLuz;
    private Double humedad;
    private Double temperaturaAmbiente;

    // Nuevo: Tipo de ambiente (INTERIOR o EXTERIOR)
    private TipoAmbiente tipoAmbiente;

    // Nuevo: URL de imagen personalizada para la sala
    private String imagenUrl;

    @JsonProperty("isPublic")
    private boolean isPublic;

    @JsonProperty("isPinned")
    private boolean isPinned;

    private LocalDateTime fechaModificacion;

    private Set<Long> plantaIds = new HashSet<>();

    // Tipo de colaboración del usuario actual en esta sala (null si es owner)
    private String tipoColaborador;
}
