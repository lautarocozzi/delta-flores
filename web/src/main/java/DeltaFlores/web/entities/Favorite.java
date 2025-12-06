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
    // A user can only favorite a specific item of a specific type once
    @UniqueConstraint(columnNames = {"user_id", "favorable_id", "favorable_type"})
})
public class Favorite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "favorable_id", nullable = false)
    private Long favorableId;

    @Column(name = "favorable_type", nullable = false)
    private String favorableType;

    public Favorite(User user, Long favorableId, String favorableType) {
        this.user = user;
        this.favorableId = favorableId;
        this.favorableType = favorableType;
    }
}
