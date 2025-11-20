package DeltaFlores.web.service;

import DeltaFlores.web.dto.CepaDto;
import DeltaFlores.web.dto.PlantaDto;
import DeltaFlores.web.entities.Cepa;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.CepaRepository;
import DeltaFlores.web.utils.DtoMapper;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Log4j2
public class CepaService {

    private final CepaRepository cepaRepository;

    public CepaService(CepaRepository cepaRepository) {
        this.cepaRepository = cepaRepository;
    }

    @Transactional(readOnly = true)
    public List<CepaDto> getAllCepas() {
        log.info("\n\n\uD83D\uDD0E Buscando todas las cepas...");
        List<CepaDto> cepas = cepaRepository.findAll().stream()
                .map(DtoMapper::cepaToCepaDto)
                .collect(Collectors.toList());
        log.info("\n\n\u2728 {} cepas encontradas.", cepas.size());
        return cepas;
    }

    @Transactional(readOnly = true)
    public CepaDto getCepaById(Long id) {
        log.info("\n\n\uD83D\uDD0E Buscando cepa con ID: {}", id);
        Cepa cepa = cepaRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("\n\n\u26A0\uFE0F No se encontró la cepa con ID: {}", id);
                    return new ResourceNotFoundException("Cepa no encontrada con id: " + id);
                });

        CepaDto cepaDto = DtoMapper.cepaToCepaDto(cepa);

        if (cepa.getPlantas() != null) {
            List<PlantaDto> plantaDtos = cepa.getPlantas().stream()
                    .map(DtoMapper::plantaToPlantaDto)
                    .collect(Collectors.toList());
            cepaDto.setPlantas(plantaDtos);
        }
        log.info("\n\n\u2728 Cepa encontrada: {}", cepaDto.getGeneticaParental());
        return cepaDto;
    }

    @Transactional
    public CepaDto createCepa(CepaDto cepaDto) {
        log.info("\n\n\uD83D\uDCBE Creando nueva cepa: {}", cepaDto.getGeneticaParental());
        try {
            Cepa cepa = DtoMapper.cepaDtoToCepa(cepaDto, new Cepa());
            Cepa savedCepa = cepaRepository.save(cepa);
            log.info("\n\n\u2728 Cepa creada con éxito con ID: {}", savedCepa.getId());
            return DtoMapper.cepaToCepaDto(savedCepa);
        } catch (Exception e) {
            log.error("\n\n\u274C Error al crear la cepa: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public CepaDto updateCepa(Long id, CepaDto cepaDto) {
        log.info("\n\n\u2B06\uFE0F Actualizando cepa con ID: {}", id);
        Cepa existingCepa = cepaRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("\n\n\u26A0\uFE0F No se puede actualizar. No se encontró la cepa con ID: {}", id);
                    return new ResourceNotFoundException("Cepa no encontrada con id: " + id);
                });

        try {
            Cepa updatedCepa = DtoMapper.cepaDtoToCepa(cepaDto, existingCepa);
            updatedCepa = cepaRepository.save(updatedCepa);
            log.info("\n\n\u2728 Cepa con ID: {} actualizada con éxito.", updatedCepa.getId());
            return DtoMapper.cepaToCepaDto(updatedCepa);
        } catch (Exception e) {
            log.error("\n\n\u274C Error al actualizar la cepa con ID: {}: {}", id, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public void deleteCepa(Long id) {
        log.info("\n\n\uD83D\uDDD1\uFE0F Intentando eliminar cepa con ID: {}", id);
        if (!cepaRepository.existsById(id)) {
            log.warn("\n\n\u26A0\uFE0F No se puede eliminar. No se encontró la cepa con ID: {}", id);
            throw new ResourceNotFoundException("Cepa no encontrada con id: " + id);
        }
        try {
            cepaRepository.deleteById(id);
            log.info("\n\n\u2728 Cepa con ID: {} eliminada con éxito.", id);
        } catch (Exception e) {
            log.error("\n\n\u274C Error al eliminar la cepa con ID: {}: {}", id, e.getMessage(), e);
            throw e;
        }
    }
}
