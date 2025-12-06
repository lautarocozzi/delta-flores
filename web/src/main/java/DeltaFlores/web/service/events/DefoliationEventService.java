package DeltaFlores.web.service.events;

import DeltaFlores.web.dto.DefoliationEventDto;
import DeltaFlores.web.entities.DefoliationEvent;
import DeltaFlores.web.entities.Planta;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.DefoliationEventRepository;
import DeltaFlores.web.repository.PlantaRepository;
import DeltaFlores.web.repository.UserRepository;
import DeltaFlores.web.utils.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import DeltaFlores.web.entities.User;
import DeltaFlores.web.entities.AppRole;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Log4j2
@RequiredArgsConstructor
public class DefoliationEventService {

    private final DefoliationEventRepository defoliationEventRepository;
    private final PlantaRepository plantaRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        return userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    @Transactional
    public DefoliationEventDto createDefoliationEvent(DefoliationEventDto dto) {
        log.info("\n\n\uD83C\uDF3F Creando nuevo evento de defoliación...");
        DefoliationEvent event = new DefoliationEvent();
        event.setFecha(dto.getFecha());
        event.setGradoDefoliacion(dto.getGradoDefoliacion());

        if (dto.getPlantaIds() != null && !dto.getPlantaIds().isEmpty()) {
            List<Planta> plantas = plantaRepository.findAllById(dto.getPlantaIds());
            if (plantas.size() != dto.getPlantaIds().size()) {
                log.warn("\u26A0\uFE0F Algunos IDs de plantas no fueron encontrados al crear el evento.");
            }
            event.setPlantas(plantas);
        }

        DefoliationEvent savedEvent = defoliationEventRepository.save(event);
        log.info("\n\n\u2728 Evento de defoliación creado con ID: {}", savedEvent.getId());
        return (DefoliationEventDto) DtoMapper.plantEventToPlantEventDto(savedEvent);
    }

    @Transactional(readOnly = true)
    public DefoliationEventDto getDefoliationEventById(Long id) {
        log.info("\n\n\uD83D\uDD0E Buscando evento de defoliación con ID: {}", id);
        DefoliationEvent event = defoliationEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evento de defoliación no encontrado con id: " + id));
        return (DefoliationEventDto) DtoMapper.plantEventToPlantEventDto(event);
    }

    @Transactional(readOnly = true)
    public List<DefoliationEventDto> getAllDefoliationEvents() {
        log.info("\n\n\uD83D\uDD0E Obteniendo todos los eventos de defoliación.");
        return defoliationEventRepository.findAll().stream()
                .map(event -> (DefoliationEventDto) DtoMapper.plantEventToPlantEventDto(event))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DefoliationEventDto> getDefoliationEventsByPlantaId(Long plantaId) {
        log.info("\n\n\uD83D\uDD0E Obteniendo eventos de defoliación para la planta ID: {}", plantaId);
        return defoliationEventRepository.findByPlantaId(plantaId).stream()
                .map(event -> (DefoliationEventDto) DtoMapper.plantEventToPlantEventDto(event))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DefoliationEventDto> getDefoliationEventsByFecha(LocalDate fecha) {
        log.info("\n\n\uD83D\uDD0E Obteniendo eventos de defoliación para la fecha: {}", fecha);
        return defoliationEventRepository.findByFecha(fecha).stream()
                .map(event -> (DefoliationEventDto) DtoMapper.plantEventToPlantEventDto(event))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DefoliationEventDto> getDefoliationEventsByFechaAfter(LocalDate fecha) {
        log.info("\n\n\uD83D\uDD0E Obteniendo eventos de defoliación posteriores a la fecha: {}", fecha);
        return defoliationEventRepository.findByFechaAfter(fecha).stream()
                .map(event -> (DefoliationEventDto) DtoMapper.plantEventToPlantEventDto(event))
                .collect(Collectors.toList());
    }

    @Transactional
    public DefoliationEventDto updateDefoliationEvent(Long id, DefoliationEventDto dto) {
        log.info("\n\n\u2B06\uFE0F Actualizando evento de defoliación con ID: {}", id);
        User currentUser = getCurrentUser();
        DefoliationEvent existingEvent = defoliationEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evento de defoliación no encontrado con id: " + id));

        if (currentUser.getRol() == AppRole.ROLE_GROWER) {
            for (Planta planta : existingEvent.getPlantas()) {
                if (!planta.getUser().equals(currentUser)) {
                    throw new AccessDeniedException("No tienes permiso para actualizar este evento");
                }
            }
        }

        existingEvent.setFecha(dto.getFecha());
        existingEvent.setGradoDefoliacion(dto.getGradoDefoliacion());

        // Update associated plants if provided
        if (dto.getPlantaIds() != null) {
            List<Planta> plantas = plantaRepository.findAllById(dto.getPlantaIds());
             if (plantas.size() != dto.getPlantaIds().size()) {
                log.warn("\u26A0\uFE0F Algunos IDs de plantas no fueron encontrados al actualizar el evento.");
            }
            existingEvent.setPlantas(plantas);
        }

        DefoliationEvent updatedEvent = defoliationEventRepository.save(existingEvent);
        log.info("\n\n\u2728 Evento de defoliación con ID: {} actualizado.", updatedEvent.getId());
        return (DefoliationEventDto) DtoMapper.plantEventToPlantEventDto(updatedEvent);
    }

    @Transactional
    public void deleteDefoliationEvent(Long id) {
        log.info("\n\n\uD83D\uDDD1\uFE0F Eliminando evento de defoliación con ID: {}", id);
        User currentUser = getCurrentUser();
        DefoliationEvent event = defoliationEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evento de defoliación no encontrado con id: " + id));

        if (currentUser.getRol() == AppRole.ROLE_GROWER) {
            for (Planta planta : event.getPlantas()) {
                if (!planta.getUser().equals(currentUser)) {
                    throw new AccessDeniedException("No tienes permiso para eliminar este evento");
                }
            }
        }

        defoliationEventRepository.deleteById(id);
        log.info("\n\n\u2728 Evento de defoliación con ID: {} eliminado.", id);
    }
}
