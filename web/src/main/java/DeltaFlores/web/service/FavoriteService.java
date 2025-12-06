package DeltaFlores.web.service;

import DeltaFlores.web.dto.PlantaDto;
import DeltaFlores.web.dto.SalaDto;
import DeltaFlores.web.dto.UserDto;
import DeltaFlores.web.entities.Favorite;
import DeltaFlores.web.entities.User;
import DeltaFlores.web.exception.ResourceAlreadyExistsException;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.*;
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
    private final PlantaRepository plantaRepository;
    private final SalaRepository salaRepository;

    private User getCurrentUser() {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado en el contexto de seguridad"));
    }

    @Transactional
    public void addFavorite(Long entityId, String entityType) {
        User currentUser = getCurrentUser();
        log.info("Usuario '{}' intentando agregar {} ID: {} a favoritos.", currentUser.getUsername(), entityType, entityId);

        // Validate that the target entity exists
        validateEntityExists(entityId, entityType);

        if (favoriteRepository.findByUserIdAndFavorableIdAndFavorableType(currentUser.getId(), entityId, entityType).isPresent()) {
            throw new ResourceAlreadyExistsException("Este item ya está en tus favoritos.");
        }

        Favorite favorite = new Favorite(currentUser, entityId, entityType);
        favoriteRepository.save(favorite);
        log.info("{} ID: {} agregado a favoritos para el usuario '{}'.", entityType, entityId, currentUser.getUsername());
    }

    @Transactional
    public void removeFavorite(Long entityId, String entityType) {
        User currentUser = getCurrentUser();
        log.info("Usuario '{}' intentando remover {} ID: {} de favoritos.", currentUser.getUsername(), entityType, entityId);

        Favorite favorite = favoriteRepository.findByUserIdAndFavorableIdAndFavorableType(currentUser.getId(), entityId, entityType)
                .orElseThrow(() -> new ResourceNotFoundException("Este item no se encuentra en tus favoritos."));

        favoriteRepository.delete(favorite);
        log.info("{} ID: {} removido de favoritos para el usuario '{}'.", entityType, entityId, currentUser.getUsername());
    }

    @Transactional(readOnly = true)
    public List<PlantaDto> getFavoritePlantas() {
        User currentUser = getCurrentUser();
        List<Long> plantIds = favoriteRepository.findFavorableIdsByUserIdAndFavorableType(currentUser.getId(), "PLANTA");
        return plantaRepository.findAllById(plantIds).stream()
                .map(DtoMapper::plantaToPlantaDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SalaDto> getFavoriteSalas() {
        User currentUser = getCurrentUser();
        List<Long> salaIds = favoriteRepository.findFavorableIdsByUserIdAndFavorableType(currentUser.getId(), "SALA");
        return salaRepository.findAllById(salaIds).stream()
                .map(DtoMapper::salaToSalaDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserDto> getFavoriteUsers() {
        User currentUser = getCurrentUser();
        List<Long> userIds = favoriteRepository.findFavorableIdsByUserIdAndFavorableType(currentUser.getId(), "USER");
        return userRepository.findAllById(userIds).stream()
                .map(DtoMapper::userToUserDto)
                .collect(Collectors.toList());
    }

    private void validateEntityExists(Long entityId, String entityType) {
        boolean exists;
        switch (entityType.toUpperCase()) {
            case "PLANTA":
                exists = plantaRepository.existsById(entityId);
                break;
            case "SALA":
                exists = salaRepository.existsById(entityId);
                break;
            case "USER":
                exists = userRepository.existsById(entityId);
                break;
            default:
                throw new IllegalArgumentException("Tipo de entidad no soportada para favoritos: " + entityType);
        }
        if (!exists) {
            throw new ResourceNotFoundException("La entidad de tipo " + entityType + " con ID " + entityId + " no fue encontrada.");
        }
    }
}
