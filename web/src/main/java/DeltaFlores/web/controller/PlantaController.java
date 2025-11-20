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
@RequestMapping("/api/plantas") // Changed to /api/plantas for consistency
@RequiredArgsConstructor
@Log4j2
public class PlantaController {

    private final PlantaService plantaService;

    @PostMapping
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<PlantaDto> createPlanta(@RequestBody PlantaDto plantaDto) {
        log.info("\n\n[Capa Controller] \uD83C\uDF3F Solicitud para crear planta: {}", plantaDto.getNombre());
        try {
            PlantaDto createdPlanta = plantaService.createPlanta(plantaDto);
            log.info("\n\n[Capa Controller] \u2705 Planta {} creada con éxito con ID: {}", createdPlanta.getNombre(), createdPlanta.getId());
            return new ResponseEntity<>(createdPlanta, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error inesperado al crear planta {}: {}", plantaDto.getNombre(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<PlantaDto>> listarPlantas() {
        log.info("\n\n[Capa Controller] \uD83D\uDD0D Solicitud para listar todas las plantas.");
        try {
            List<PlantaDto> plantas = plantaService.listarPlantas();
            log.info("\n\n[Capa Controller] \u2705 {} plantas obtenidas con éxito.", plantas.size());
            return ResponseEntity.ok(plantas);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error inesperado al listar plantas: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<PlantaDto> obtenerPlantaPorId(@PathVariable Long id) {
        log.info("\n\n[Capa Controller] \uD83D\uDD0D Solicitud para obtener planta con ID: {}", id);
        try {
            PlantaDto planta = plantaService.obtenerPlantaPorId(id);
            log.info("\n\n[Capa Controller] \u2705 Planta con ID: {} obtenida con éxito.", id);
            return ResponseEntity.ok(planta);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] \u26A0\uFE0F Planta con ID: {} no encontrada.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al obtener planta con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<PlantaDto> updatePlanta(@PathVariable Long id, @RequestBody PlantaDto plantaDto) {
        log.info("\n\n[Capa Controller] \u2B06\uFE0F Solicitud para actualizar planta con ID: {}", id);
        try {
            PlantaDto updatedPlanta = plantaService.updatePlanta(id, plantaDto);
            log.info("\n\n[Capa Controller] \u2705 Planta con ID: {} actualizada con éxito.", id);
            return ResponseEntity.ok(updatedPlanta);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] \u26A0\uFE0F Planta con ID: {} no encontrada para actualizar.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al actualizar planta con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')") // Solo ADMIN puede eliminar plantas
    public ResponseEntity<Void> eliminarPlanta(@PathVariable Long id) {
        log.info("\n\n[Capa Controller] \uD83D\uDDD1\uFE0F Solicitud para eliminar planta con ID: {}", id);
        try {
            plantaService.eliminarPlanta(id);
            log.info("\n\n[Capa Controller] \u2705 Planta con ID: {} eliminada con éxito.", id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] \u26A0\uFE0F Planta con ID: {} no encontrada para eliminar.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al eliminar planta con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<PlantaDto>> buscarPlantasPorPalabraClave(@RequestParam String palabraClave) {
        log.info("\n\n[Capa Controller] \uD83D\uDD0D Solicitud para buscar plantas por palabra clave: {}", palabraClave);
        try {
            List<PlantaDto> plantas = plantaService.buscarPlantasPorPalabraClave(palabraClave);
            log.info("\n\n[Capa Controller] \u2705 {} plantas encontradas para palabra clave '{}'.", plantas.size(), palabraClave);
            return ResponseEntity.ok(plantas);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al buscar plantas por palabra clave '{}': {}", palabraClave, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/sala/{salaId}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<PlantaDto>> plantasPorSala(@PathVariable Long salaId) {
        log.info("\n\n[Capa Controller] \uD83D\uDD0D Solicitud para buscar plantas por ID de sala: {}", salaId);
        try {
            List<PlantaDto> plantas = plantaService.plantasPorSala(salaId);
            log.info("\n\n[Capa Controller] \u2705 {} plantas encontradas para sala ID: {}.", plantas.size(), salaId);
            return ResponseEntity.ok(plantas);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al buscar plantas por sala ID {}: {}", salaId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
