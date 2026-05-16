package DeltaFlores.web.dto;

import DeltaFlores.web.entities.AppRole;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateUserRoleRequestDto {
    @NotNull(message = "El rol no puede ser nulo.")
    private AppRole role;
}
