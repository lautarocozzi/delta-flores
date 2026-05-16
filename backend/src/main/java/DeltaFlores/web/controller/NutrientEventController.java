package DeltaFlores.web.controller;

import DeltaFlores.web.dto.NutrientEventDto;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.service.events.NutrientEventService;
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
@RequestMapping("/api/events/nutrient")
@RequiredArgsConstructor
@Log4j2
public class NutrientEventController {

    private final NutrientEventService nutrientEventService;

    @PostMapping
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<NutrientEventDto> createNutrientEvent(@RequestBody NutrientEventDto nutrientEventDto) {
        log.info("\n\n[Capa Controller] 🌱 Solicitud para crear evento de nutriente.");
        try {
            NutrientEventDto createdEvent = nutrientEventService.createNutrientEvent(nutrientEventDto);
            log.info("\n\n[Capa Controller] ✅ Evento de nutriente creado con éxito con ID: {}", createdEvent.getId());
            return new ResponseEntity<>(createdEvent, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error inesperado al crear evento de nutriente: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<NutrientEventDto> getNutrientEventById(@PathVariable Long id) {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener evento de nutriente con ID: {}", id);
        try {
            NutrientEventDto event = nutrientEventService.getNutrientEventById(id);
            log.info("\n\n[Capa Controller] ✅ Evento de nutriente con ID: {} obtenido con éxito.", id);
            return ResponseEntity.ok(event);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Evento de nutriente con ID: {} no encontrado.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener evento de nutriente con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<NutrientEventDto>> getAllNutrientEvents() {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener todos los eventos de nutriente.");
        try {
            List<NutrientEventDto> events = nutrientEventService.getAllNutrientEvents();
            log.info("\n\n[Capa Controller] ✅ {} eventos de nutriente obtenidos con éxito.", events.size());
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener todos los eventos de nutriente: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/planta/{plantaId}")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<NutrientEventDto>> getNutrientEventsByPlantaId(@PathVariable Long plantaId) {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener eventos de nutriente por ID de planta: {}", plantaId);
        try {
            List<NutrientEventDto> events = nutrientEventService.getNutrientEventsByPlantaId(plantaId);
            log.info("\n\n[Capa Controller] ✅ {} eventos de nutriente obtenidos para planta ID: {}.", events.size(), plantaId);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener eventos de nutriente por planta ID {}: {}", plantaId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/by-date/{fecha}")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<NutrientEventDto>> getNutrientEventsByFecha(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener eventos de nutriente para la fecha: {}", fecha);
        try {
            List<NutrientEventDto> events = nutrientEventService.getNutrientEventsByFecha(fecha);
            log.info("\n\n[Capa Controller] ✅ {} eventos de nutriente obtenidos para la fecha: {}.", events.size(), fecha);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener eventos de nutriente para la fecha {}: {}", fecha, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/by-date-after/{fecha}")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<NutrientEventDto>> getNutrientEventsByFechaAfter(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener eventos de nutriente posteriores a la fecha: {}", fecha);
        try {
            List<NutrientEventDto> events = nutrientEventService.getNutrientEventsByFechaAfter(fecha);
            log.info("\n\n[Capa Controller] ✅ {} eventos de nutriente obtenidos posteriores a la fecha: {}.", events.size(), fecha);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener eventos de nutriente posteriores a la fecha {}: {}", fecha, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<NutrientEventDto> updateNutrientEvent(@PathVariable Long id, @RequestBody NutrientEventDto nutrientEventDto) {
        log.info("\n\n[Capa Controller] ⬆️ Solicitud para actualizar evento de nutriente con ID: {}", id);
        try {
            NutrientEventDto updatedEvent = nutrientEventService.updateNutrientEvent(id, nutrientEventDto);
            log.info("\n\n[Capa Controller] ✅ Evento de nutriente con ID: {} actualizado con éxito.", id);
            return ResponseEntity.ok(updatedEvent);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Evento de nutriente con ID: {} no encontrado para actualizar.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al actualizar evento de nutriente con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> deleteNutrientEvent(@PathVariable Long id) {
        log.info("\n\n[Capa Controller] 🗑️ Solicitud para eliminar evento de nutriente con ID: {}", id);
        try {
            nutrientEventService.deleteNutrientEvent(id);
            log.info("\n\n[Capa Controller] ✅ Evento de nutriente con ID: {} eliminado con éxito.", id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Evento de nutriente con ID: {} no encontrado para eliminar.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al eliminar evento de nutriente con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
