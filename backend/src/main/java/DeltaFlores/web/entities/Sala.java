package DeltaFlores.web.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
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

    // Nuevo: Tipo de ambiente (INTERIOR o EXTERIOR)
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_ambiente")
    private TipoAmbiente tipoAmbiente;

    // Nuevo: URL de imagen personalizada para la sala
    @Column(name = "imagen_url")
    private String imagenUrl;

    @Column(name = "is_public", nullable = false)
    private boolean isPublic = false;

    @Column(name = "is_pinned", nullable = false)
    private boolean isPinned = false;

    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    @UpdateTimestamp
    @Column(name = "fecha_modificacion")
    private LocalDateTime fechaModificacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonBackReference
    private User user;

    @OneToMany(mappedBy = "sala", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private Set<Planta> plantas = new HashSet<>();

    @OneToMany(mappedBy = "sala", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("sala-zonas")
    private List<Zona> zonas = new ArrayList<>();

    @OneToMany(mappedBy = "sala", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<SalaColaborador> colaboradores = new HashSet<>();

}
