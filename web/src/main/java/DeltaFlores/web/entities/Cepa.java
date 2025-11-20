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

    @OneToMany(mappedBy = "cepa", fetch = FetchType.LAZY)
    private List<Planta> plantas = new ArrayList<>();


    @Override
    public String toString() {
        return "Semilla{" +
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
