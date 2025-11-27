package DeltaFlores.web.controller;

import DeltaFlores.web.dto.PlantaDto;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.service.PlantaService;
import lombok.RequiredArgsConstructor;
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
    public ResponseEntity<PlantaDto> createPlanta(@RequestBody PlantaDto plantaDto) {
        log.info("[Capa Controller] Solicitud para crear planta: {}", plantaDto.getNombre());
        try {
            PlantaDto createdPlanta = plantaService.createPlanta(plantaDto);
            log.info("[Capa Controller] Planta {} creada con éxito con ID: {}", createdPlanta.getNombre(), createdPlanta.getId());
            return new ResponseEntity<>(createdPlanta, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("[Capa Controller] Error inesperado al crear planta {}: {}", plantaDto.getNombre(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<PlantaDto>> getAllPlantas() {
        log.info("[Capa Controller] Solicitud para listar todas las plantas accesibles.");
        try {
            List<PlantaDto> plantas = plantaService.getAllPlantas();
            log.info("[Capa Controller] {} plantas obtenidas con éxito.", plantas.size());
            return ResponseEntity.ok(plantas);
        } catch (Exception e) {
            log.error("[Capa Controller] Error inesperado al listar plantas: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<PlantaDto> getPlantaById(@PathVariable Long id) {
        log.info("[Capa Controller] Solicitud para obtener planta con ID: {}", id);
        try {
            PlantaDto planta = plantaService.getPlantaById(id);
            log.info("[Capa Controller] Planta con ID: {} obtenida con éxito.", id);
            return ResponseEntity.ok(planta);
        } catch (ResourceNotFoundException e) {
            log.warn("[Capa Controller] Planta con ID: {} no encontrada.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("[Capa Controller] Error al obtener planta con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<PlantaDto> updatePlanta(@PathVariable Long id, @RequestBody PlantaDto plantaDto) {
        log.info("[Capa Controller] Solicitud para actualizar planta con ID: {}", id);
        try {
            PlantaDto updatedPlanta = plantaService.updatePlanta(id, plantaDto);
            log.info("[Capa Controller] Planta con ID: {} actualizada con éxito.", id);
            return ResponseEntity.ok(updatedPlanta);
        } catch (ResourceNotFoundException e) {
            log.warn("[Capa Controller] Planta con ID: {} no encontrada para actualizar.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("[Capa Controller] Error al actualizar planta con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> deletePlanta(@PathVariable Long id) {
        log.info("[Capa Controller] Solicitud para eliminar planta con ID: {}", id);
        try {
            plantaService.deletePlanta(id);
            log.info("[Capa Controller] Planta con ID: {} eliminada con éxito.", id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            log.warn("[Capa Controller] Planta con ID: {} no encontrada para eliminar.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("[Capa Controller] Error al eliminar planta con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<PlantaDto>> searchPlantasByKeyword(@RequestParam String palabraClave) {
        log.info("[Capa Controller] Solicitud para buscar plantas por palabra clave: {}", palabraClave);
        try {
            List<PlantaDto> plantas = plantaService.buscarPlantasPorPalabraClave(palabraClave);
            log.info("[Capa Controller] {} plantas encontradas para palabra clave '{}'.", plantas.size(), palabraClave);
            return ResponseEntity.ok(plantas);
        } catch (Exception e) {
            log.error("[Capa Controller] Error al buscar plantas por palabra clave '{}': {}", palabraClave, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/sala/{salaId}")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<PlantaDto>> getPlantasBySala(@PathVariable Long salaId) {
        log.info("[Capa Controller] Solicitud para buscar plantas por ID de sala: {}", salaId);
        try {
            List<PlantaDto> plantas = plantaService.plantasPorSala(salaId);
            log.info("[Capa Controller] {} plantas encontradas para sala ID: {}.", plantas.size(), salaId);
            return ResponseEntity.ok(plantas);
        } catch (Exception e) {
            log.error("[Capa Controller] Error al buscar plantas por sala ID {}: {}", salaId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
