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
@RequestMapping("/api/salas")
@RequiredArgsConstructor
@Log4j2
public class SalaController {

    private final SalaService salaService;

    @PostMapping
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<SalaDto> createSala(@RequestBody SalaDto salaDto) {
        log.info("\n\n[Capa Controller] 📥 Solicitud para crear sala: {}", salaDto.getNombre());
        try {
            SalaDto createdSala = salaService.createSala(salaDto);
            log.info("\n\n[Capa Controller] ✅ Sala {} creada con éxito con ID: {}", createdSala.getNombre(), createdSala.getId());
            return new ResponseEntity<>(createdSala, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error inesperado al crear sala {}: {}", salaDto.getNombre(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<SalaDto>> getAllSalas() {
        log.info("\n\n[Capa Controller] 📖 Solicitud para obtener todas las salas accesibles por el usuario.");
        try {
            List<SalaDto> salas = salaService.getAllSalas();
            log.info("\n\n[Capa Controller] ✅ {} salas obtenidas con éxito.", salas.size());
            return ResponseEntity.ok(salas);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error inesperado al obtener salas: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<SalaDto> getSalaById(@PathVariable Long id) {
        log.info("\n\n[Capa Controller] 🆔 Solicitud para obtener sala con ID: {}", id);
        try {
            SalaDto sala = salaService.getSalaById(id);
            log.info("\n\n[Capa Controller] ✅ Sala con ID: {} obtenida con éxito.", id);
            return ResponseEntity.ok(sala);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Sala con ID: {} no encontrada.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener sala con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<SalaDto> updateSala(@PathVariable Long id, @RequestBody SalaDto salaDto) {
        log.info("\n\n[Capa Controller] 🔄 Solicitud para actualizar sala con ID: {}", id);
        try {
            SalaDto updatedSala = salaService.updateSala(id, salaDto);
            log.info("\n\n[Capa Controller] ✅ Sala con ID: {} actualizada con éxito.", id);
            return ResponseEntity.ok(updatedSala);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Sala con ID: {} no encontrada para actualizar.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al actualizar sala con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> deleteSala(@PathVariable Long id) {
        log.info("\n\n[Capa Controller] 🗑️ Solicitud para eliminar sala con ID: {}", id);
        try {
            salaService.deleteSala(id);
            log.info("\n\n[Capa Controller] ✅ Sala con ID: {} eliminada con éxito.", id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Sala con ID: {} no encontrada para eliminar.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al eliminar sala con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
