package DeltaFlores.web.service;

import DeltaFlores.web.dto.PlantaDto;
import DeltaFlores.web.entities.Cepa;
import DeltaFlores.web.entities.Planta;
import DeltaFlores.web.entities.Sala;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.PlantEventRepository;
import DeltaFlores.web.repository.PlantaRepository;
import DeltaFlores.web.repository.SalaRepository;
import DeltaFlores.web.repository.CepaRepository;

import DeltaFlores.web.utils.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;


@Log4j2
@Service
@RequiredArgsConstructor
public class PlantaService {

    private final PlantaRepository plantaRepository;
    private final SalaService salaService; // Inyectar SalaService

    @Autowired
    private final SalaRepository salaRepository;

    @Autowired
    private final CepaRepository cepaRepository;

    private final CepaService cepaService; // Inyectar CepaService
    private final PlantEventRepository plantEventRepository; // Keep this for event association if needed

    @Transactional
    public PlantaDto createPlanta (PlantaDto plantaDto)  throws Exception{
        log.info("\n\n\uD83C\uDF3F Creando nueva planta: {}", plantaDto.getNombre());

        Optional<Sala> sala = null;
        Optional<Cepa> cepa = null;
        try {
            sala = salaRepository.findById(plantaDto.getSala().getId());
        } catch (Exception e) {
            log.warn("\n\n\u26A0\uFE0F Sala no encontrada con ID: {}", plantaDto.getSala().getId());
            throw new RuntimeException(e);
        }

        try {
            cepa = cepaRepository.findById(plantaDto.getCepaDto().getId());
        } catch (Exception e) {
            log.warn("\n\n\u26A0\uFE0F Cepa no encontrada con ID: {}", plantaDto.getCepaDto().getId());
            throw new RuntimeException(e);
        }


        Planta planta = new Planta();
        planta.setNombre(plantaDto.getNombre());
        planta.setSala(sala.get());
        planta.setCepa(cepa.get());
        planta.setEtapa(plantaDto.getEtapa());
        planta.setProduccion(plantaDto.getProduccion());
        planta.setUbicacion(plantaDto.getUbicacion());
        planta.setFechaCreacion(plantaDto.getFechaCreacion()); // Asignar fechaCreacion si viene en el DTO

        Planta savedPlanta = plantaRepository.save(planta);
        log.info("\n\n\u2705 Planta {} creada con ID: {}", savedPlanta.getNombre(), savedPlanta.getId());
        return DtoMapper.plantaToPlantaDto(savedPlanta);
    }

    @Transactional(readOnly = true)
    public List<PlantaDto> listarPlantas (){
        log.info("\n\n\uD83D\uDD0D Listando todas las plantas...");
        return plantaRepository.findAll()
                .stream()
                .map(DtoMapper::plantaToPlantaDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PlantaDto obtenerPlantaPorId (Long id) {
        log.info("\n\n\uD83D\uDD0D Buscando planta con ID: {}", id);
        Planta planta = plantaRepository.findByIdWithEvents(id)
                .orElseThrow(() -> {
                    log.warn("\n\n\u26A0\uFE0F Planta no encontrada con ID: {}", id);
                    return new ResourceNotFoundException("Planta no encontrada con id: " + id);
                });
        log.info("\n\n\u2728 Planta con ID: {} encontrada.", id);
        return DtoMapper.plantaToPlantaDto(planta);
    }

    @Transactional
    public void eliminarPlanta (Long id) {
        log.info("\n\n\uD83D\uDDD1\uFE0F Intentando eliminar planta con ID: {}", id);
        if (!plantaRepository.existsById(id)) {
            log.warn("\n\n\u26A0\uFE0F No se puede eliminar. Planta no encontrada con ID: {}", id);
            throw new ResourceNotFoundException("Planta no encontrada con id: " + id);
        }
        plantaRepository.deleteById(id);
        log.info("\n\n\u2705 Planta con ID: {} eliminada con éxito.", id);
    }

    @Transactional
    public PlantaDto updatePlanta (Long id, PlantaDto plantaDto) {
        log.info("\n\n\u2B06\uFE0F Actualizando planta con ID: {}", id);
        Planta existingPlanta = plantaRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("\n\n\u26A0\uFE0F No se puede actualizar. Planta no encontrada con ID: {}", id);
                    return new ResourceNotFoundException("Planta no encontrada con id: " + id);
                });

        Optional<Sala> sala = null;
        Optional<Cepa> cepa = null;
        try {
            sala = salaRepository.findById(plantaDto.getSala().getId());
        } catch (Exception e) {
            log.warn("\n\n\u26A0\uFE0F Sala no encontrada con ID: {}", plantaDto.getSala().getId());
            throw new RuntimeException(e);
        }

        try {
            cepa = cepaRepository.findById(plantaDto.getCepaDto().getId());
        } catch (Exception e) {
            log.warn("\n\n\u26A0\uFE0F Cepa no encontrada con ID: {}", plantaDto.getCepaDto().getId());
            throw new RuntimeException(e);
        }

        //Sala sala = salaService.getSalaById(plantaDto.getSala().getId()); // Use SalaService
        //Cepa cepa = cepaService.getCepaById(plantaDto.getCepaDto().getId()); // Use CepaService

        existingPlanta.setNombre(plantaDto.getNombre());
        existingPlanta.setSala(sala.get());
        existingPlanta.setCepa(cepa.get());
        existingPlanta.setEtapa(plantaDto.getEtapa());
        existingPlanta.setProduccion(plantaDto.getProduccion());
        existingPlanta.setUbicacion(plantaDto.getUbicacion());
        // No actualizamos fechaCreacion ni fechaFin directamente aquí, ya que se manejan en otros flujos o son inmutables.

        Planta updatedPlanta = plantaRepository.save(existingPlanta);
        log.info("\n\n\u2705 Planta con ID: {} actualizada con éxito.", updatedPlanta.getId());
        return DtoMapper.plantaToPlantaDto(updatedPlanta);
    }

    @Transactional(readOnly = true)
    public List<PlantaDto> buscarPlantasPorPalabraClave(String palabraClave) {
        log.info("\n\n\uD83D\uDD0D Buscando plantas por palabra clave: {}", palabraClave);
        List<Planta> plantas = plantaRepository.findByNombre(palabraClave);
        log.info("\n\n\u2728 {} plantas encontradas por palabra clave '{}'.", plantas.size(), palabraClave);
        return plantas.stream()
                .map(DtoMapper::plantaToPlantaDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PlantaDto> plantasPorSala (Long salaId) {
        log.info("\n\n\uD83D\uDD0D Buscando plantas por ID de sala: {}", salaId);
        List<Planta> plantas = plantaRepository.findBySalaId(salaId);
        log.info("\n\n\u2728 {} plantas encontradas para sala ID: {}.", plantas.size(), salaId);
        return plantas.stream()
                .map(DtoMapper::plantaToPlantaDto)
                .collect(Collectors.toList());
    }
}
