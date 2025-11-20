package DeltaFlores.web.service.events;

import DeltaFlores.web.dto.WateringEventDto;
import DeltaFlores.web.entities.Planta;
import DeltaFlores.web.entities.WateringEvent;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.PlantaRepository;
import DeltaFlores.web.repository.WateringEventRepository;
import DeltaFlores.web.utils.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Log4j2
@RequiredArgsConstructor
public class WateringEventService {

    private final WateringEventRepository wateringEventRepository;
    private final PlantaRepository plantaRepository;

    @Transactional
    public WateringEventDto createWateringEvent(WateringEventDto dto) {
        log.info("\n\n💧 Creando nuevo evento de riego...");
        WateringEvent event = new WateringEvent();
        event.setFecha(dto.getFecha());
        event.setPhAgua(dto.getPhAgua());
        event.setEcAgua(dto.getEcAgua());
        event.setTempAgua(dto.getTempAgua());

        if (dto.getPlantaIds() != null && !dto.getPlantaIds().isEmpty()) {
            List<Planta> plantas = plantaRepository.findAllById(dto.getPlantaIds());
            if (plantas.isEmpty()) {
                throw new ResourceNotFoundException("No se encontraron plantas con los IDs proporcionados.");
            }
            if (plantas.size() != dto.getPlantaIds().size()) {
                log.warn("⚠️ Algunos IDs de plantas no fueron encontrados al crear el evento.");
            }
            event.setPlantas(plantas);
        } else {
            log.warn("⚠️ Creando un evento de riego sin plantas asociadas.");
        }

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
        WateringEvent existingEvent = wateringEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evento de riego no encontrado con id: " + id));

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
        if (!wateringEventRepository.existsById(id)) {
            throw new ResourceNotFoundException("Evento de riego no encontrado con id: " + id);
        }
        wateringEventRepository.deleteById(id);
        log.info("\n\n✨ Evento de riego con ID: {} eliminado.", id);
    }
}
