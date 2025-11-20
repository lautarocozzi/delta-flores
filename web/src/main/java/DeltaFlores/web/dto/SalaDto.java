package DeltaFlores.web.dto;

import DeltaFlores.web.entities.Planta;
import jakarta.persistence.CascadeType;
import jakarta.persistence.OneToMany;
import lombok.Data;

import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;

@Data
public class SalaDto implements Serializable {
    private Long id;
    private String nombre;
    private String descripcion;

    private String horasLuz;
    private Double humedad;
    private Double temperaturaAmbiente;

    private Set<PlantaDto> plantas = new HashSet<>();


}
