package DeltaFlores.web.controller;

import DeltaFlores.web.dto.DefoliationEventDto;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.service.events.DefoliationEventService;
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
@RequestMapping("/api/events/defoliation")
@RequiredArgsConstructor
@Log4j2
public class DefoliationEventController {

    private final DefoliationEventService defoliationEventService;

    @PostMapping
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<DefoliationEventDto> createDefoliationEvent(@RequestBody DefoliationEventDto defoliationEventDto) {
        log.info("\n\n[Capa Controller] \uD83C\uDF3F Solicitud para crear evento de defoliación.");
        try {
            DefoliationEventDto createdEvent = defoliationEventService.createDefoliationEvent(defoliationEventDto);
            log.info("\n\n[Capa Controller] \u2705 Evento de defoliación creado con éxito con ID: {}", createdEvent.getId());
            return new ResponseEntity<>(createdEvent, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error inesperado al crear evento de defoliation: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<DefoliationEventDto> getDefoliationEventById(@PathVariable Long id) {
        log.info("\n\n[Capa Controller] \uD83D\uDD0E Solicitud para obtener evento de defoliación con ID: {}", id);
        try {
            DefoliationEventDto event = defoliationEventService.getDefoliationEventById(id);
            log.info("\n\n[Capa Controller] \u2705 Evento de defoliación con ID: {} obtenido con éxito.", id);
            return ResponseEntity.ok(event);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] \u26A0\uFE0F Evento de defoliación con ID: {} no encontrado.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al obtener evento de defoliación con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<DefoliationEventDto>> getAllDefoliationEvents() {
        log.info("\n\n[Capa Controller] \uD83D\uDD0E Solicitud para obtener todos los eventos de defoliación.");
        try {
            List<DefoliationEventDto> events = defoliationEventService.getAllDefoliationEvents();
            log.info("\n\n[Capa Controller] \u2705 {} eventos de defoliación obtenidos con éxito.", events.size());
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al obtener todos los eventos de defoliación: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/planta/{plantaId}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<DefoliationEventDto>> getDefoliationEventsByPlantaId(@PathVariable Long plantaId) {
        log.info("\n\n[Capa Controller] \uD83D\uDD0E Solicitud para obtener eventos de defoliación por ID de planta: {}", plantaId);
        try {
            List<DefoliationEventDto> events = defoliationEventService.getDefoliationEventsByPlantaId(plantaId);
            log.info("\n\n[Capa Controller] \u2705 {} eventos de defoliación obtenidos para planta ID: {}.", events.size(), plantaId);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al obtener eventos de defoliación por planta ID {}: {}", plantaId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/by-date/{fecha}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<DefoliationEventDto>> getDefoliationEventsByFecha(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        log.info("\n\n[Capa Controller] \uD83D\uDD0E Solicitud para obtener eventos de defoliación para la fecha: {}", fecha);
        try {
            List<DefoliationEventDto> events = defoliationEventService.getDefoliationEventsByFecha(fecha);
            log.info("\n\n[Capa Controller] \u2705 {} eventos de defoliación obtenidos para la fecha: {}.", events.size(), fecha);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al obtener eventos de defoliación para la fecha {}: {}", fecha, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/by-date-after/{fecha}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<DefoliationEventDto>> getDefoliationEventsByFechaAfter(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        log.info("\n\n[Capa Controller] \uD83D\uDD0E Solicitud para obtener eventos de defoliación posteriores a la fecha: {}", fecha);
        try {
            List<DefoliationEventDto> events = defoliationEventService.getDefoliationEventsByFechaAfter(fecha);
            log.info("\n\n[Capa Controller] \u2705 {} eventos de defoliación obtenidos posteriores a la fecha: {}.", events.size(), fecha);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al obtener eventos de defoliación posteriores a la fecha {}: {}", fecha, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<DefoliationEventDto> updateDefoliationEvent(@PathVariable Long id, @RequestBody DefoliationEventDto defoliationEventDto) {
        log.info("\n\n[Capa Controller] \u2B06\uFE0F Solicitud para actualizar evento de defoliación con ID: {}", id);
        try {
            DefoliationEventDto updatedEvent = defoliationEventService.updateDefoliationEvent(id, defoliationEventDto);
            log.info("\n\n[Capa Controller] \u2705 Evento de defoliación con ID: {} actualizado con éxito.", id);
            return ResponseEntity.ok(updatedEvent);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] \u26A0\uFE0F Evento de defoliación con ID: {} no encontrado para actualizar.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al actualizar evento de defoliación con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteDefoliationEvent(@PathVariable Long id) {
        log.info("\n\n[Capa Controller] \uD83D\uDDD1\uFE0F Solicitud para eliminar evento de defoliación con ID: {}", id);
        try {
            defoliationEventService.deleteDefoliationEvent(id);
            log.info("\n\n[Capa Controller] \u2705 Evento de defoliación con ID: {} eliminado con éxito.", id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] \u26A0\uFE0F Evento de defoliación con ID: {} no encontrado para eliminar.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al eliminar evento de defoliación con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
