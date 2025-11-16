package DeltaFlores.web.controller;

import DeltaFlores.web.dto.SalaDto;
import DeltaFlores.web.service.SalaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/salas")
@RequiredArgsConstructor
public class SalaController {

    private final SalaService salaService;

    @PostMapping
    public ResponseEntity<SalaDto> createSala(@RequestBody SalaDto salaDto) {
        return new ResponseEntity<>(salaService.createSala(salaDto), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<SalaDto>> getAllSalas() {
        return ResponseEntity.ok(salaService.getAllSalas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalaDto> getSalaById(@PathVariable Long id) {
        return ResponseEntity.ok(salaService.getSalaById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SalaDto> updateSala(@PathVariable Long id, @RequestBody SalaDto salaDto) {
        return ResponseEntity.ok(salaService.updateSala(id, salaDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSala(@PathVariable Long id) {
        salaService.deleteSala(id);
        return ResponseEntity.noContent().build();
    }
}
