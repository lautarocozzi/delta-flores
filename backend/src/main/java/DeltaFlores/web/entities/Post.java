package DeltaFlores.web.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String titulo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String contenido;

    @Column(length = 500)
    private String contenidoPreview;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoPost tipoPost;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CategoriaPost categoria;

    @Column(nullable = false)
    private boolean isResuelto = false;

    @Column(nullable = false)
    private boolean isHero = false;

    @Column(nullable = false)
    private int vistas = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime fechaCreacion;

    @UpdateTimestamp
    private LocalDateTime fechaActualizacion;

    @PrePersist
    public void prePersist() {
        if (contenido != null && contenidoPreview == null) {
            contenidoPreview = contenido.length() > 500
                    ? contenido.substring(0, 500)
                    : contenido;
        }
    }

    @PreUpdate
    public void preUpdate() {
        if (contenido != null) {
            contenidoPreview = contenido.length() > 500
                    ? contenido.substring(0, 500)
                    : contenido;
        }
    }
}
