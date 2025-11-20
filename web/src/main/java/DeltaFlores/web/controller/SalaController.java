package DeltaFlores.web.controller;

import DeltaFlores.web.dto.SalaDto;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.service.SalaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/salas") // Changed to /api/salas for consistency
@RequiredArgsConstructor
@Log4j2
public class SalaController {

    private final SalaService salaService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SalaDto> createSala(@RequestBody SalaDto salaDto) {
        log.info("\n\n[Capa Controller] \uD83C\uDFE0 Solicitud para crear sala: {}", salaDto.getNombre());
        try {
            SalaDto createdSala = salaService.createSala(salaDto);
            log.info("\n\n[Capa Controller] \u2705 Sala {} creada con éxito con ID: {}", createdSala.getNombre(), createdSala.getId());
            return new ResponseEntity<>(createdSala, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error inesperado al crear sala {}: {}", salaDto.getNombre(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<SalaDto>> getAllSalas() {
        log.info("\n\n[Capa Controller] \uD83D\uDD0D Solicitud para obtener todas las salas.");
        try {
            List<SalaDto> salas = salaService.getAllSalas();
            log.info("\n\n[Capa Controller] \u2705 {} salas obtenidas con éxito.", salas.size());
            return ResponseEntity.ok(salas);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error inesperado al obtener salas: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<SalaDto> getSalaById(@PathVariable Long id) {
        log.info("\n\n[Capa Controller] \uD83D\uDD0D Solicitud para obtener sala con ID: {}", id);
        try {
            SalaDto sala = salaService.getSalaById(id);
            log.info("\n\n[Capa Controller] \u2705 Sala con ID: {} obtenida con éxito.", id);
            return ResponseEntity.ok(sala);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] \u26A0\uFE0F Sala con ID: {} no encontrada.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al obtener sala con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SalaDto> updateSala(@PathVariable Long id, @RequestBody SalaDto salaDto) {
        log.info("\n\n[Capa Controller] \u2B06\uFE0F Solicitud para actualizar sala con ID: {}", id);
        try {
            SalaDto updatedSala = salaService.updateSala(id, salaDto);
            log.info("\n\n[Capa Controller] \u2705 Sala con ID: {} actualizada con éxito.", id);
            return ResponseEntity.ok(updatedSala);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] \u26A0\uFE0F Sala con ID: {} no encontrada para actualizar.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al actualizar sala con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteSala(@PathVariable Long id) {
        log.info("\n\n[Capa Controller] \uD83D\uDDD1\uFE0F Solicitud para eliminar sala con ID: {}", id);
        try {
            salaService.deleteSala(id);
            log.info("\n\n[Capa Controller] \u2705 Sala con ID: {} eliminada con éxito.", id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] \u26A0\uFE0F Sala con ID: {} no encontrada para eliminar.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al eliminar sala con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
