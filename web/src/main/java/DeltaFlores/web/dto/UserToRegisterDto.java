package DeltaFlores.web.dto;

import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Data
@Getter
@Setter
@NoArgsConstructor
public class UserToRegisterDto {
    private Long id;
    private String nombre;
    private String apellido;
    private String email;
    private String password;

    public UserToRegisterDto(Long id, String nombre, String apellido, String email, String password) {
        this.nombre = nombre;
        this.apellido = apellido;
        this.email = email;
        this.password = password;
    }

}
