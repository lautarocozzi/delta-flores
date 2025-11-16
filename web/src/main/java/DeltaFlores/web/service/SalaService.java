package DeltaFlores.web.service;

import DeltaFlores.web.dto.SalaDto;
import DeltaFlores.web.entities.Sala;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.SalaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SalaService {

    private final SalaRepository salaRepository;

    public SalaDto createSala(SalaDto salaDto) {
        Sala sala = new Sala();
        sala.setNombre(salaDto.getNombre());
        sala.setDescripcion(salaDto.getDescripcion());
        Sala savedSala = salaRepository.save(sala);
        return toDto(savedSala);
    }

    public List<SalaDto> getAllSalas() {
        return salaRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public SalaDto getSalaById(Long id) {
        Sala sala = salaRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Sala not found with id: " + id));
        return toDto(sala);
    }

    public SalaDto updateSala(Long id, SalaDto salaDto) {
        Sala sala = salaRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Sala not found with id: " + id));
        sala.setNombre(salaDto.getNombre());
        sala.setDescripcion(salaDto.getDescripcion());
        Sala updatedSala = salaRepository.save(sala);
        return toDto(updatedSala);
    }

    public void deleteSala(Long id) {
        if (!salaRepository.existsById(id)) {
            throw new ResourceNotFoundException("Sala not found with id: " + id);
        }
        salaRepository.deleteById(id);
    }

    private SalaDto toDto(Sala sala) {
        SalaDto dto = new SalaDto();
        dto.setId(sala.getId());
        dto.setNombre(sala.getNombre());
        dto.setDescripcion(sala.getDescripcion());
        return dto;
    }
}
