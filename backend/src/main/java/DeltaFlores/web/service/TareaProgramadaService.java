package DeltaFlores.web.service;

import DeltaFlores.web.dto.TareaProgramadaDto;
import DeltaFlores.web.entities.*;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.*;
import DeltaFlores.web.security.CustomUserDetails;
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
@Log4j2
@RequiredArgsConstructor
public class TareaProgramadaService {

    private final TareaProgramadaRepository tareaRepository;
    private final UserRepository userRepository;
    private final SalaRepository salaRepository;
    private final PlantaRepository plantaRepository;
    private final NotificacionRepository notificacionRepository;

    private Authentication getAuthentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }

    private User getCurrentUser() {
        CustomUserDetails userDetails = (CustomUserDetails) getAuthentication().getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    @Transactional(readOnly = true)
    public List<TareaProgramadaDto> getMisTareas() {
        User currentUser = getCurrentUser();
        return tareaRepository.findByCreadorIdOrUsuarioDestinoIdOrderByFechaProgramadaDesc(
                currentUser.getId(), currentUser.getId()
        ).stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TareaProgramadaDto> getTareasPendientes() {
        User currentUser = getCurrentUser();
        return tareaRepository.findByUsuarioDestinoIdOrderByFechaProgramadaDesc(currentUser.getId())
                .stream().filter(TareaProgramada::isActiva).map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public TareaProgramadaDto createTarea(TareaProgramadaDto dto) {
        User currentUser = getCurrentUser();
        TareaProgramada tarea = new TareaProgramada();
        tarea.setTitulo(dto.getTitulo());
        tarea.setDescripcion(dto.getDescripcion());
        tarea.setRecurrencia(TipoRecurrencia.valueOf(dto.getRecurrencia()));
        tarea.setFechaProgramada(dto.getFechaProgramada());
        tarea.setFechaProximaEjecucion(dto.getFechaProgramada());
        tarea.setActiva(true);
        tarea.setCreador(currentUser);

        if (dto.getUsuarioDestinoId() != null) {
            tarea.setUsuarioDestino(userRepository.findById(dto.getUsuarioDestinoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Usuario destino no encontrado")));
        } else {
            tarea.setUsuarioDestino(currentUser);
        }
        if (dto.getSalaAsociadaId() != null) {
            tarea.setSalaAsociada(salaRepository.findById(dto.getSalaAsociadaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sala no encontrada")));
        }
        if (dto.getPlantaAsociadaId() != null) {
            tarea.setPlantaAsociada(plantaRepository.findById(dto.getPlantaAsociadaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Planta no encontrada")));
        }
        if (dto.getColaboradorAsignadoId() != null) {
            tarea.setColaboradorAsignado(userRepository.findById(dto.getColaboradorAsignadoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Colaborador no encontrado")));
        }

        TareaProgramada saved = tareaRepository.save(tarea);
        log.info("Tarea programada creada: {} por {}", saved.getTitulo(), currentUser.getUsername());
        return toDto(saved);
    }

    @Transactional
    public TareaProgramadaDto updateTarea(Long id, TareaProgramadaDto dto) {
        User currentUser = getCurrentUser();
        TareaProgramada tarea = tareaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tarea no encontrada con id: " + id));
        if (!tarea.getCreador().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Solo el creador puede editar esta tarea.");
        }
        tarea.setTitulo(dto.getTitulo());
        tarea.setDescripcion(dto.getDescripcion());
        tarea.setRecurrencia(TipoRecurrencia.valueOf(dto.getRecurrencia()));
        tarea.setFechaProgramada(dto.getFechaProgramada());
        tarea.setFechaProximaEjecucion(dto.getFechaProgramada());

        if (dto.getUsuarioDestinoId() != null) {
            tarea.setUsuarioDestino(userRepository.findById(dto.getUsuarioDestinoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Usuario destino no encontrado")));
        }
        if (dto.getSalaAsociadaId() != null) {
            tarea.setSalaAsociada(salaRepository.findById(dto.getSalaAsociadaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sala no encontrada")));
        } else {
            tarea.setSalaAsociada(null);
        }
        if (dto.getPlantaAsociadaId() != null) {
            tarea.setPlantaAsociada(plantaRepository.findById(dto.getPlantaAsociadaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Planta no encontrada")));
        } else {
            tarea.setPlantaAsociada(null);
        }
        if (dto.getColaboradorAsignadoId() != null) {
            tarea.setColaboradorAsignado(userRepository.findById(dto.getColaboradorAsignadoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Colaborador no encontrado")));
        } else {
            tarea.setColaboradorAsignado(null);
        }
        return toDto(tareaRepository.save(tarea));
    }

    @Transactional
    public TareaProgramadaDto toggleActiva(Long id) {
        User currentUser = getCurrentUser();
        TareaProgramada tarea = tareaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tarea no encontrada con id: " + id));
        if (!tarea.getCreador().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Solo el creador puede activar/desactivar esta tarea.");
        }
        tarea.setActiva(!tarea.isActiva());
        if (tarea.isActiva()) {
            tarea.setFechaProximaEjecucion(tarea.getFechaProgramada());
        }
        return toDto(tareaRepository.save(tarea));
    }

    @Transactional
    public void deleteTarea(Long id) {
        User currentUser = getCurrentUser();
        TareaProgramada tarea = tareaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tarea no encontrada con id: " + id));
        if (!tarea.getCreador().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Solo el creador puede eliminar esta tarea.");
        }
        tareaRepository.deleteById(id);
        log.info("Tarea programada eliminada: {} por {}", tarea.getTitulo(), currentUser.getUsername());
    }

    @Transactional
    public void processDueTasks() {
        List<TareaProgramada> dueTasks = tareaRepository.findDueTasks(LocalDateTime.now());
        for (TareaProgramada tarea : dueTasks) {
            try {
                Notificacion notificacion = new Notificacion(
                        tarea.getTitulo(), tarea.getDescripcion(), "TAREA_PROGRAMADA", tarea.getUsuarioDestino());
                notificacionRepository.save(notificacion);

                switch (tarea.getRecurrencia()) {
                    case DIARIA -> tarea.setFechaProximaEjecucion(tarea.getFechaProximaEjecucion().plusDays(1));
                    case SEMANAL -> tarea.setFechaProximaEjecucion(tarea.getFechaProximaEjecucion().plusWeeks(1));
                    case MENSUAL -> tarea.setFechaProximaEjecucion(tarea.getFechaProximaEjecucion().plusMonths(1));
                    default -> {
                        tarea.setActiva(false);
                        tarea.setFechaProximaEjecucion(null);
                    }
                }
                tareaRepository.save(tarea);
                log.info("Tarea procesada: {} -> notif a {}", tarea.getTitulo(), tarea.getUsuarioDestino().getUsername());
            } catch (Exception e) {
                log.error("Error procesando tarea {}: {}", tarea.getId(), e.getMessage(), e);
            }
        }
    }

    private TareaProgramadaDto toDto(TareaProgramada t) {
        TareaProgramadaDto dto = new TareaProgramadaDto();
        dto.setId(t.getId());
        dto.setTitulo(t.getTitulo());
        dto.setDescripcion(t.getDescripcion());
        dto.setRecurrencia(t.getRecurrencia().name());
        dto.setFechaProgramada(t.getFechaProgramada());
        dto.setFechaProximaEjecucion(t.getFechaProximaEjecucion());
        dto.setActiva(t.isActiva());
        dto.setFechaCreacion(t.getFechaCreacion());
        if (t.getCreador() != null) {
            dto.setCreadorId(t.getCreador().getId());
            dto.setCreadorUsername(t.getCreador().getUsername());
        }
        if (t.getUsuarioDestino() != null) {
            dto.setUsuarioDestinoId(t.getUsuarioDestino().getId());
            dto.setUsuarioDestinoUsername(t.getUsuarioDestino().getUsername());
        }
        if (t.getSalaAsociada() != null) {
            dto.setSalaAsociadaId(t.getSalaAsociada().getId());
            dto.setSalaAsociadaNombre(t.getSalaAsociada().getNombre());
        }
        if (t.getPlantaAsociada() != null) {
            dto.setPlantaAsociadaId(t.getPlantaAsociada().getId());
            dto.setPlantaAsociadaNombre(t.getPlantaAsociada().getNombre());
        }
        if (t.getColaboradorAsignado() != null) {
            dto.setColaboradorAsignadoId(t.getColaboradorAsignado().getId());
            dto.setColaboradorAsignadoUsername(t.getColaboradorAsignado().getUsername());
            dto.setColaboradorAsignadoNombre(t.getColaboradorAsignado().getNombre());
        }
        return dto;
    }
}
