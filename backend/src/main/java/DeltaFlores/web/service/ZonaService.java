package DeltaFlores.web.service;

import DeltaFlores.web.dto.PlantaDto;
import DeltaFlores.web.dto.ZonaBatchItemDto;
import DeltaFlores.web.dto.ZonaDto;
import DeltaFlores.web.entities.Planta;
import DeltaFlores.web.entities.Sala;
import DeltaFlores.web.entities.TipoColaborador;
import DeltaFlores.web.entities.Zona;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.PlantaRepository;
import DeltaFlores.web.repository.SalaRepository;
import DeltaFlores.web.repository.ZonaRepository;
import DeltaFlores.web.utils.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
public class ZonaService {

    private final ZonaRepository zonaRepository;
    private final SalaRepository salaRepository;
    private final PlantaRepository plantaRepository;
    private final SalaService salaService;

    @Transactional(readOnly = true)
    public List<ZonaDto> getZonasBySalaId(Long salaId) {
        log.info("Buscando zonas para sala ID: {}", salaId);
        Sala sala = salaRepository.findById(salaId)
                .orElseThrow(() -> new ResourceNotFoundException("Sala no encontrada con id: " + salaId));

        // Allow access to public salas without ownership check
        if (!sala.isPublic()) {
            salaService.checkAccess(sala);
        }

        List<Zona> zonas = zonaRepository.findBySalaIdOrderByPosicionXAscPosicionYAsc(salaId);
        return zonas.stream()
                .map(DtoMapper::zonaToZonaDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ZonaDto createZona(ZonaDto dto) {
        Sala sala = salaRepository.findById(dto.getSalaId())
                .orElseThrow(() -> new ResourceNotFoundException("Sala no encontrada con id: " + dto.getSalaId()));
        salaService.checkAccess(sala, TipoColaborador.EDITOR);

        // Auto-generate zone letter name
        String autoName = getNextZoneLetter(dto.getSalaId());
        dto.setNombre(autoName);

        Zona zona = DtoMapper.zonaDtoToZona(dto, null, sala);
        Zona savedZona = zonaRepository.save(zona);
        log.info("Zona {} creada con ID: {} para sala ID: {}", savedZona.getNombre(), savedZona.getId(), sala.getId());
        return DtoMapper.zonaToZonaDto(savedZona);
    }

    @Transactional
    public List<ZonaDto> createZonasBatch(Long salaId, List<ZonaBatchItemDto> items) {
        Sala sala = salaRepository.findById(salaId)
                .orElseThrow(() -> new ResourceNotFoundException("Sala no encontrada con id: " + salaId));
        salaService.checkAccess(sala, TipoColaborador.EDITOR);

        // Pre-compute all needed letters in one pass
        List<String> letters = getNextNZoneLetters(salaId, items.size());

        List<Zona> zonas = new ArrayList<>();
        for (int i = 0; i < items.size(); i++) {
            ZonaBatchItemDto item = items.get(i);
            Zona zona = new Zona();
            zona.setNombre(letters.get(i));
            zona.setPosicionX(item.getPosicionX());
            zona.setPosicionY(item.getPosicionY());
            zona.setColumnas(item.getColumnas());
            zona.setFilas(item.getFilas());
            zona.setSala(sala);
            zonas.add(zona);
        }

        List<Zona> saved = zonaRepository.saveAll(zonas);
        log.info("{} zonas creadas en batch para sala ID: {}", saved.size(), salaId);
        return saved.stream()
                .map(DtoMapper::zonaToZonaDto)
                .collect(Collectors.toList());
    }

    private List<String> getNextNZoneLetters(Long salaId, int count) {
        List<Zona> existing = zonaRepository.findBySalaId(salaId);
        Set<String> used = existing.stream()
                .map(Zona::getNombre)
                .filter(n -> n != null && n.matches("[A-Z]+"))
                .collect(Collectors.toSet());

        List<String> result = new ArrayList<>();
        String letter = "A";
        int found = 0;
        for (int i = 0; i < 702 && found < count; i++) {
            if (!used.contains(letter)) {
                result.add(letter);
                found++;
            }
            letter = incrementLetter(letter);
        }
        if (found < count) {
            throw new IllegalStateException("No hay suficientes letras disponibles para zonas");
        }
        return result;
    }

    @Transactional
    public ZonaDto updateZona(Long id, ZonaDto dto) {
        Zona existingZona = zonaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Zona no encontrada con id: " + id));
        salaService.checkAccess(existingZona.getSala(), TipoColaborador.EDITOR);

        existingZona.setNombre(dto.getNombre());
        existingZona.setPosicionX(dto.getPosicionX());
        existingZona.setPosicionY(dto.getPosicionY());
        existingZona.setColumnas(dto.getColumnas());
        existingZona.setFilas(dto.getFilas());

        Zona savedZona = zonaRepository.save(existingZona);
        log.info("Zona con ID: {} actualizada con éxito.", id);
        return DtoMapper.zonaToZonaDto(savedZona);
    }

    @Transactional
    public void deleteZona(Long id) {
        Zona zona = zonaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Zona no encontrada con id: " + id));
        salaService.checkAccess(zona.getSala(), TipoColaborador.EDITOR);

        // Disassociate all plantas that reference this zona
        if (zona.getPlantas() != null && !zona.getPlantas().isEmpty()) {
            zona.getPlantas().forEach(planta -> {
                planta.setZona(null);
                planta.setColumnaEnZona(null);
                planta.setFilaEnZona(null);
            });
            plantaRepository.saveAll(zona.getPlantas());
        }

        zonaRepository.delete(zona);
        log.info("Zona con ID: {} eliminada con éxito.", id);
    }

    @Transactional(readOnly = true)
    public List<PlantaDto> getPlantasByZonaId(Long zonaId) {
        Zona zona = zonaRepository.findByIdWithPlantas(zonaId)
                .orElseThrow(() -> new ResourceNotFoundException("Zona no encontrada con id: " + zonaId));

        Sala sala = zona.getSala();

        // Allow access to public salas without ownership check
        if (!sala.isPublic()) {
            salaService.checkAccess(sala);
        }

        return zona.getPlantas().stream()
                .map(DtoMapper::plantaToPlantaDto)
                .collect(Collectors.toList());
    }

    private String getNextZoneLetter(Long salaId) {
        List<Zona> existingZonas = zonaRepository.findBySalaId(salaId);
        Set<String> usedNames = existingZonas.stream()
                .map(Zona::getNombre)
                .filter(name -> name != null && name.matches("[A-Z]+"))
                .collect(Collectors.toSet());

        String nextLetter = "A";
        for (int i = 0; i < 702; i++) { // A-Z then AA-ZZ
            if (!usedNames.contains(nextLetter)) {
                return nextLetter;
            }
            nextLetter = incrementLetter(nextLetter);
        }
        throw new IllegalStateException("No more zone letters available");
    }

    private String incrementLetter(String letter) {
        if (letter.isEmpty()) return "A";
        char lastChar = letter.charAt(letter.length() - 1);
        if (lastChar < 'Z') {
            return letter.substring(0, letter.length() - 1) + (char)(lastChar + 1);
        } else {
            if (letter.length() == 1) return "AA";
            char[] chars = letter.toCharArray();
            int carry = 1;
            for (int i = chars.length - 1; i >= 0 && carry > 0; i--) {
                chars[i] += carry;
                if (chars[i] > 'Z') {
                    chars[i] = 'A';
                    carry = 1;
                } else {
                    carry = 0;
                }
            }
            if (carry > 0) return "A" + new String(chars);
            return new String(chars);
        }
    }
}
