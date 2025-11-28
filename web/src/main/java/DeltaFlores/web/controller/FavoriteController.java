package DeltaFlores.web.controller;

import DeltaFlores.web.dto.PlantaDto;
import DeltaFlores.web.exception.ResourceAlreadyExistsException;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api") // Base path for the new RESTful endpoints
@RequiredArgsConstructor
@Log4j2
public class FavoriteController {

    private final FavoriteService favoriteService;

    /**
     * Adds a plant to the current user's favorites.
     * The user must have permission to view the plant (i.e., it's public or they own it).
     * @param plantaId The ID of the plant to favorite.
     * @return A response entity indicating success or failure.
     */
    @PostMapping("/plantas/{plantaId}/favorite")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> addFavorite(@PathVariable Long plantaId) {
        log.info("\n\n[Capa Controller] ❤️ Solicitud para agregar planta ID: {} a favoritos.", plantaId);
        try {
            favoriteService.addFavorite(plantaId);
            log.info("\n\n[Capa Controller] ✅ Planta ID: {} agregada a favoritos con éxito.", plantaId);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (ResourceNotFoundException | ResourceAlreadyExistsException e) {
            log.warn("\n\n[Capa Controller] ⚠️ No se pudo agregar el favorito: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error inesperado al agregar favorito para planta ID: {}: {}", plantaId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Removes a plant from the current user's favorites.
     * @param plantaId The ID of the plant to unfavorite.
     * @return A response entity indicating success.
     */
    @DeleteMapping("/plantas/{plantaId}/favorite")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> removeFavorite(@PathVariable Long plantaId) {
        log.info("\n\n[Capa Controller] 💔 Solicitud para eliminar planta ID: {} de favoritos.", plantaId);
        try {
            favoriteService.removeFavorite(plantaId);
            log.info("\n\n[Capa Controller] ✅ Planta ID: {} eliminada de favoritos con éxito.", plantaId);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] ⚠️ No se pudo eliminar el favorito: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error inesperado al eliminar favorito para planta ID: {}: {}", plantaId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Retrieves all favorite plants for the currently authenticated user.
     * @return A list of PlantaDto representing the user's favorite plants.
     */
    @GetMapping("/me/favorites")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<PlantaDto>> getMyFavorites() {
        log.info("\n\n[Capa Controller] ⭐ Solicitud para obtener los favoritos del usuario actual.");
        try {
            List<PlantaDto> favoritos = favoriteService.getMyFavorites();
            log.info("\n\n[Capa Controller] ✅ {} favoritos encontrados para el usuario actual.", favoritos.size());
            return ResponseEntity.ok(favoritos);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error inesperado al obtener favoritos: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
