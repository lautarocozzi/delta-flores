package DeltaFlores.web.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "notificaciones")
public class Notificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String titulo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descripcion;

    @Column(nullable = false, length = 50)
    private String tipoEvento;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    private LocalDateTime fechaLeida;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private User usuario;

    public Notificacion() {
    }

    public Notificacion(String titulo, String descripcion, String tipoEvento, User usuario) {
        this.titulo = titulo;
        this.descripcion = descripcion;
        this.tipoEvento = tipoEvento;
        this.usuario = usuario;
    }

    @Override
    public String toString() {
        return "Notificacion{" +
                "id=" + id +
                ", titulo='" + titulo + '\'' +
                ", tipoEvento='" + tipoEvento + '\'' +
                ", leida=" + (fechaLeida != null) +
                ", usuario=" + usuario.getId() +
                '}';
    }
}
