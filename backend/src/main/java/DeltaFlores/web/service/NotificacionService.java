package DeltaFlores.web.service;

import DeltaFlores.web.dto.NotificacionDto;
import DeltaFlores.web.entities.AppRole;
import DeltaFlores.web.entities.Notificacion;
import DeltaFlores.web.entities.User;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.NotificacionRepository;
import DeltaFlores.web.repository.UserRepository;
import DeltaFlores.web.security.CustomUserDetails;
import DeltaFlores.web.utils.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;
    private final UserRepository userRepository;

    // --- Security Helpers ---

    private Authentication getAuthentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }

    private User getCurrentUser() {
        CustomUserDetails userDetails = (CustomUserDetails) getAuthentication().getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado en el contexto de seguridad"));
    }

    // --- Queries ---

    @Transactional(readOnly = true)
    public List<NotificacionDto> getMisNotificaciones() {
        User currentUser = getCurrentUser();
        log.debug("Obteniendo notificaciones para usuario ID: {}", currentUser.getId());
        List<Notificacion> notificaciones = notificacionRepository
                .findByUsuarioIdOrderByFechaCreacionDesc(currentUser.getId());
        return notificaciones.stream()
                .map(DtoMapper::notificacionToNotificacionDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NotificacionDto> getNotificacionesNoLeidas() {
        User currentUser = getCurrentUser();
        log.debug("Obteniendo notificaciones no leídas para usuario ID: {}", currentUser.getId());
        List<Notificacion> notificaciones = notificacionRepository
                .findByUsuarioIdAndFechaLeidaIsNullOrderByFechaCreacionDesc(currentUser.getId());
        return notificaciones.stream()
                .map(DtoMapper::notificacionToNotificacionDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long countNoLeidas() {
        User currentUser = getCurrentUser();
        return notificacionRepository.countByUsuarioIdAndFechaLeidaIsNull(currentUser.getId());
    }

    // --- Commands ---

    @Transactional
    public NotificacionDto marcarComoLeida(Long notificacionId) {
        User currentUser = getCurrentUser();
        Notificacion notificacion = notificacionRepository.findById(notificacionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Notificación no encontrada con id: " + notificacionId));

        // Solo el dueño de la notificación puede marcarla como leída
        if (!notificacion.getUsuario().getId().equals(currentUser.getId())) {
            log.warn("ACCESO DENEGADO: Usuario {} intentó marcar notificación {} de otro usuario",
                    currentUser.getUsername(), notificacionId);
            throw new AccessDeniedException("No tiene permiso para modificar esta notificación.");
        }

        notificacion.setFechaLeida(LocalDateTime.now());
        Notificacion saved = notificacionRepository.save(notificacion);
        log.info("Notificación ID: {} marcada como leída por usuario ID: {}", notificacionId, currentUser.getId());
        return DtoMapper.notificacionToNotificacionDto(saved);
    }

    @Transactional
    public NotificacionDto crearNotificacion(NotificacionDto dto) {
        User destinatario = userRepository.findById(dto.getUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Usuario destinatario no encontrado con id: " + dto.getUsuarioId()));

        Notificacion notificacion = new Notificacion(
                dto.getTitulo(),
                dto.getDescripcion(),
                dto.getTipoEvento(),
                destinatario
        );

        Notificacion saved = notificacionRepository.save(notificacion);
        log.info("Notificación '{}' creada para usuario ID: {}", saved.getTitulo(), destinatario.getId());
        return DtoMapper.notificacionToNotificacionDto(saved);
    }

    @Transactional
    public List<NotificacionDto> enviarNotificacionARol(String rol, NotificacionDto dto) {
        AppRole targetRole;
        try {
            targetRole = AppRole.valueOf("ROLE_" + rol);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Rol inválido: " + rol + ". Roles válidos: GROWER, ADMIN, SUPER_ADMIN");
        }

        List<User> usuarios = userRepository.findByRol(targetRole);
        if (usuarios.isEmpty()) {
            log.warn("No hay usuarios con rol {} para enviar notificación", targetRole);
            return List.of();
        }

        log.info("Enviando notificación '{}' a {} usuarios con rol {}", dto.getTitulo(), usuarios.size(), targetRole);

        List<Notificacion> notificaciones = usuarios.stream()
                .map(u -> new Notificacion(dto.getTitulo(), dto.getDescripcion(), dto.getTipoEvento(), u))
                .collect(Collectors.toList());

        List<Notificacion> saved = notificacionRepository.saveAll(notificaciones);
        log.info("{} notificaciones enviadas a rol {}", saved.size(), targetRole);

        return saved.stream()
                .map(DtoMapper::notificacionToNotificacionDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void eliminarNotificacion(Long notificacionId) {
        Notificacion notificacion = notificacionRepository.findById(notificacionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Notificación no encontrada con id: " + notificacionId));
        notificacionRepository.delete(notificacion);
        log.info("Notificación ID: {} eliminada", notificacionId);
    }
}
