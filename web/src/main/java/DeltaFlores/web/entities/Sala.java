package DeltaFlores.web.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@Table(name = "salas")
public class Sala {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nombre;
    private String descripcion;


            private String horasLuz;
            private Double humedad;
            private Double temperaturaAmbiente;
        
        
            @OneToMany(mappedBy = "sala", cascade = CascadeType.DETACH)
            private Set<Planta> plantas = new HashSet<>();
        
}
