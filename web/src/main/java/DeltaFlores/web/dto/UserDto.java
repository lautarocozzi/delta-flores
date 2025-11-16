package DeltaFlores.web.dto;


import DeltaFlores.web.entities.User.Rol;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.io.Serializable;
import java.time.LocalDate;

@Data
@Getter
@Setter
@NoArgsConstructor
public class UserDto implements Serializable {
    private Long id;
    private String username;
    private String nombre;
    private String apellido;
    @JsonIgnore
    private String password;
    @Enumerated(EnumType.STRING)
    private Rol rol;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern="yyyy-MM-dd")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDate fechaRegistro;

}
