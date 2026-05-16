package DeltaFlores.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequestDto {

    @NotBlank(message = "El email no puede estar vacío.")
    @Email(message = "Debe proporcionar una dirección de email válida.")
    private String username;

    @NotBlank(message = "La contraseña no puede estar vacía.")
    private String password;
}
