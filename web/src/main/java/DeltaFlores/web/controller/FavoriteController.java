package DeltaFlores.web.controller;

import DeltaFlores.web.dto.PlantaDto;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/favoritos")
@RequiredArgsConstructor
@Log4j2
public class FavoriteController {

    private final FavoriteService favoriteService;

    // Endpoint para agregar/quitar un favorito (toggle)
    @PostMapping
    public ResponseEntity<PlantaDto> toggleFavorite(@RequestBody PlantaDto plantaDto) {
        log.info("\n\n[Capa Controller] \uD83D\uDDA4 Solicitud para agregar/quitar favorito para la planta ID: {}", plantaDto.getId());
        try {
            PlantaDto updatedPlanta = favoriteService.saveFavorite(plantaDto);
            log.info("\n\n[Capa Controller] \u2705 Operación de favorito completada para la planta ID: {}", plantaDto.getId());
            return ResponseEntity.ok(updatedPlanta);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error en toggle de favorito: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Endpoint para listar los favoritos de un usuario
    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<PlantaDto>> getFavoritesByUserId(@PathVariable Long usuarioId) {
        log.info("\n\n[Capa Controller] \uD83D\uDD0E Solicitud para listar favoritos del usuario ID: {}", usuarioId);
        try {
            List<PlantaDto> favoritos = favoriteService.listarFavoritos(usuarioId);
            log.info("\n\n[Capa Controller] \u2705 {} favoritos encontrados para el usuario ID: {}", favoritos.size(), usuarioId);
            return ResponseEntity.ok(favoritos);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al listar favoritos: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Endpoint para eliminar un favorito explícitamente
    @DeleteMapping("/planta/{plantaId}")
    public ResponseEntity<Void> deleteFavorite(@PathVariable Long plantaId) {
        log.info("\n\n[Capa Controller] \uD83D\uDDD1\uFE0F Solicitud para eliminar favorito por planta ID: {}", plantaId);
        try {
            favoriteService.eliminarFavorito(plantaId);
            log.info("\n\n[Capa Controller] \u2705 Favorito para la planta ID: {} eliminado con éxito.", plantaId);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] \u26A0\uFE0F No se pudo eliminar, recurso no encontrado: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al eliminar favorito: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
