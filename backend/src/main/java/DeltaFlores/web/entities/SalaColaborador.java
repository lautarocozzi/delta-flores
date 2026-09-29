package DeltaFlores.web.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "sala_colaboradores",
       uniqueConstraints = @UniqueConstraint(columnNames = {"sala_id", "user_id"}))
public class SalaColaborador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sala_id", nullable = false)
    private Sala sala;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_colaborador", nullable = false)
    private TipoColaborador tipoColaborador = TipoColaborador.EDITOR;

    public SalaColaborador() {
    }

    public SalaColaborador(Sala sala, User user) {
        this.sala = sala;
        this.user = user;
        this.tipoColaborador = TipoColaborador.EDITOR;
    }

    public SalaColaborador(Sala sala, User user, TipoColaborador tipoColaborador) {
        this.sala = sala;
        this.user = user;
        this.tipoColaborador = tipoColaborador;
    }
}
