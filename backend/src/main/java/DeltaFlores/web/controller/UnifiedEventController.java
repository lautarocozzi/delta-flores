package DeltaFlores.web.controller;

import DeltaFlores.web.dto.PlantEventDto;
import DeltaFlores.web.service.PlantEventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/log")
@RequiredArgsConstructor
@Log4j2
public class UnifiedEventController {

    private final PlantEventService plantEventService;

    @GetMapping("/events")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<PlantEventDto>> getAllEventsForCurrentUser() {
        log.info("\n\n[Capa Controller] \uD83D\uDD0E Solicitud para obtener todos los eventos del usuario actual.");
        try {
            List<PlantEventDto> events = plantEventService.getAllEventsForCurrentUser();
            log.info("\n\n[Capa Controller] \u2705 {} eventos obtenidos.", events.size());
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al obtener eventos del usuario: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }
}
