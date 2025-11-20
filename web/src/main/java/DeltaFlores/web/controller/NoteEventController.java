package DeltaFlores.web.controller;

import DeltaFlores.web.dto.NoteEventDto;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.service.events.NoteEventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/events/note")
@RequiredArgsConstructor
@Log4j2
public class NoteEventController {

    private final NoteEventService noteEventService;

    @PostMapping
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<NoteEventDto> createNoteEvent(
            @ModelAttribute NoteEventDto noteEventDto,
            @RequestParam(value = "files", required = false) List<MultipartFile> files) {
        log.info("\n\n[Capa Controller] 📅 Solicitud para crear evento de nota.");
        try {
            NoteEventDto createdEvent = noteEventService.createNoteEvent(noteEventDto, files);
            log.info("\n\n[Capa Controller] ✅ Evento de nota creado con éxito con ID: {}", createdEvent.getId());
            return new ResponseEntity<>(createdEvent, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error inesperado al crear evento de nota: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<NoteEventDto> getNoteEventById(@PathVariable Long id) {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener evento de nota con ID: {}", id);
        try {
            NoteEventDto event = noteEventService.getNoteEventById(id);
            log.info("\n\n[Capa Controller] ✅ Evento de nota con ID: {} obtenido con éxito.", id);
            return ResponseEntity.ok(event);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Evento de nota con ID: {} no encontrado.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener evento de nota con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<NoteEventDto>> getAllNoteEvents() {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener todos los eventos de nota.");
        try {
            List<NoteEventDto> events = noteEventService.getAllNoteEvents();
            log.info("\n\n[Capa Controller] ✅ {} eventos de nota obtenidos con éxito.", events.size());
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener todos los eventos de nota: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/planta/{plantaId}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<NoteEventDto>> getNoteEventsByPlantaId(@PathVariable Long plantaId) {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener eventos de nota por ID de planta: {}", plantaId);
        try {
            List<NoteEventDto> events = noteEventService.getNoteEventsByPlantaId(plantaId);
            log.info("\n\n[Capa Controller] ✅ {} eventos de nota obtenidos para planta ID: {}.", events.size(), plantaId);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener eventos de nota por planta ID {}: {}", plantaId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/by-date/{fecha}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<NoteEventDto>> getNoteEventsByFecha(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener eventos de nota para la fecha: {}", fecha);
        try {
            List<NoteEventDto> events = noteEventService.getNoteEventsByFecha(fecha);
            log.info("\n\n[Capa Controller] ✅ {} eventos de nota obtenidos para la fecha: {}.", events.size(), fecha);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener eventos de nota para la fecha {}: {}", fecha, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/by-date-after/{fecha}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<NoteEventDto>> getNoteEventsByFechaAfter(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener eventos de nota posteriores a la fecha: {}", fecha);
        try {
            List<NoteEventDto> events = noteEventService.getNoteEventsByFechaAfter(fecha);
            log.info("\n\n[Capa Controller] ✅ {} eventos de nota obtenidos posteriores a la fecha: {}.", events.size(), fecha);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener eventos de nota posteriores a la fecha {}: {}", fecha, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<NoteEventDto> updateNoteEvent(
            @PathVariable Long id,
            @ModelAttribute NoteEventDto noteEventDto,
            @RequestParam(value = "newFiles", required = false) List<MultipartFile> newFiles) {
        log.info("\n\n[Capa Controller] ⬆️ Solicitud para actualizar evento de nota con ID: {}", id);
        try {
            NoteEventDto updatedEvent = noteEventService.updateNoteEvent(id, noteEventDto, newFiles);
            log.info("\n\n[Capa Controller] ✅ Evento de nota con ID: {} actualizado con éxito.", id);
            return ResponseEntity.ok(updatedEvent);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Evento de nota con ID: {} no encontrado para actualizar.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al actualizar evento de nota con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteNoteEvent(@PathVariable Long id) {
        log.info("\n\n[Capa Controller] 🗑️ Solicitud para eliminar evento de nota con ID: {}", id);
        try {
            noteEventService.deleteNoteEvent(id);
            log.info("\n\n[Capa Controller] ✅ Evento de nota con ID: {} eliminado con éxito.", id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Evento de nota con ID: {} no encontrado para eliminar.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al eliminar evento de nota con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
