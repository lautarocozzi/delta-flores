package DeltaFlores.web.controller;

import DeltaFlores.web.dto.PlantaDto;
import DeltaFlores.web.dto.SalaDto;
import DeltaFlores.web.dto.UserDto;
import DeltaFlores.web.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
@Log4j2
@PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
public class FavoriteController {

    private final FavoriteService favoriteService;

    // --- Add to Favorites ---

    @PostMapping("/plantas/{id}")
    public ResponseEntity<Void> addFavoritePlanta(@PathVariable Long id) {
        log.info("❤️ Solicitud para agregar planta ID: {} a favoritos.", id);
        favoriteService.addFavorite(id, "PLANTA");
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/salas/{id}")
    public ResponseEntity<Void> addFavoriteSala(@PathVariable Long id) {
        log.info("❤️ Solicitud para agregar sala ID: {} a favoritos.", id);
        favoriteService.addFavorite(id, "SALA");
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/users/{id}")
    public ResponseEntity<Void> addFavoriteUser(@PathVariable Long id) {
        log.info("❤️ Solicitud para agregar usuario ID: {} a favoritos.", id);
        favoriteService.addFavorite(id, "USER");
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // --- Remove from Favorites ---

    @DeleteMapping("/plantas/{id}")
    public ResponseEntity<Void> removeFavoritePlanta(@PathVariable Long id) {
        log.info("💔 Solicitud para eliminar planta ID: {} de favoritos.", id);
        favoriteService.removeFavorite(id, "PLANTA");
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/salas/{id}")
    public ResponseEntity<Void> removeFavoriteSala(@PathVariable Long id) {
        log.info("💔 Solicitud para eliminar sala ID: {} de favoritos.", id);
        favoriteService.removeFavorite(id, "SALA");
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> removeFavoriteUser(@PathVariable Long id) {
        log.info("💔 Solicitud para eliminar usuario ID: {} de favoritos.", id);
        favoriteService.removeFavorite(id, "USER");
        return ResponseEntity.noContent().build();
    }

    // --- Get Favorites by Type ---

    @GetMapping("/plantas")
    public ResponseEntity<List<PlantaDto>> getFavoritePlantas() {
        log.info("⭐ Solicitud para obtener las plantas favoritas del usuario actual.");
        List<PlantaDto> favoritos = favoriteService.getFavoritePlantas();
        return ResponseEntity.ok(favoritos);
    }

    @GetMapping("/salas")
    public ResponseEntity<List<SalaDto>> getFavoriteSalas() {
        log.info("⭐ Solicitud para obtener las salas favoritas del usuario actual.");
        List<SalaDto> favoritos = favoriteService.getFavoriteSalas();
        return ResponseEntity.ok(favoritos);
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getFavoriteUsers() {
        log.info("⭐ Solicitud para obtener los usuarios favoritos del usuario actual.");
        List<UserDto> favoritos = favoriteService.getFavoriteUsers();
        return ResponseEntity.ok(favoritos);
    }
}
