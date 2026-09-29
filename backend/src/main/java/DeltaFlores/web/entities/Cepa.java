package DeltaFlores.web.entities;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Table(name = "cepas")
public class Cepa {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String geneticaParental;
    private String dominancia;
    private String aromaSabor;
    private String thc;
    private String cbd;
    private String detalle;

    // TODO: Add NOT NULL constraint after backfilling existing rows
    @Column(unique = true, length = 10)
    private String abreviatura;

    @OneToMany(mappedBy = "cepa", fetch = FetchType.LAZY)
    private List<Planta> plantas = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;


    @Override
    public String toString() {
        return "Cepa{" +
                "id=" + id +
                ", geneticaParental='" + geneticaParental + '\'' +
                ", dominancia='" + dominancia + '\'' +
                ", aromaSabor='" + aromaSabor + '\'' +
                ", thc='" + thc + '\'' +
                ", cbd='" + cbd + '\'' +
                ", detalle='" + detalle + '\'' +
                '}';
    }
}
