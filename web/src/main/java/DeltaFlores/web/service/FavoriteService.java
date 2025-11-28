package DeltaFlores.web.service;

import DeltaFlores.web.dto.PlantaDto;
import DeltaFlores.web.entities.Favorite;
import DeltaFlores.web.entities.Planta;
import DeltaFlores.web.entities.User;
import DeltaFlores.web.exception.ResourceAlreadyExistsException;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.FavoriteRepository;
import DeltaFlores.web.repository.UserRepository;
import DeltaFlores.web.security.CustomUserDetails;
import DeltaFlores.web.utils.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Log4j2
@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final PlantaService plantaService; // Use PlantaService to ensure security checks

    private User getCurrentUser() {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado en el contexto de seguridad"));
    }

    @Transactional
    public void addFavorite(Long plantaId) {
        User currentUser = getCurrentUser();
        log.info("\n\n[Servicio Favoritos] Usuario '{}' intentando agregar planta ID: {} a favoritos.", currentUser.getUsername(), plantaId);

        // First, use PlantaService to get the plant.
        // This ensures the user can actually SEE the plant (it's public or they own it).
        PlantaDto plantaDto = plantaService.getPlantaById(plantaId);
        Planta planta = new Planta(); // Create a proxy entity for the relationship
        planta.setId(plantaDto.getId());

        // Check if the favorite already exists
        if (favoriteRepository.findByUserIdAndPlantaId(currentUser.getId(), plantaId).isPresent()) {
            log.warn("\n\n[Servicio Favoritos] ⚠️ La planta ID: {} ya está en los favoritos del usuario '{}'.", plantaId, currentUser.getUsername());
            throw new ResourceAlreadyExistsException("Esta planta ya está en tus favoritos.");
        }

        Favorite favorite = new Favorite(currentUser, planta);
        favoriteRepository.save(favorite);
        log.info("\n\n[Servicio Favoritos] ✅ Planta ID: {} agregada a favoritos para el usuario '{}'.", plantaId, currentUser.getUsername());
    }

    @Transactional
    public void removeFavorite(Long plantaId) {
        User currentUser = getCurrentUser();
        log.info("\n\n[Servicio Favoritos] Usuario '{}' intentando eliminar planta ID: {} de favoritos.", currentUser.getUsername(), plantaId);

        Favorite favorite = favoriteRepository.findByUserIdAndPlantaId(currentUser.getId(), plantaId)
                .orElseThrow(() -> {
                    log.warn("\n\n[Servicio Favoritos] ⚠️ Intento de eliminar un favorito no existente. Usuario: '{}', Planta ID: {}", currentUser.getUsername(), plantaId);
                    return new ResourceNotFoundException("Esta planta no se encuentra en tus favoritos.");
                });

        favoriteRepository.delete(favorite);
        log.info("\n\n[Servicio Favoritos] ✅ Planta ID: {} eliminada de favoritos para el usuario '{}'.", plantaId, currentUser.getUsername());
    }

    @Transactional(readOnly = true)
    public List<PlantaDto> getMyFavorites() {
        User currentUser = getCurrentUser();
        log.info("\n\n[Servicio Favoritos] Obteniendo todos los favoritos para el usuario '{}'.", currentUser.getUsername());

        List<Favorite> favorites = favoriteRepository.findByUserIdWithPlanta(currentUser.getId());
        
        return favorites.stream()
                .map(favorite -> DtoMapper.plantaToPlantaDto(favorite.getPlanta()))
                .collect(Collectors.toList());
    }
}
