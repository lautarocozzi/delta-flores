package DeltaFlores.web.controller;

import DeltaFlores.web.dto.StageChangeEventDto;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.service.events.StageChangeEventService;
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
@RequestMapping("/api/events/stage-change")
@RequiredArgsConstructor
@Log4j2
public class StageChangeEventController {

    private final StageChangeEventService stageChangeEventService;

    @PostMapping
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<StageChangeEventDto> createStageChangeEvent(@RequestBody StageChangeEventDto stageChangeEventDto) {
        log.info("\n\n[Capa Controller] 🌽 Solicitud para crear evento de cambio de etapa.");
        try {
            StageChangeEventDto createdEvent = stageChangeEventService.createStageChangeEvent(stageChangeEventDto);
            log.info("\n\n[Capa Controller] ✅ Evento de cambio de etapa creado con éxito con ID: {}", createdEvent.getId());
            return new ResponseEntity<>(createdEvent, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error inesperado al crear evento de cambio de etapa: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<StageChangeEventDto> getStageChangeEventById(@PathVariable Long id) {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener evento de cambio de etapa con ID: {}", id);
        try {
            StageChangeEventDto event = stageChangeEventService.getStageChangeEventById(id);
            log.info("\n\n[Capa Controller] ✅ Evento de cambio de etapa con ID: {} obtenido con éxito.", id);
            return ResponseEntity.ok(event);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Evento de cambio de etapa con ID: {} no encontrado.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener evento de cambio de etapa con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<StageChangeEventDto>> getAllStageChangeEvents() {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener todos los eventos de cambio de etapa.");
        try {
            List<StageChangeEventDto> events = stageChangeEventService.getAllStageChangeEvents();
            log.info("\n\n[Capa Controller] ✅ {} eventos de cambio de etapa obtenidos con éxito.", events.size());
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener todos los eventos de cambio de etapa: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/planta/{plantaId}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<StageChangeEventDto>> getStageChangeEventsByPlantaId(@PathVariable Long plantaId) {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener eventos de cambio de etapa por ID de planta: {}", plantaId);
        try {
            List<StageChangeEventDto> events = stageChangeEventService.getStageChangeEventsByPlantaId(plantaId);
            log.info("\n\n[Capa Controller] ✅ {} eventos de cambio de etapa obtenidos para planta ID: {}.", events.size(), plantaId);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener eventos de cambio de etapa por planta ID {}: {}", plantaId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/by-date/{fecha}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<StageChangeEventDto>> getStageChangeEventsByFecha(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener eventos de cambio de etapa para la fecha: {}", fecha);
        try {
            List<StageChangeEventDto> events = stageChangeEventService.getStageChangeEventsByFecha(fecha);
            log.info("\n\n[Capa Controller] ✅ {} eventos de cambio de etapa obtenidos para la fecha: {}.", events.size(), fecha);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener eventos de cambio de etapa para la fecha {}: {}", fecha, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/by-date-after/{fecha}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<StageChangeEventDto>> getStageChangeEventsByFechaAfter(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener eventos de cambio de etapa posteriores a la fecha: {}", fecha);
        try {
            List<StageChangeEventDto> events = stageChangeEventService.getStageChangeEventsByFechaAfter(fecha);
            log.info("\n\n[Capa Controller] ✅ {} eventos de cambio de etapa obtenidos posteriores a la fecha: {}.", events.size(), fecha);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener eventos de cambio de etapa posteriores a la fecha {}: {}", fecha, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<StageChangeEventDto> updateStageChangeEvent(@PathVariable Long id, @RequestBody StageChangeEventDto stageChangeEventDto) {
        log.info("\n\n[Capa Controller] ⬆️ Solicitud para actualizar evento de cambio de etapa con ID: {}", id);
        try {
            StageChangeEventDto updatedEvent = stageChangeEventService.updateStageChangeEvent(id, stageChangeEventDto);
            log.info("\n\n[Capa Controller] ✅ Evento de cambio de etapa con ID: {} actualizado con éxito.", id);
            return ResponseEntity.ok(updatedEvent);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Evento de cambio de etapa con ID: {} no encontrado para actualizar.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al actualizar evento de cambio de etapa con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteStageChangeEvent(@PathVariable Long id) {
        log.info("\n\n[Capa Controller] 🗑️ Solicitud para eliminar evento de cambio de etapa con ID: {}", id);
        try {
            stageChangeEventService.deleteStageChangeEvent(id);
            log.info("\n\n[Capa Controller] ✅ Evento de cambio de etapa con ID: {} eliminado con éxito.", id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Evento de cambio de etapa con ID: {} no encontrado para eliminar.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al eliminar evento de cambio de etapa con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
