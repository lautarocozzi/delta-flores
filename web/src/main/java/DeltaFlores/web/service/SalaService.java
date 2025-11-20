package DeltaFlores.web.service;

import DeltaFlores.web.dto.SalaDto;
import DeltaFlores.web.entities.Sala;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.SalaRepository;
import DeltaFlores.web.utils.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Log4j2
@RequiredArgsConstructor
public class SalaService {

    private final SalaRepository salaRepository;

    @Transactional
    public SalaDto createSala(SalaDto salaDto) {
        log.info("\n\n\uD83C\uDFE0 Creando nueva sala: {}", salaDto.getNombre());
        Sala sala = DtoMapper.salaDtoToSala(salaDto, new Sala()); // Use DtoMapper
        Sala savedSala = salaRepository.save(sala);
        log.info("\n\n\u2728 Sala {} creada con ID: {}", savedSala.getNombre(), savedSala.getId());
        return DtoMapper.salaToSalaDto(savedSala); // Use DtoMapper
    }

    @Transactional(readOnly = true)
    public List<SalaDto> getAllSalas() {
        log.info("\n\n\uD83D\uDD0D Obteniendo todas las salas.");
        return salaRepository.findAll().stream()
                .map(DtoMapper::salaToSalaDto) // Use DtoMapper
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SalaDto getSalaById(Long id) {
        log.info("\n\n\uD83D\uDD0D Buscando sala con ID: {}", id);
        Sala sala = salaRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("\n\n\u26A0\uFE0F Sala no encontrada con ID: {}", id);
                    return new ResourceNotFoundException("Sala no encontrada con id: " + id);
                });
        log.info("\n\n\u2728 Sala con ID: {} encontrada.", id);
        return DtoMapper.salaToSalaDto(sala); // Use DtoMapper
    }

    @Transactional
    public SalaDto updateSala(Long id, SalaDto salaDto) {
        log.info("\n\n\u2B06\uFE0F Actualizando sala con ID: {}", id);
        Sala sala = salaRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("\n\n\u26A0\uFE0F Sala no encontrada con ID: {} para actualizar.", id);
                    return new ResourceNotFoundException("Sala no encontrada con id: " + id);
                });
        
        Sala updatedSalaEntity = DtoMapper.salaDtoToSala(salaDto, sala); // Use DtoMapper
        updatedSalaEntity = salaRepository.save(updatedSalaEntity);
        log.info("\n\n\u2728 Sala con ID: {} actualizada.", updatedSalaEntity.getId());
        return DtoMapper.salaToSalaDto(updatedSalaEntity); // Use DtoMapper
    }

    @Transactional
    public void deleteSala(Long id) {
        log.info("\n\n\uD83D\uDDD1\uFE0F Eliminando sala con ID: {}", id);
        if (!salaRepository.existsById(id)) {
            log.warn("\n\n\u26A0\uFE0F Sala con ID: {} no encontrada para eliminar.", id);
            throw new ResourceNotFoundException("Sala no encontrada con id: " + id);
        }
        salaRepository.deleteById(id);
        log.info("\n\n\u2728 Sala con ID: {} eliminada con éxito.", id);
    }
}
