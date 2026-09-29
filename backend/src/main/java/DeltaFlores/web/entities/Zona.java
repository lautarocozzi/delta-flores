package DeltaFlores.web.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Table(name = "zonas")
public class Zona {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sala_id", nullable = false)
    @JsonBackReference("sala-zonas")
    private Sala sala;

    @Column(nullable = false)
    private String nombre;

    @Min(value = 0, message = "posicionX debe ser >= 0")
    @Max(value = 100, message = "posicionX debe ser <= 100")
    @Column(name = "posicion_x", nullable = false)
    private int posicionX;

    @Min(value = 0, message = "posicionY debe ser >= 0")
    @Max(value = 100, message = "posicionY debe ser <= 100")
    @Column(name = "posicion_y", nullable = false)
    private int posicionY;

    @Min(value = 1, message = "columnas mínimo 1")
    @Max(value = 20, message = "columnas máximo 20")
    @Column(nullable = false)
    private int columnas;

    @Min(value = 1, message = "filas mínimo 1")
    @Max(value = 20, message = "filas máximo 20")
    @Column(nullable = false)
    private int filas;

    @OneToMany(mappedBy = "zona", fetch = FetchType.LAZY)
    private List<Planta> plantas = new ArrayList<>();

    @Override
    public String toString() {
        return "Zona{" +
                "id=" + id +
                ", nombre='" + nombre + '\'' +
                ", posicionX=" + posicionX +
                ", posicionY=" + posicionY +
                ", columnas=" + columnas +
                ", filas=" + filas +
                '}';
    }
}
