package DeltaFlores.web.service;

import DeltaFlores.web.dto.TopPlantaDto;
import DeltaFlores.web.entities.Favorite;
import DeltaFlores.web.repository.FavoriteRepository;
import DeltaFlores.web.repository.PlantaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
public class TopPlantaService {

    private final FavoriteRepository favoriteRepository;
    private final PlantaRepository plantaRepository;

    @Transactional(readOnly = true)
    public List<TopPlantaDto> getTopPlantas(int limit) {
        // Get all plant favorites grouped by plantaId
        List<Favorite> allFavorites = favoriteRepository.findAll();

        Map<Long, List<Favorite>> favoritesByPlant = allFavorites.stream()
                .filter(f -> "PLANTA".equals(f.getFavorableType()))
                .collect(Collectors.groupingBy(Favorite::getFavorableId));

        // Sort by favorite count and take top N
        return favoritesByPlant.entrySet().stream()
                .sorted((a, b) -> Integer.compare(b.getValue().size(), a.getValue().size()))
                .limit(limit)
                .map(entry -> {
                    Long plantaId = entry.getKey();
                    int count = entry.getValue().size();
                    TopPlantaDto dto = new TopPlantaDto();
                    dto.setPlantaId(plantaId);
                    dto.setFavoriteCount(count);

                    // Try to get planta info
                    plantaRepository.findById(plantaId).ifPresent(planta -> {
                        dto.setPlantaNombre(planta.getNombre());
                        dto.setPlantaImagenUrl(planta.getImagenUrl());
                        if (planta.getCepa() != null) {
                            dto.setCepaNombre(planta.getCepa().getGeneticaParental());
                        }
                        if (planta.getUser() != null) {
                            dto.setUserId(planta.getUser().getId());
                            dto.setUserUsername(planta.getUser().getUsername());
                        }
                    });

                    return dto;
                })
                .filter(dto -> dto.getPlantaNombre() != null)
                .collect(Collectors.toList());
    }
}
