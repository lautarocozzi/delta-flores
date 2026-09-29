package DeltaFlores.web.controller;

import DeltaFlores.web.dto.PlantaDto;
import DeltaFlores.web.dto.ZonaDto;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.service.ZonaService;
import jakarta.validation.Valid;
import org.springframework.security.access.AccessDeniedException;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/zonas")
@RequiredArgsConstructor
@Log4j2
public class ZonaController {

    private final ZonaService zonaService;

    @GetMapping("/sala/{salaId}")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<ZonaDto>> getZonasBySala(@PathVariable Long salaId) {
        log.info("Solicitud para obtener zonas de sala ID: {}", salaId);
        try {
            List<ZonaDto> zonas = zonaService.getZonasBySalaId(salaId);
            log.info("{} zonas encontradas para sala ID: {}", zonas.size(), salaId);
            return ResponseEntity.ok(zonas);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            log.error("Error al obtener zonas de sala {}: {}", salaId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ZonaDto> createZona(@RequestBody @Valid ZonaDto dto) {
        log.info("Solicitud para crear zona: {}", dto.getNombre());
        try {
            ZonaDto created = zonaService.createZona(dto);
            log.info("Zona {} creada con éxito con ID: {}", created.getNombre(), created.getId());
            return new ResponseEntity<>(created, HttpStatus.CREATED);
        } catch (ResourceNotFoundException e) {
            log.warn("Recurso no encontrado al crear zona: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            log.error("Error al crear zona {}: {}", dto.getNombre(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ZonaDto> updateZona(@PathVariable Long id, @RequestBody @Valid ZonaDto dto) {
        log.info("Solicitud para actualizar zona ID: {}", id);
        try {
            ZonaDto updated = zonaService.updateZona(id, dto);
            log.info("Zona con ID: {} actualizada con éxito.", id);
            return ResponseEntity.ok(updated);
        } catch (ResourceNotFoundException e) {
            log.warn("Zona con ID {} no encontrada para actualizar.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            log.error("Error al actualizar zona ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> deleteZona(@PathVariable Long id) {
        log.info("Solicitud para eliminar zona ID: {}", id);
        try {
            zonaService.deleteZona(id);
            log.info("Zona con ID: {} eliminada con éxito.", id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            log.warn("Zona con ID {} no encontrada para eliminar.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            log.error("Error al eliminar zona ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{zonaId}/plantas")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<PlantaDto>> getPlantasByZona(@PathVariable Long zonaId) {
        log.info("Solicitud para obtener plantas de zona ID: {}", zonaId);
        try {
            List<PlantaDto> plantas = zonaService.getPlantasByZonaId(zonaId);
            log.info("{} plantas encontradas para zona ID: {}", plantas.size(), zonaId);
            return ResponseEntity.ok(plantas);
        } catch (ResourceNotFoundException e) {
            log.warn("Zona con ID {} no encontrada.", zonaId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            log.error("Error al obtener plantas de zona ID {}: {}", zonaId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
