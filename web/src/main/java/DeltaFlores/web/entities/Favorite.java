package DeltaFlores.web.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "favorites", uniqueConstraints = {
    // A user can only favorite a plant once
    @UniqueConstraint(columnNames = {"user_id", "planta_id"})
})
public class Favorite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "planta_id", nullable = false)
    private Planta planta;

    public Favorite(User user, Planta planta) {
        this.user = user;
        this.planta = planta;
    }
}
