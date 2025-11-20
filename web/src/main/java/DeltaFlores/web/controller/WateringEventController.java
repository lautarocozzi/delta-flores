package DeltaFlores.web.controller;

import DeltaFlores.web.dto.WateringEventDto;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.service.events.WateringEventService;
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
@RequestMapping("/api/events/watering")
@RequiredArgsConstructor
@Log4j2
public class WateringEventController {

    private final WateringEventService wateringEventService;

    @PostMapping
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<WateringEventDto> createWateringEvent(@RequestBody WateringEventDto wateringEventDto) {
        log.info("\n\n[Capa Controller] 💧 Solicitud para crear evento de riego.");
        try {
            WateringEventDto createdEvent = wateringEventService.createWateringEvent(wateringEventDto);
            log.info("\n\n[Capa Controller] ✅ Evento de riego creado con éxito con ID: {}", createdEvent.getId());
            return new ResponseEntity<>(createdEvent, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error inesperado al crear evento de riego: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<WateringEventDto> getWateringEventById(@PathVariable Long id) {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener evento de riego con ID: {}", id);
        try {
            WateringEventDto event = wateringEventService.getWateringEventById(id);
            log.info("\n\n[Capa Controller] ✅ Evento de riego con ID: {} obtenido con éxito.", id);
            return ResponseEntity.ok(event);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Evento de riego con ID: {} no encontrado.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener evento de riego con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<WateringEventDto>> getAllWateringEvents() {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener todos los eventos de riego.");
        try {
            List<WateringEventDto> events = wateringEventService.getAllWateringEvents();
            log.info("\n\n[Capa Controller] ✅ {} eventos de riego obtenidos con éxito.", events.size());
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener todos los eventos de riego: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/planta/{plantaId}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<WateringEventDto>> getWateringEventsByPlantaId(@PathVariable Long plantaId) {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener eventos de riego por ID de planta: {}", plantaId);
        try {
            List<WateringEventDto> events = wateringEventService.getWateringEventsByPlantaId(plantaId);
            log.info("\n\n[Capa Controller] ✅ {} eventos de riego obtenidos para planta ID: {}.", events.size(), plantaId);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener eventos de riego por planta ID {}: {}", plantaId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/by-date/{fecha}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<WateringEventDto>> getWateringEventsByFecha(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener eventos de riego para la fecha: {}", fecha);
        try {
            List<WateringEventDto> events = wateringEventService.getWateringEventsByFecha(fecha);
            log.info("\n\n[Capa Controller] ✅ {} eventos de riego obtenidos para la fecha: {}.", events.size(), fecha);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener eventos de riego para la fecha {}: {}", fecha, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/by-date-after/{fecha}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<WateringEventDto>> getWateringEventsByFechaAfter(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener eventos de riego posteriores a la fecha: {}", fecha);
        try {
            List<WateringEventDto> events = wateringEventService.getWateringEventsByFechaAfter(fecha);
            log.info("\n\n[Capa Controller] ✅ {} eventos de riego obtenidos posteriores a la fecha: {}.", events.size(), fecha);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener eventos de riego posteriores a la fecha {}: {}", fecha, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<WateringEventDto> updateWateringEvent(@PathVariable Long id, @RequestBody WateringEventDto wateringEventDto) {
        log.info("\n\n[Capa Controller] ⬆️ Solicitud para actualizar evento de riego con ID: {}", id);
        try {
            WateringEventDto updatedEvent = wateringEventService.updateWateringEvent(id, wateringEventDto);
            log.info("\n\n[Capa Controller] ✅ Evento de riego con ID: {} actualizado con éxito.", id);
            return ResponseEntity.ok(updatedEvent);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Evento de riego con ID: {} no encontrado para actualizar.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al actualizar evento de riego con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteWateringEvent(@PathVariable Long id) {
        log.info("\n\n[Capa Controller] 🗑️ Solicitud para eliminar evento de riego con ID: {}", id);
        try {
            wateringEventService.deleteWateringEvent(id);
            log.info("\n\n[Capa Controller] ✅ Evento de riego con ID: {} eliminado con éxito.", id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Evento de riego con ID: {} no encontrado para eliminar.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al eliminar evento de riego con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
