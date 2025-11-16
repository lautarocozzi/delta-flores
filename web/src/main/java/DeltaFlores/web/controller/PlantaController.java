package DeltaFlores.web.controller;

import DeltaFlores.web.dto.PlantaDto;
import DeltaFlores.web.service.PlantaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/plantas")
@RequiredArgsConstructor
public class
PlantaController {

    private final PlantaService plantaService;

    @PostMapping
    public ResponseEntity<PlantaDto> createPlanta(@RequestBody PlantaDto plantaDto) {
        return new ResponseEntity<>(plantaService.createPlanta(plantaDto), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<PlantaDto>> getAllPlantas() {
        return ResponseEntity.ok(plantaService.getAllPlantas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlantaDto> getPlantaById(@PathVariable Long id) {
        return ResponseEntity.ok(plantaService.getPlantaById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlantaDto> updatePlanta(@PathVariable Long id, @RequestBody PlantaDto plantaDto) {
        return ResponseEntity.ok(plantaService.updatePlanta(id, plantaDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlanta(@PathVariable Long id) {
        plantaService.deletePlanta(id);
        return ResponseEntity.noContent().build();
    }
}
