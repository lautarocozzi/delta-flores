package DeltaFlores.web.service;

import DeltaFlores.web.dto.PlantaDto;
import DeltaFlores.web.entities.Planta;
import DeltaFlores.web.entities.Sala;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.PlantaRepository;
import DeltaFlores.web.repository.SalaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlantaService {

    private final PlantaRepository plantaRepository;
    private final SalaRepository salaRepository;

    public PlantaDto createPlanta(PlantaDto plantaDto) {
        Sala sala = salaRepository.findById(plantaDto.getSalaId()).orElseThrow(() -> new ResourceNotFoundException("Sala not found with id: " + plantaDto.getSalaId()));
        Planta planta = new Planta();
        planta.setGenetica(plantaDto.getGenetica());
        planta.setEtapa(plantaDto.getEtapa());
        planta.setSala(sala);
        Planta savedPlanta = plantaRepository.save(planta);
        return toDto(savedPlanta);
    }

    public List<PlantaDto> getAllPlantas() {
        return plantaRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public PlantaDto getPlantaById(Long id) {
        Planta planta = plantaRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Planta not found with id: " + id));
        return toDto(planta);
    }

    public PlantaDto updatePlanta(Long id, PlantaDto plantaDto) {
        Planta planta = plantaRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Planta not found with id: " + id));
        Sala sala = salaRepository.findById(plantaDto.getSalaId()).orElseThrow(() -> new ResourceNotFoundException("Sala not found with id: " + plantaDto.getSalaId()));
        planta.setGenetica(plantaDto.getGenetica());
        planta.setEtapa(plantaDto.getEtapa());
        planta.setSala(sala);
        Planta updatedPlanta = plantaRepository.save(planta);
        return toDto(updatedPlanta);
    }

    public void deletePlanta(Long id) {
        if (!plantaRepository.existsById(id)) {
            throw new ResourceNotFoundException("Planta not found with id: " + id);
        }
        plantaRepository.deleteById(id);
    }

    private PlantaDto toDto(Planta planta) {
        PlantaDto dto = new PlantaDto();
        dto.setId(planta.getId());
        dto.setGenetica(planta.getGenetica());
        dto.setEtapa(planta.getEtapa());
        dto.setSalaId(planta.getSala().getId());
        dto.setFechaCreacion(planta.getFechaCreacion());
        return dto;
    }
}
