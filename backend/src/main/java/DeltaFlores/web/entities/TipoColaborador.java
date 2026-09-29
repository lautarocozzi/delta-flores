package DeltaFlores.web.entities;

/**
 * Nivel de acceso de un colaborador en una sala.
 * EDITOR: acceso completo (ver, crear, editar, eliminar).
 * LECTURA: solo puede ver el contenido de la sala.
 */
public enum TipoColaborador {
    EDITOR,
    LECTURA
}
