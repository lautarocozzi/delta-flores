package DeltaFlores.web.controller;

import DeltaFlores.web.dto.NotificacionDto;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.service.NotificacionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notificaciones")
@RequiredArgsConstructor
@Log4j2
public class NotificacionController {

    private final NotificacionService notificacionService;

    // ─── Mis notificaciones (cualquier usuario autenticado) ───

    @GetMapping
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<NotificacionDto>> getMisNotificaciones() {
        log.info("Solicitud para obtener notificaciones del usuario actual");
        try {
            List<NotificacionDto> notificaciones = notificacionService.getMisNotificaciones();
            return ResponseEntity.ok(notificaciones);
        } catch (Exception e) {
            log.error("Error al obtener notificaciones: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/no-leidas")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<NotificacionDto>> getNotificacionesNoLeidas() {
        log.info("Solicitud para obtener notificaciones no leídas del usuario actual");
        try {
            List<NotificacionDto> notificaciones = notificacionService.getNotificacionesNoLeidas();
            return ResponseEntity.ok(notificaciones);
        } catch (Exception e) {
            log.error("Error al obtener notificaciones no leídas: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/no-leidas/count")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Long> countNoLeidas() {
        log.info("Solicitud para contar notificaciones no leídas");
        try {
            long count = notificacionService.countNoLeidas();
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            log.error("Error al contar notificaciones no leídas: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}/leer")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<NotificacionDto> marcarComoLeida(@PathVariable Long id) {
        log.info("Solicitud para marcar notificación ID: {} como leída", id);
        try {
            NotificacionDto notificacion = notificacionService.marcarComoLeida(id);
            return ResponseEntity.ok(notificacion);
        } catch (ResourceNotFoundException e) {
            log.warn("Notificación ID {} no encontrada.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (AccessDeniedException e) {
            log.warn("Acceso denegado a notificación ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            log.error("Error al marcar notificación ID {} como leída: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ─── Crear notificación (SUPER_ADMIN only) ───

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<NotificacionDto> crearNotificacion(@RequestBody NotificacionDto dto) {
        log.info("Solicitud para crear notificación para usuario ID: {}", dto.getUsuarioId());
        try {
            NotificacionDto created = notificacionService.crearNotificacion(dto);
            log.info("Notificación creada con ID: {}", created.getId());
            return new ResponseEntity<>(created, HttpStatus.CREATED);
        } catch (ResourceNotFoundException e) {
            log.warn("Recurso no encontrado al crear notificación: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error al crear notificación: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ─── Enviar notificación a todo un rol (SUPER_ADMIN only) ───

    @PostMapping("/enviar-a-rol/{rol}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> enviarNotificacionARol(
            @PathVariable String rol,
            @RequestBody NotificacionDto dto) {
        log.info("Solicitud para enviar notificación a rol: {}", rol);
        try {
            List<NotificacionDto> notificaciones = notificacionService.enviarNotificacionARol(rol, dto);
            log.info("Notificación enviada a {} usuarios con rol {}", notificaciones.size(), rol);
            return new ResponseEntity<>(notificaciones, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            log.warn("Rol inválido: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error al enviar notificación a rol {}: {}", rol, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ─── Eliminar notificación (SUPER_ADMIN only) ───

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> eliminarNotificacion(@PathVariable Long id) {
        log.info("Solicitud para eliminar notificación ID: {}", id);
        try {
            notificacionService.eliminarNotificacion(id);
            log.info("Notificación ID: {} eliminada.", id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            log.warn("Notificación ID {} no encontrada.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error al eliminar notificación ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
