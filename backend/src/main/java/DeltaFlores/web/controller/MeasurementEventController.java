package DeltaFlores.web.controller;

import DeltaFlores.web.dto.MeasurementEventDto;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.service.events.MeasurementEventService;
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
@RequestMapping("/api/events/measurement")
@RequiredArgsConstructor
@Log4j2
public class MeasurementEventController {

    private final MeasurementEventService measurementEventService;

    @PostMapping
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<MeasurementEventDto> createMeasurementEvent(@RequestBody MeasurementEventDto measurementEventDto) {
        log.info("\n\n[Capa Controller] 📊 Solicitud para crear evento de medición.");
        try {
            MeasurementEventDto createdEvent = measurementEventService.createMeasurementEvent(measurementEventDto);
            log.info("\n\n[Capa Controller] ✅ Evento de medición creado con éxito con ID: {}", createdEvent.getId());
            return new ResponseEntity<>(createdEvent, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error inesperado al crear evento de medición: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<MeasurementEventDto> getMeasurementEventById(@PathVariable Long id) {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener evento de medición con ID: {}", id);
        try {
            MeasurementEventDto event = measurementEventService.getMeasurementEventById(id);
            log.info("\n\n[Capa Controller] ✅ Evento de medición con ID: {} obtenido con éxito.", id);
            return ResponseEntity.ok(event);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Evento de medición con ID: {} no encontrado.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener evento de medición con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<MeasurementEventDto>> getAllMeasurementEvents() {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener todos los eventos de medición.");
        try {
            List<MeasurementEventDto> events = measurementEventService.getAllMeasurementEvents();
            log.info("\n\n[Capa Controller] ✅ {} eventos de medición obtenidos con éxito.", events.size());
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener todos los eventos de medición: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/planta/{plantaId}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<MeasurementEventDto>> getMeasurementEventsByPlantaId(@PathVariable Long plantaId) {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener eventos de medición por ID de planta: {}", plantaId);
        try {
            List<MeasurementEventDto> events = measurementEventService.getMeasurementEventsByPlantaId(plantaId);
            log.info("\n\n[Capa Controller] ✅ {} eventos de medición obtenidos para planta ID: {}.", events.size(), plantaId);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener eventos de medición por planta ID {}: {}", plantaId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/by-date/{fecha}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<MeasurementEventDto>> getMeasurementEventsByFecha(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener eventos de medición para la fecha: {}", fecha);
        try {
            List<MeasurementEventDto> events = measurementEventService.getMeasurementEventsByFecha(fecha);
            log.info("\n\n[Capa Controller] ✅ {} eventos de medición obtenidos para la fecha: {}.", events.size(), fecha);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener eventos de medición para la fecha {}: {}", fecha, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/by-date-after/{fecha}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<MeasurementEventDto>> getMeasurementEventsByFechaAfter(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener eventos de medición posteriores a la fecha: {}", fecha);
        try {
            List<MeasurementEventDto> events = measurementEventService.getMeasurementEventsByFechaAfter(fecha);
            log.info("\n\n[Capa Controller] ✅ {} eventos de medición obtenidos posteriores a la fecha: {}.", events.size(), fecha);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener eventos de medición posteriores a la fecha {}: {}", fecha, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<MeasurementEventDto> updateMeasurementEvent(@PathVariable Long id, @RequestBody MeasurementEventDto measurementEventDto) {
        log.info("\n\n[Capa Controller] ⬆️ Solicitud para actualizar evento de medición con ID: {}", id);
        try {
            MeasurementEventDto updatedEvent = measurementEventService.updateMeasurementEvent(id, measurementEventDto);
            log.info("\n\n[Capa Controller] ✅ Evento de medición con ID: {} actualizado con éxito.", id);
            return ResponseEntity.ok(updatedEvent);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Evento de medición con ID: {} no encontrado para actualizar.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al actualizar evento de medición con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteMeasurementEvent(@PathVariable Long id) {
        log.info("\n\n[Capa Controller] 🗑️ Solicitud para eliminar evento de medición con ID: {}", id);
        try {
            measurementEventService.deleteMeasurementEvent(id);
            log.info("\n\n[Capa Controller] ✅ Evento de medición con ID: {} eliminado con éxito.", id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Evento de medición con ID: {} no encontrado para eliminar.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al eliminar evento de medición con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
