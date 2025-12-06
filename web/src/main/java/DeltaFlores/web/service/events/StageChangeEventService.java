package DeltaFlores.web.service.events;

import DeltaFlores.web.dto.StageChangeEventDto;
import DeltaFlores.web.entities.Planta;
import DeltaFlores.web.entities.StageChangeEvent;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.PlantaRepository;
import DeltaFlores.web.repository.StageChangeEventRepository;
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
public class StageChangeEventService {

    private final StageChangeEventRepository stageChangeEventRepository;
    private final PlantaRepository plantaRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        return userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    @Transactional
    public StageChangeEventDto createStageChangeEvent(StageChangeEventDto dto) {
        log.info("\n\n🌽 Creando nuevo evento de cambio de etapa...");
        StageChangeEvent event = new StageChangeEvent();
        event.setFecha(dto.getFecha());
        event.setNuevaEtapa(dto.getNuevaEtapa());

        if (dto.getPlantaIds() != null && !dto.getPlantaIds().isEmpty()) {
            List<Planta> plantas = plantaRepository.findAllById(dto.getPlantaIds());
            if (plantas.isEmpty()) {
                throw new ResourceNotFoundException("No se encontraron plantas con los IDs proporcionados.");
            }
            if (plantas.size() != dto.getPlantaIds().size()) {
                log.warn("\u26A0️ Algunos IDs de plantas no fueron encontrados al crear el evento.");
            }
            event.setPlantas(plantas);
            // Update planta's etapa
            for (Planta planta : plantas) {
                planta.setEtapa(dto.getNuevaEtapa());
                plantaRepository.save(planta); // Save the updated planta
                log.info("\n\n✅ Etapa de planta {} actualizada a {}.", planta.getNombre(), dto.getNuevaEtapa());
            }
        } else {
            log.warn("\u26A0️ Creando un evento de cambio de etapa sin plantas asociadas.");
        }

        StageChangeEvent savedEvent = stageChangeEventRepository.save(event);
        log.info("\n\n✨ Evento de cambio de etapa creado con ID: {}", savedEvent.getId());
        return (StageChangeEventDto) DtoMapper.plantEventToPlantEventDto(savedEvent);
    }

    @Transactional(readOnly = true)
    public StageChangeEventDto getStageChangeEventById(Long id) {
        log.info("\n\n🔎 Buscando evento de cambio de etapa con ID: {}", id);
        StageChangeEvent event = stageChangeEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evento de cambio de etapa no encontrado con id: " + id));
        return (StageChangeEventDto) DtoMapper.plantEventToPlantEventDto(event);
    }

    @Transactional(readOnly = true)
    public List<StageChangeEventDto> getAllStageChangeEvents() {
        log.info("\n\n🔎 Obteniendo todos los eventos de cambio de etapa.");
        return stageChangeEventRepository.findAll().stream()
                .map(event -> (StageChangeEventDto) DtoMapper.plantEventToPlantEventDto(event))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<StageChangeEventDto> getStageChangeEventsByPlantaId(Long plantaId) {
        log.info("\n\n🔎 Obteniendo eventos de cambio de etapa para la planta ID: {}", plantaId);
        return stageChangeEventRepository.findByPlantaId(plantaId).stream()
                .map(event -> (StageChangeEventDto) DtoMapper.plantEventToPlantEventDto(event))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<StageChangeEventDto> getStageChangeEventsByFecha(LocalDate fecha) {
        log.info("\n\n🔎 Obteniendo eventos de cambio de etapa para la fecha: {}", fecha);
        return stageChangeEventRepository.findByFecha(fecha).stream()
                .map(event -> (StageChangeEventDto) DtoMapper.plantEventToPlantEventDto(event))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<StageChangeEventDto> getStageChangeEventsByFechaAfter(LocalDate fecha) {
        log.info("\n\n🔎 Obteniendo eventos de cambio de etapa posteriores a la fecha: {}", fecha);
        return stageChangeEventRepository.findByFechaAfter(fecha).stream()
                .map(event -> (StageChangeEventDto) DtoMapper.plantEventToPlantEventDto(event))
                .collect(Collectors.toList());
    }

    @Transactional
    public StageChangeEventDto updateStageChangeEvent(Long id, StageChangeEventDto dto) {
        log.info("\n\n⬆️ Actualizando evento de cambio de etapa con ID: {}", id);
        User currentUser = getCurrentUser();
        StageChangeEvent existingEvent = stageChangeEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evento de cambio de etapa no encontrado con id: " + id));

        if (currentUser.getRol() == AppRole.ROLE_GROWER) {
            for (Planta planta : existingEvent.getPlantas()) {
                if (!planta.getUser().equals(currentUser)) {
                    throw new AccessDeniedException("No tienes permiso para actualizar este evento");
                }
            }
        }

        existingEvent.setFecha(dto.getFecha());
        existingEvent.setNuevaEtapa(dto.getNuevaEtapa());

        if (dto.getPlantaIds() != null) {
            List<Planta> plantas = plantaRepository.findAllById(dto.getPlantaIds());
             if (plantas.size() != dto.getPlantaIds().size()) {
                log.warn("\u26A0️ Algunos IDs de plantas no fueron encontrados al actualizar el evento.");
            }
            existingEvent.setPlantas(plantas);
            // Update planta's etapa
            for (Planta planta : plantas) {
                planta.setEtapa(dto.getNuevaEtapa());
                plantaRepository.save(planta); // Save the updated planta
                log.info("\n\n✅ Etapa de planta {} actualizada a {}.", planta.getNombre(), dto.getNuevaEtapa());
            }
        }

        StageChangeEvent updatedEvent = stageChangeEventRepository.save(existingEvent);
        log.info("\n\n✨ Evento de cambio de etapa con ID: {} actualizado.", updatedEvent.getId());
        return (StageChangeEventDto) DtoMapper.plantEventToPlantEventDto(updatedEvent);
    }

    @Transactional
    public void deleteStageChangeEvent(Long id) {
        log.info("\n\n🗑️ Eliminando evento de cambio de etapa con ID: {}", id);
        User currentUser = getCurrentUser();
        StageChangeEvent event = stageChangeEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evento de cambio de etapa no encontrado con id: " + id));
        
        if (currentUser.getRol() == AppRole.ROLE_GROWER) {
            for (Planta planta : event.getPlantas()) {
                if (!planta.getUser().equals(currentUser)) {
                    throw new AccessDeniedException("No tienes permiso para eliminar este evento");
                }
            }
        }

        stageChangeEventRepository.deleteById(id);
        log.info("\n\n✨ Evento de cambio de etapa con ID: {} eliminado.", id);
    }
}
