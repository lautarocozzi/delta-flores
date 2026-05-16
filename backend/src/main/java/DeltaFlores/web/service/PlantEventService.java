package DeltaFlores.web.service;

import DeltaFlores.web.dto.PlantEventDto;
import DeltaFlores.web.dto.StageChangeEventDto;
import DeltaFlores.web.entities.Planta;
import DeltaFlores.web.entities.PlantEvent;
import DeltaFlores.web.entities.StageChangeEvent;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.PlantEventRepository;
import DeltaFlores.web.repository.PlantaRepository;
import DeltaFlores.web.utils.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Log4j2
@Service
@RequiredArgsConstructor
public class PlantEventService {

    private final PlantEventRepository plantEventRepository;
    private final PlantaRepository plantaRepository;
    private final MinioFileStorageService fileStorageService; // Keep this injected for future use or other methods



    @Transactional(readOnly = true)
    public List<PlantEventDto> getAllEventsForPlanta(Long plantaId) {
        log.info("\n\n\uD83D\uDD0E Obteniendo todos los eventos para la planta ID: {}", plantaId);
        if (!plantaRepository.existsById(plantaId)) {
            throw new ResourceNotFoundException("Planta no encontrada con id: " + plantaId);
        }
        List<PlantEvent> events = plantEventRepository.findByPlantasIdOrderByFechaAsc(plantaId);
        log.info("\n\n\u2728 {} eventos encontrados para la planta ID: {}.", events.size(), plantaId);
        return events.stream()
                .map(DtoMapper::plantEventToPlantEventDto)
                .collect(Collectors.toList());
    }
}