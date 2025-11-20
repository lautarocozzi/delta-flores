package DeltaFlores.web.service;

import DeltaFlores.web.dto.NutrienteDto;
import DeltaFlores.web.entities.Nutriente;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.NutrienteRepository;
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
public class NutrienteService {

    private final NutrienteRepository nutrienteRepository;

    @Transactional
    public NutrienteDto createNutriente(NutrienteDto dto) {
        log.info("\n\n🍏 Creando nuevo nutriente: {}", dto.getTitulo());
        Nutriente nutriente = DtoMapper.nutrienteDtoToNutriente(dto, new Nutriente());
        Nutriente savedNutriente = nutrienteRepository.save(nutriente);
        log.info("\n\n✨ Nutriente {} creado con ID: {}", savedNutriente.getTitulo(), savedNutriente.getId());
        return DtoMapper.nutrienteToNutrienteDto(savedNutriente);
    }

    @Transactional(readOnly = true)
    public NutrienteDto getNutrienteById(Long id) {
        log.info("\n\n🔎 Buscando nutriente con ID: {}", id);
        Nutriente nutriente = nutrienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nutriente no encontrado con id: " + id));
        return DtoMapper.nutrienteToNutrienteDto(nutriente);
    }

    @Transactional(readOnly = true)
    public List<NutrienteDto> getAllNutrientes() {
        log.info("\n\n🔎 Obteniendo todos los nutrientes.");
        return nutrienteRepository.findAll().stream()
                .map(DtoMapper::nutrienteToNutrienteDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NutrienteDto> getNutrientesByTitulo(String titulo) {
        log.info("\n\n🔎 Buscando nutrientes por título: {}", titulo);
        return nutrienteRepository.findByTitulo(titulo).stream()
                .map(DtoMapper::nutrienteToNutrienteDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public NutrienteDto updateNutriente(Long id, NutrienteDto dto) {
        log.info("\n\n⬆️ Actualizando nutriente con ID: {}", id);
        Nutriente existingNutriente = nutrienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nutriente no encontrado con id: " + id));

        Nutriente updatedNutriente = DtoMapper.nutrienteDtoToNutriente(dto, existingNutriente);
        updatedNutriente = nutrienteRepository.save(updatedNutriente);
        log.info("\n\n✨ Nutriente con ID: {} actualizado.", updatedNutriente.getId());
        return DtoMapper.nutrienteToNutrienteDto(updatedNutriente);
    }

    @Transactional
    public void deleteNutriente(Long id) {
        log.info("\n\n🗑️ Eliminando nutriente con ID: {}", id);
        if (!nutrienteRepository.existsById(id)) {
            throw new ResourceNotFoundException("Nutriente no encontrado con id: " + id);
        }
        nutrienteRepository.deleteById(id);
        log.info("\n\n✨ Nutriente con ID: {} eliminado.", id);
    }
}