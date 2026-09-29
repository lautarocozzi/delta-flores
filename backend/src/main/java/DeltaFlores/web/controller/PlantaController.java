package DeltaFlores.web.controller;

import DeltaFlores.web.dto.PlantaDto;
import DeltaFlores.web.dto.UbicacionRequest;
import DeltaFlores.web.exception.ResourceAlreadyExistsException;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.service.PlantaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/plantas")
@RequiredArgsConstructor
@Log4j2
public class PlantaController {

    private final PlantaService plantaService;

    @PostMapping
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<PlantaDto> createPlanta(@RequestBody @Valid PlantaDto plantaDto) {
        log.info("DEBUG: Payload de PlantaDto recibido: " + plantaDto.toString());
        log.info("\n\n[Capa Controller] 📥 Solicitud para crear planta: {}", plantaDto.getNombre());
        try {
            PlantaDto createdPlanta = plantaService.createPlanta(plantaDto);
            log.info("\n\n[Capa Controller] ✅ Planta {} creada con éxito con ID: {}", createdPlanta.getNombre(), createdPlanta.getId());
            return new ResponseEntity<>(createdPlanta, HttpStatus.CREATED);
        } catch (AccessDeniedException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Acceso denegado al crear planta: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error inesperado al crear planta {}: {}", plantaDto.getNombre(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<PlantaDto>> getAllPlantas() {
        log.info("\n\n[Capa Controller] 📖 Solicitud para listar todas las plantas accesibles.");
        try {
            List<PlantaDto> plantas = plantaService.getAllPlantas();
            log.info("\n\n[Capa Controller] ✅ {} plantas obtenidas con éxito.", plantas.size());
            return ResponseEntity.ok(plantas);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error inesperado al listar plantas: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/public")
    public ResponseEntity<List<PlantaDto>> getPublicPlantas() {
        log.info("\n\n[Capa Controller] 🌐 Solicitud para listar plantas públicas.");
        try {
            List<PlantaDto> plantas = plantaService.getPublicPlantas();
            log.info("\n\n[Capa Controller] ✅ {} plantas públicas obtenidas con éxito.", plantas.size());
            return ResponseEntity.ok(plantas);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al listar plantas públicas: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<PlantaDto> getPlantaById(@PathVariable Long id) {
        log.info("\n\n[Capa Controller] 🆔 Solicitud para obtener planta con ID: {}", id);
        try {
            PlantaDto planta = plantaService.getPlantaById(id);
            log.info("\n\n[Capa Controller] ✅ Planta con ID: {} obtenida con éxito.", id);
            return ResponseEntity.ok(planta);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Planta con ID: {} no encontrada.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (AccessDeniedException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Acceso denegado a planta ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener planta con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<PlantaDto> updatePlanta(@PathVariable Long id, @RequestBody @Valid PlantaDto plantaDto) {
        log.info("\n\n[Capa Controller] 🔄 Solicitud para actualizar planta con ID: {}", id);
        try {
            PlantaDto updatedPlanta = plantaService.updatePlanta(id, plantaDto);
            log.info("\n\n[Capa Controller] ✅ Planta con ID: {} actualizada con éxito.", id);
            return ResponseEntity.ok(updatedPlanta);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Planta con ID: {} no encontrada para actualizar.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (AccessDeniedException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Acceso denegado al actualizar planta ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al actualizar planta con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> deletePlanta(@PathVariable Long id) {
        log.info("\n\n[Capa Controller] 🗑️ Solicitud para eliminar planta con ID: {}", id);
        try {
            plantaService.deletePlanta(id);
            log.info("\n\n[Capa Controller] ✅ Planta con ID: {} eliminada con éxito.", id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Planta con ID: {} no encontrada para eliminar.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (AccessDeniedException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Acceso denegado al eliminar planta ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al eliminar planta con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}/toggle-public")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<PlantaDto> togglePublicStatus(@PathVariable Long id) {
        log.info("[Capa Controller] Solicitud para cambiar visibilidad de la planta ID: {}", id);
        try {
            PlantaDto updatedPlanta = plantaService.togglePublicStatus(id);
            log.info("\n\n[Capa Controller] ✅ Visibilidad de la planta ID: {} cambiada a: {}", id, updatedPlanta.isPublic());
            return ResponseEntity.ok(updatedPlanta);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Planta con ID: {} no encontrada para cambiar visibilidad.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (AccessDeniedException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Acceso denegado al cambiar visibilidad de planta ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al cambiar visibilidad de la planta ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}/ubicacion")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<PlantaDto> updateUbicacion(@PathVariable Long id, @RequestBody @Valid UbicacionRequest request) {
        log.info("Solicitud para actualizar ubicación de planta ID: {}", id);
        try {
            PlantaDto updated = plantaService.updateUbicacion(id, request.getZonaId(), request.getColumna(), request.getFila());
            log.info("Ubicación de planta ID: {} actualizada con éxito.", id);
            return ResponseEntity.ok(updated);
        } catch (ResourceNotFoundException e) {
            log.warn("Recurso no encontrado al actualizar ubicación de planta {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (ResourceAlreadyExistsException e) {
            log.warn("Conflicto de celda al actualizar ubicación de planta {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (AccessDeniedException e) {
            log.warn("Acceso denegado al actualizar ubicación de planta {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (IllegalArgumentException e) {
            log.warn("Argumento inválido al actualizar ubicación de planta {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Error al actualizar ubicación de planta ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<PlantaDto>> searchPlantasByKeyword(@RequestParam String palabraClave) {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para buscar plantas por palabra clave: {}", palabraClave);
        try {
            List<PlantaDto> plantas = plantaService.buscarPlantasPorPalabraClave(palabraClave);
            log.info("\n\n[Capa Controller] ✅ {} plantas encontradas para palabra clave '{}'.", plantas.size(), palabraClave);
            return ResponseEntity.ok(plantas);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al buscar plantas por palabra clave '{}': {}", palabraClave, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/sala/{salaId}")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<PlantaDto>> getPlantasBySala(@PathVariable Long salaId) {
        log.info("\n\n[Capa Controller] Solicitud para buscar plantas por ID de sala: {}", salaId);
        try {
            List<PlantaDto> plantas = plantaService.plantasPorSala(salaId);
            log.info("\n\n[Capa Controller] ✅ {} plantas encontradas para sala ID: {}.", plantas.size(), salaId);
            return ResponseEntity.ok(plantas);
        } catch (AccessDeniedException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Acceso denegado a sala ID {}: {}", salaId, e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al buscar plantas por sala ID {}: {}", salaId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<PlantaDto>> getPlantasByUserId(@PathVariable Long userId) {
        log.info("\n\n[Capa Controller] Solicitud de ADMIN para obtener todas las plantas del usuario con ID: {}", userId);
        try {
            List<PlantaDto> plantas = plantaService.getPlantasByUserId(userId);
            log.info("\n\n[Capa Controller] {} plantas obtenidas con éxito para el usuario con ID: {}", plantas.size(), userId);
            return ResponseEntity.ok(plantas);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener las plantas para el usuario con ID {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{plantaId1}/swap/{plantaId2}")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> swapPlantasUbicacion(
            @PathVariable Long plantaId1,
            @PathVariable Long plantaId2) {
        log.info("Solicitud para swap ubicación plantas {} y {}", plantaId1, plantaId2);
        try {
            plantaService.swapPlantasUbicacion(plantaId1, plantaId2);
            return ResponseEntity.ok().build();
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            log.error("Error al swap ubicación plantas {} y {}: {}", plantaId1, plantaId2, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
