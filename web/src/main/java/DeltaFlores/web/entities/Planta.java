package DeltaFlores.web.entities;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.List;

@Entity
@Getter
@Setter
@Table(name = "plantas")
public class Planta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    private String nombre;
    private String genetica;
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Planta.etapa etapa;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sala_id", nullable = false)
    private Sala sala;

    @CreationTimestamp
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern="yyyy-MM-dd")
    private LocalDate fechaCreacion;

    @ManyToMany (fetch = FetchType.LAZY, cascade = CascadeType.DETACH)
    @JoinTable(name = "plants_has_events",
            joinColumns = @JoinColumn(name = "plants_id"),
            inverseJoinColumns = @JoinColumn(name = "events_id"))
    private List<PlantEvent> events;

    public enum etapa {
        GERMINACION,
        PLANTIN,
        VEGETACION,
        FLORACION,
        COSECHADA
    }

}
