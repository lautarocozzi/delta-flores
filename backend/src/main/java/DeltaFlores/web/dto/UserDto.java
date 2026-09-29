package DeltaFlores.web.dto;


import DeltaFlores.web.entities.AppRole;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.io.Serializable;
import java.time.LocalDate;

@Data
@NoArgsConstructor
public class UserDto implements Serializable {

    private Long id;

    private String username;

    private String email;

    private String nombre;

    private String apellido;

    private String imagenUrl;

    @JsonIgnore
    private String password;

    @Enumerated(EnumType.STRING)
    private AppRole rol;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern="yyyy-MM-dd")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate fechaRegistro;

    public UserDto(String nombre, String apellido, String username, String email, AppRole rol, String password, LocalDate registryDate) {
        this.nombre = nombre;
        this.apellido = apellido;
        this.username = username;
        this.email = email;
        this.rol = rol;
        this.password= password;
        this.fechaRegistro= registryDate;
    }

}
