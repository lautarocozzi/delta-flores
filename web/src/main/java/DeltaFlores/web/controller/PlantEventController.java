package DeltaFlores.web.controller;

import DeltaFlores.web.dto.NoteEventDto;
import DeltaFlores.web.service.PlantEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/plantas/{plantaId}/events")
@RequiredArgsConstructor
public class PlantEventController {

    private final PlantEventService plantEventService;

    @PostMapping("/note")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<Void> createNoteEvent(@PathVariable Long plantaId, @ModelAttribute NoteEventDto noteEventDto) {
        plantEventService.createNoteEvent(plantaId, noteEventDto);
        return new ResponseEntity<>(HttpStatus.CREATED);
    }
}
