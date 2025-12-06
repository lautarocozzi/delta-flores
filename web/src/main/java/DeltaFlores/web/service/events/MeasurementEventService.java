package DeltaFlores.web.service.events;

import DeltaFlores.web.dto.MeasurementEventDto;
import DeltaFlores.web.entities.MeasurementEvent;
import DeltaFlores.web.entities.Planta;
import DeltaFlores.web.entities.Sala;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.MeasurementEventRepository;
import DeltaFlores.web.repository.PlantaRepository;
import DeltaFlores.web.repository.SalaRepository;
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
public class MeasurementEventService {

    private final MeasurementEventRepository measurementEventRepository;
    private final PlantaRepository plantaRepository;
    private final SalaRepository salaRepository; // Inyectar SalaRepository
    private final UserRepository userRepository;

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        return userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    @Transactional
    public MeasurementEventDto createMeasurementEvent(MeasurementEventDto dto) {
        log.info("\n\n\ud83d\udcca Creando nuevo evento de medición...");
        MeasurementEvent event = new MeasurementEvent();
        event.setFecha(dto.getFecha());
        event.setHorasLuz(dto.getHorasLuz()); // String
        event.setHumedad(dto.getHumedad());
        event.setTemperaturaAmbiente(dto.getTemperaturaAmbiente());
        event.setAlturaPlanta(dto.getAlturaPlanta()); // int
        event.setDistanciaLuz(dto.getDistanciaLuz()); // int

        if (dto.getPlantaIds() != null && !dto.getPlantaIds().isEmpty()) {
            List<Planta> plantas = plantaRepository.findAllById(dto.getPlantaIds());
            if (plantas.isEmpty()) {
                throw new ResourceNotFoundException("No se encontraron plantas con los IDs proporcionados.");
            }
            if (plantas.size() != dto.getPlantaIds().size()) {
                log.warn("\u26A0\uFE0F Algunos IDs de plantas no fueron encontrados al crear el evento.");
            }
            event.setPlantas(plantas);

            // Actualizar la Sala asociada a las plantas
            // Suponemos que todas las plantas de un evento pertenecen a la misma sala, o tomamos la primera
            Sala sala = plantas.get(0).getSala(); // Obtener la sala de la primera planta
            if (sala != null) {
                sala.setHorasLuz(dto.getHorasLuz()); // Directamente String a String
                sala.setHumedad(dto.getHumedad());
                sala.setTemperaturaAmbiente(dto.getTemperaturaAmbiente());
                salaRepository.save(sala);
                log.info("\n\n\u2705 Sala {} actualizada con datos de medición.", sala.getNombre());
            } else {
                log.warn("\u26A0\uFE0F No se encontró sala asociada para actualizar.");
            }
        } else {
            log.warn("\u26A0\uFE0F Creando un evento de medición sin plantas asociadas, no se actualiza la sala.");
        }

        MeasurementEvent savedEvent = measurementEventRepository.save(event);
        log.info("\n\n\u2728 Evento de medición creado con ID: {}", savedEvent.getId());
        return (MeasurementEventDto) DtoMapper.plantEventToPlantEventDto(savedEvent);
    }

    @Transactional(readOnly = true)
    public MeasurementEventDto getMeasurementEventById(Long id) {
        log.info("\n\n\ud83d\udd0e Buscando evento de medición con ID: {}", id);
        MeasurementEvent event = measurementEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evento de medición no encontrado con id: " + id));
        return (MeasurementEventDto) DtoMapper.plantEventToPlantEventDto(event);
    }

    @Transactional(readOnly = true)
    public List<MeasurementEventDto> getAllMeasurementEvents() {
        log.info("\n\n\ud83d\udd0e Obteniendo todos los eventos de medición.");
        return measurementEventRepository.findAll().stream()
                .map(event -> (MeasurementEventDto) DtoMapper.plantEventToPlantEventDto(event))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MeasurementEventDto> getMeasurementEventsByPlantaId(Long plantaId) {
        log.info("\n\n\ud83d\udd0e Obteniendo eventos de medición para la planta ID: {}", plantaId);
        return measurementEventRepository.findByPlantaId(plantaId).stream()
                .map(event -> (MeasurementEventDto) DtoMapper.plantEventToPlantEventDto(event))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MeasurementEventDto> getMeasurementEventsByFecha(LocalDate fecha) {
        log.info("\n\n\ud83d\udd0e Obteniendo eventos de medición para la fecha: {}", fecha);
        return measurementEventRepository.findByFecha(fecha).stream()
                .map(event -> (MeasurementEventDto) DtoMapper.plantEventToPlantEventDto(event))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MeasurementEventDto> getMeasurementEventsByFechaAfter(LocalDate fecha) {
        log.info("\n\n\ud83d\udd0e Obteniendo eventos de medición posteriores a la fecha: {}", fecha);
        return measurementEventRepository.findByFechaAfter(fecha).stream()
                .map(event -> (MeasurementEventDto) DtoMapper.plantEventToPlantEventDto(event))
                .collect(Collectors.toList());
    }

    @Transactional
    public MeasurementEventDto updateMeasurementEvent(Long id, MeasurementEventDto dto) {
        log.info("\n\n\u2b06\ufe0f Actualizando evento de medición con ID: {}", id);
        User currentUser = getCurrentUser();
        MeasurementEvent existingEvent = measurementEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evento de medición no encontrado con id: " + id));

        if (currentUser.getRol() == AppRole.ROLE_GROWER) {
            for (Planta planta : existingEvent.getPlantas()) {
                if (!planta.getUser().equals(currentUser)) {
                    throw new AccessDeniedException("No tienes permiso para actualizar este evento");
                }
            }
        }

        existingEvent.setFecha(dto.getFecha());
        existingEvent.setHorasLuz(dto.getHorasLuz());
        existingEvent.setHumedad(dto.getHumedad());
        existingEvent.setTemperaturaAmbiente(dto.getTemperaturaAmbiente());
        existingEvent.setAlturaPlanta(dto.getAlturaPlanta());
        existingEvent.setDistanciaLuz(dto.getDistanciaLuz());

        // Update associated plants if provided
        if (dto.getPlantaIds() != null) {
            List<Planta> plantas = plantaRepository.findAllById(dto.getPlantaIds());
             if (plantas.size() != dto.getPlantaIds().size()) {
                log.warn("\u26A0\uFE0F Algunos IDs de plantas no fueron encontrados al actualizar el evento.");
            }
            existingEvent.setPlantas(plantas);
        }

        MeasurementEvent updatedEvent = measurementEventRepository.save(existingEvent);
        log.info("\n\n\u2728 Evento de medición con ID: {} actualizado.", updatedEvent.getId());
        return (MeasurementEventDto) DtoMapper.plantEventToPlantEventDto(updatedEvent);
    }

    @Transactional
    public void deleteMeasurementEvent(Long id) {
        log.info("\n\n\ud83d\udd31\ufe0f Eliminando evento de medición con ID: {}", id);
        User currentUser = getCurrentUser();
        MeasurementEvent event = measurementEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evento de medición no encontrado con id: " + id));

        if (currentUser.getRol() == AppRole.ROLE_GROWER) {
            for (Planta planta : event.getPlantas()) {
                if (!planta.getUser().equals(currentUser)) {
                    throw new AccessDeniedException("No tienes permiso para eliminar este evento");
                }
            }
        }
        
        measurementEventRepository.deleteById(id);
        log.info("\n\n\u2728 Evento de medición con ID: {} eliminado.", id);
    }
}