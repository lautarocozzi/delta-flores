package DeltaFlores.web.dto;

import DeltaFlores.web.dto.PlantaDto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

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

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate registryDate;
    private Set<PlantaDto> plantas = new HashSet<>();

    public UserToRegisterDto(Long id, String nombre, String apellido, String email, String password, LocalDate fechaRegistro) {
        this.nombre = nombre;
        this.apellido = apellido;
        this.email = email;
        this.password = password;
        this.registryDate = fechaRegistro;
    }

}
