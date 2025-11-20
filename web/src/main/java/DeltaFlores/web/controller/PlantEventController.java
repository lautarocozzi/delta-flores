package DeltaFlores.web.controller;

import DeltaFlores.web.dto.PlantEventDto;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.service.PlantEventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/plantas")
@RequiredArgsConstructor
@Log4j2
public class PlantEventController {

    private final PlantEventService plantEventService;

    @GetMapping("/{plantaId}/events")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<PlantEventDto>> getAllEventsForPlanta(@PathVariable Long plantaId) {
        log.info("\n\n[Capa Controller] \uD83D\uDD0E Solicitud para obtener todos los eventos de la planta ID: {}", plantaId);
        try {
            List<PlantEventDto> events = plantEventService.getAllEventsForPlanta(plantaId);
            log.info("\n\n[Capa Controller] \u2705 {} eventos obtenidos para la planta ID: {}", events.size(), plantaId);
            return ResponseEntity.ok(events);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] \u26A0\uFE0F Planta con ID: {} no encontrada.", plantaId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al obtener eventos para la planta ID {}: {}", plantaId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
