package DeltaFlores.web.dto;

import DeltaFlores.web.entities.AppRole;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class NotificacionDto implements Serializable {

    private Long id;
    private String titulo;
    private String descripcion;
    private String tipoEvento;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaLeida;
    private boolean leida;

    // Datos del usuario destinatario
    private Long usuarioId;
    private String usuarioNombre;
    private String usuarioApellido;
    private String usuarioUsername;
    private AppRole usuarioRol;
}
