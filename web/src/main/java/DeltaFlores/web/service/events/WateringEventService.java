package DeltaFlores.web.service.events;

import DeltaFlores.web.dto.WateringEventDto;
import DeltaFlores.web.entities.Planta;
import DeltaFlores.web.entities.User;
import DeltaFlores.web.entities.WateringEvent;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.PlantaRepository;
import DeltaFlores.web.repository.UserRepository;
import DeltaFlores.web.repository.WateringEventRepository;
import DeltaFlores.web.utils.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import DeltaFlores.web.entities.AppRole;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Log4j2
@RequiredArgsConstructor
public class WateringEventService {

    private final WateringEventRepository wateringEventRepository;
    private final PlantaRepository plantaRepository;
    private final UserRepository userRepository;


    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        return userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    @Transactional
    public WateringEventDto createWateringEvent(WateringEventDto dto) {
        log.info("\n\n💧 Creando nuevo evento de riego...");
        User currentUser = getCurrentUser();

        WateringEvent event = new WateringEvent();



        event.setPhAgua(dto.getPhAgua());
        event.setEcAgua(dto.getEcAgua());
        event.setTempAgua(dto.getTempAgua());

        if (dto.getPlantaIds() == null || dto.getPlantaIds().isEmpty()) {
            throw new ResourceNotFoundException("Se requiere al menos un ID de planta para crear un evento.");
        }

        List<Planta> plantas = plantaRepository.findAllById(dto.getPlantaIds());
        if (plantas.size() != dto.getPlantaIds().size()) {
            log.warn("⚠️ Algunos IDs de plantas no fueron encontrados al crear el evento.");
            throw new ResourceNotFoundException("No se encontraron todas las plantas con los IDs proporcionados.");
        }

        // Security Check: Verify ownership of all plants
        for (Planta planta : plantas) {
            if (currentUser.getRol() == AppRole.ROLE_GROWER && !planta.getUser().equals(currentUser)) {
                log.warn("ACCESO DENEGADO: Usuario '{}' intentó crear un evento para la planta ID: {}, que no le pertenece.", currentUser.getUsername(), planta.getId());
                throw new AccessDeniedException("No tienes permiso para crear un evento en una o más de las plantas seleccionadas.");
            }
        }

        event.setPlantas(plantas);
        WateringEvent savedEvent = wateringEventRepository.save(event);
        log.info("\n\n✨ Evento de riego creado con ID: {}", savedEvent.getId());
        return (WateringEventDto) DtoMapper.plantEventToPlantEventDto(savedEvent);
    }

    @Transactional(readOnly = true)
    public WateringEventDto getWateringEventById(Long id) {
        log.info("\n\n🔍 Buscando evento de riego con ID: {}", id);
        WateringEvent event = wateringEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evento de riego no encontrado con id: " + id));
        return (WateringEventDto) DtoMapper.plantEventToPlantEventDto(event);
    }

    @Transactional(readOnly = true)
    public List<WateringEventDto> getAllWateringEvents() {
        log.info("\n\n🔍 Obteniendo todos los eventos de riego.");
        return wateringEventRepository.findAll().stream()
                .map(event -> (WateringEventDto) DtoMapper.plantEventToPlantEventDto(event))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WateringEventDto> getWateringEventsByPlantaId(Long plantaId) {
        log.info("\n\n🔍 Obteniendo eventos de riego para la planta ID: {}", plantaId);
        return wateringEventRepository.findByPlantaId(plantaId).stream()
                .map(event -> (WateringEventDto) DtoMapper.plantEventToPlantEventDto(event))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WateringEventDto> getWateringEventsByFecha(LocalDate fecha) {
        log.info("\n\n🔍 Obteniendo eventos de riego para la fecha: {}", fecha);
        return wateringEventRepository.findByFecha(fecha).stream()
                .map(event -> (WateringEventDto) DtoMapper.plantEventToPlantEventDto(event))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WateringEventDto> getWateringEventsByFechaAfter(LocalDate fecha) {
        log.info("\n\n🔍 Obteniendo eventos de riego posteriores a la fecha: {}", fecha);
        return wateringEventRepository.findByFechaAfter(fecha).stream()
                .map(event -> (WateringEventDto) DtoMapper.plantEventToPlantEventDto(event))
                .collect(Collectors.toList());
    }

    @Transactional
    public WateringEventDto updateWateringEvent(Long id, WateringEventDto dto) {
        log.info("\n\n⬆️ Actualizando evento de riego con ID: {}", id);
        User currentUser = getCurrentUser();
        WateringEvent existingEvent = wateringEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evento de riego no encontrado con id: " + id));
        
        if (currentUser.getRol() == AppRole.ROLE_GROWER) {
            for (Planta planta : existingEvent.getPlantas()) {
                if (!planta.getUser().equals(currentUser)) {
                    throw new AccessDeniedException("No tienes permiso para actualizar este evento");
                }
            }
        }

        existingEvent.setFecha(dto.getFecha());
        existingEvent.setPhAgua(dto.getPhAgua());
        existingEvent.setEcAgua(dto.getEcAgua());
        existingEvent.setTempAgua(dto.getTempAgua());

        if (dto.getPlantaIds() != null) {
            List<Planta> plantas = plantaRepository.findAllById(dto.getPlantaIds());
             if (plantas.size() != dto.getPlantaIds().size()) {
                log.warn("⚠️ Algunos IDs de plantas no fueron encontrados al actualizar el evento.");
            }
            existingEvent.setPlantas(plantas);
        }

        WateringEvent updatedEvent = wateringEventRepository.save(existingEvent);
        log.info("\n\n✨ Evento de riego con ID: {} actualizado.", updatedEvent.getId());
        return (WateringEventDto) DtoMapper.plantEventToPlantEventDto(updatedEvent);
    }

    @Transactional
    public void deleteWateringEvent(Long id) {
        log.info("\n\n🗑️ Eliminando evento de riego con ID: {}", id);
        User currentUser = getCurrentUser();
        WateringEvent event = wateringEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evento de riego no encontrado con id: " + id));

        if (currentUser.getRol() == AppRole.ROLE_GROWER) {
            for (Planta planta : event.getPlantas()) {
                if (!planta.getUser().equals(currentUser)) {
                    throw new AccessDeniedException("No tienes permiso para eliminar este evento");
                }
            }
        }
        
        wateringEventRepository.deleteById(id);
        log.info("\n\n✨ Evento de riego con ID: {} eliminado.", id);
    }
}
