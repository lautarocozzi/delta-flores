package DeltaFlores.web.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
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
        
            @ManyToOne(fetch = FetchType.LAZY)
            @JoinColumn(name = "user_id", nullable = false)
            @JsonBackReference
            private User user;
        
            @OneToMany(mappedBy = "sala", cascade = CascadeType.DETACH)
            private Set<Planta> plantas = new HashSet<>();
        
}
