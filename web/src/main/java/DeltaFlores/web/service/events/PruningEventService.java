package DeltaFlores.web.service.events;

import DeltaFlores.web.dto.PruningEventDto;
import DeltaFlores.web.entities.Planta;
import DeltaFlores.web.entities.PruningEvent;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.PlantaRepository;
import DeltaFlores.web.repository.PruningEventRepository;
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
public class PruningEventService {

    private final PruningEventRepository pruningEventRepository;
    private final PlantaRepository plantaRepository;

    @Transactional
    public PruningEventDto createPruningEvent(PruningEventDto dto) {
        log.info("\n\n\ud83c\udf32 Creando nuevo evento de poda...");
        PruningEvent event = new PruningEvent();
        event.setFecha(dto.getFecha());
        event.setTipoPoda(dto.getTipoPoda());

        if (dto.getPlantaIds() != null && !dto.getPlantaIds().isEmpty()) {
            List<Planta> plantas = plantaRepository.findAllById(dto.getPlantaIds());
            if (plantas.isEmpty()) {
                throw new ResourceNotFoundException("No se encontraron plantas con los IDs proporcionados.");
            }
            if (plantas.size() != dto.getPlantaIds().size()) {
                log.warn("\u26a0\ufe0f Algunos IDs de plantas no fueron encontrados al crear el evento.");
            }
            event.setPlantas(plantas);
        } else {
            log.warn("\u26a0\ufe0f Creando un evento de poda sin plantas asociadas.");
        }

        PruningEvent savedEvent = pruningEventRepository.save(event);
        log.info("\n\n\u2728 Evento de poda creado con ID: {}", savedEvent.getId());
        return (PruningEventDto) DtoMapper.plantEventToPlantEventDto(savedEvent);
    }

    @Transactional(readOnly = true)
    public PruningEventDto getPruningEventById(Long id) {
        log.info("\n\n\ud83d\udd0e Buscando evento de poda con ID: {}", id);
        PruningEvent event = pruningEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evento de poda no encontrado con id: " + id));
        return (PruningEventDto) DtoMapper.plantEventToPlantEventDto(event);
    }

    @Transactional(readOnly = true)
    public List<PruningEventDto> getAllPruningEvents() {
        log.info("\n\n\ud83d\udd0e Obteniendo todos los eventos de poda.");
        return pruningEventRepository.findAll().stream()
                .map(event -> (PruningEventDto) DtoMapper.plantEventToPlantEventDto(event))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PruningEventDto> getPruningEventsByPlantaId(Long plantaId) {
        log.info("\n\n\ud83d\udd0e Obteniendo eventos de poda para la planta ID: {}", plantaId);
        return pruningEventRepository.findByPlantaId(plantaId).stream()
                .map(event -> (PruningEventDto) DtoMapper.plantEventToPlantEventDto(event))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PruningEventDto> getPruningEventsByFecha(LocalDate fecha) {
        log.info("\n\n\ud83d\udd0e Obteniendo eventos de poda para la fecha: {}", fecha);
        return pruningEventRepository.findByFecha(fecha).stream()
                .map(event -> (PruningEventDto) DtoMapper.plantEventToPlantEventDto(event))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PruningEventDto> getPruningEventsByFechaAfter(LocalDate fecha) {
        log.info("\n\n\ud83d\udd0e Obteniendo eventos de poda posteriores a la fecha: {}", fecha);
        return pruningEventRepository.findByFechaAfter(fecha).stream()
                .map(event -> (PruningEventDto) DtoMapper.plantEventToPlantEventDto(event))
                .collect(Collectors.toList());
    }

    @Transactional
    public PruningEventDto updatePruningEvent(Long id, PruningEventDto dto) {
        log.info("\n\n\u2b06\ufe0f Actualizando evento de poda con ID: {}", id);
        PruningEvent existingEvent = pruningEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evento de poda no encontrado con id: " + id));

        existingEvent.setFecha(dto.getFecha());
        existingEvent.setTipoPoda(dto.getTipoPoda());

        if (dto.getPlantaIds() != null) {
            List<Planta> plantas = plantaRepository.findAllById(dto.getPlantaIds());
             if (plantas.size() != dto.getPlantaIds().size()) {
                log.warn("\u26a0\ufe0f Algunos IDs de plantas no fueron encontrados al actualizar el evento.");
            }
            existingEvent.setPlantas(plantas);
        }

        PruningEvent updatedEvent = pruningEventRepository.save(existingEvent);
        log.info("\n\n\u2728 Evento de poda con ID: {} actualizado.", updatedEvent.getId());
        return (PruningEventDto) DtoMapper.plantEventToPlantEventDto(updatedEvent);
    }

    @Transactional
    public void deletePruningEvent(Long id) {
        log.info("\n\n\ud83d\udd1d\ufe0f Eliminando evento de poda con ID: {}", id);
        if (!pruningEventRepository.existsById(id)) {
            throw new ResourceNotFoundException("Evento de poda no encontrado con id: " + id);
        }
        pruningEventRepository.deleteById(id);
        log.info("\n\n\u2728 Evento de poda con ID: {} eliminado.", id);
    }
}
