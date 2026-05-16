package DeltaFlores.web.controller;

import DeltaFlores.web.dto.PruningEventDto;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.service.events.PruningEventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/events/pruning")
@RequiredArgsConstructor
@Log4j2
public class PruningEventController {

    private final PruningEventService pruningEventService;

    @PostMapping
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<PruningEventDto> createPruningEvent(@RequestBody PruningEventDto pruningEventDto) {
        log.info("\n\n[Capa Controller] 🌲 Solicitud para crear evento de poda.");
        try {
            PruningEventDto createdEvent = pruningEventService.createPruningEvent(pruningEventDto);
            log.info("\n\n[Capa Controller] ✅ Evento de poda creado con éxito con ID: {}", createdEvent.getId());
            return new ResponseEntity<>(createdEvent, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error inesperado al crear evento de poda: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<PruningEventDto> getPruningEventById(@PathVariable Long id) {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener evento de poda con ID: {}", id);
        try {
            PruningEventDto event = pruningEventService.getPruningEventById(id);
            log.info("\n\n[Capa Controller] ✅ Evento de poda con ID: {} obtenido con éxito.", id);
            return ResponseEntity.ok(event);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Evento de poda con ID: {} no encontrado.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener evento de poda con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<PruningEventDto>> getAllPruningEvents() {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener todos los eventos de poda.");
        try {
            List<PruningEventDto> events = pruningEventService.getAllPruningEvents();
            log.info("\n\n[Capa Controller] ✅ {} eventos de poda obtenidos con éxito.", events.size());
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener todos los eventos de poda: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/planta/{plantaId}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<PruningEventDto>> getPruningEventsByPlantaId(@PathVariable Long plantaId) {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener eventos de poda por ID de planta: {}", plantaId);
        try {
            List<PruningEventDto> events = pruningEventService.getPruningEventsByPlantaId(plantaId);
            log.info("\n\n[Capa Controller] ✅ {} eventos de poda obtenidos para planta ID: {}.", events.size(), plantaId);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener eventos de poda por planta ID {}: {}", plantaId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/by-date/{fecha}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<PruningEventDto>> getPruningEventsByFecha(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener eventos de poda para la fecha: {}", fecha);
        try {
            List<PruningEventDto> events = pruningEventService.getPruningEventsByFecha(fecha);
            log.info("\n\n[Capa Controller] ✅ {} eventos de poda obtenidos para la fecha: {}.", events.size(), fecha);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener eventos de poda para la fecha {}: {}", fecha, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/by-date-after/{fecha}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<PruningEventDto>> getPruningEventsByFechaAfter(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener eventos de poda posteriores a la fecha: {}", fecha);
        try {
            List<PruningEventDto> events = pruningEventService.getPruningEventsByFechaAfter(fecha);
            log.info("\n\n[Capa Controller] ✅ {} eventos de poda obtenidos posteriores a la fecha: {}.", events.size(), fecha);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener eventos de poda posteriores a la fecha {}: {}", fecha, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<PruningEventDto> updatePruningEvent(@PathVariable Long id, @RequestBody PruningEventDto pruningEventDto) {
        log.info("\n\n[Capa Controller] ⬆️ Solicitud para actualizar evento de poda con ID: {}", id);
        try {
            PruningEventDto updatedEvent = pruningEventService.updatePruningEvent(id, pruningEventDto);
            log.info("\n\n[Capa Controller] ✅ Evento de poda con ID: {} actualizado con éxito.", id);
            return ResponseEntity.ok(updatedEvent);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Evento de poda con ID: {} no encontrado para actualizar.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al actualizar evento de poda con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<Void> deletePruningEvent(@PathVariable Long id) {
        log.info("\n\n[Capa Controller] 🗑️ Solicitud para eliminar evento de poda con ID: {}", id);
        try {
            pruningEventService.deletePruningEvent(id);
            log.info("\n\n[Capa Controller] ✅ Evento de poda con ID: {} eliminado con éxito.", id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Evento de poda con ID: {} no encontrado para eliminar.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al eliminar evento de poda con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
