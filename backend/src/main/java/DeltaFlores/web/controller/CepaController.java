package DeltaFlores.web.controller;

import DeltaFlores.web.dto.CepaDto;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.service.CepaService;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cepas")
@Log4j2
public class CepaController {

    private final CepaService cepaService;

    public CepaController(CepaService cepaService) {
        this.cepaService = cepaService;
    }

    @GetMapping
    public ResponseEntity<List<CepaDto>> getCepasForCurrentUser() {
        log.info("\n\n[Capa Controller] \uD83D\uDD0E Solicitud para obtener todas las cepas del usuario actual.");
        try {
            List<CepaDto> cepas = cepaService.getCepasForCurrentUser();
            log.info("\n\n[Capa Controller] \u2705 {} cepas obtenidas con éxito.", cepas.size());
            return ResponseEntity.ok(cepas);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al obtener todas las cepas: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<CepaDto> getCepaById(@PathVariable Long id) {
        log.info("\n\n[Capa Controller] \uD83D\uDD0E Solicitud para obtener cepa con ID: {}", id);
        try {
            CepaDto cepaDto = cepaService.getCepaById(id);
            log.info("\n\n[Capa Controller] \u2705 Cepa con ID: {} obtenida con éxito.", id);
            return ResponseEntity.ok(cepaDto);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] \u26A0\uFE0F No se encontró la cepa con ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al obtener cepa con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<CepaDto> createCepa(@RequestBody CepaDto cepaDto) {
        log.info("\n\n[Capa Controller] \uD83D\uDCBE Solicitud para crear nueva cepa: {}", cepaDto.getGeneticaParental());
        try {
            CepaDto createdCepa = cepaService.createCepa(cepaDto);
            log.info("\n\n[Capa Controller] \u2705 Cepa creada con éxito con ID: {}", createdCepa.getId());
            return new ResponseEntity<>(createdCepa, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al crear cepa {}: {}", cepaDto.getGeneticaParental(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<CepaDto> updateCepa(@PathVariable Long id, @RequestBody CepaDto cepaDto) {
        log.info("\n\n[Capa Controller] \u2B06\uFE0F Solicitud para actualizar cepa con ID: {}", id);
        try {
            CepaDto updatedCepa = cepaService.updateCepa(id, cepaDto);
            log.info("\n\n[Capa Controller] \u2705 Cepa con ID: {} actualizada con éxito.", id);
            return ResponseEntity.ok(updatedCepa);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] \u26A0\uFE0F No se pudo actualizar, no se encontró la cepa con ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al actualizar cepa con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCepa(@PathVariable Long id) {
        log.info("\n\n[Capa Controller] \uD83D\uDDD1\uFE0F Solicitud para eliminar cepa con ID: {}", id);
        try {
            cepaService.deleteCepa(id);
            log.info("\n\n[Capa Controller] \u2705 Cepa con ID: {} eliminada con éxito.", id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] \u26A0\uFE0F No se pudo eliminar, no se encontró la cepa con ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al eliminar cepa con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<List<CepaDto>> getCepasByUserId(@PathVariable Long userId) {
        log.info("\n\n[Capa Controller] \uD83D\uDD0E Solicitud de SUPER_ADMIN para obtener todas las cepas del usuario con ID: {}", userId);
        try {
            List<CepaDto> cepas = cepaService.getCepasByUserId(userId);
            log.info("\n\n[Capa Controller] \u2705 {} cepas obtenidas con éxito para el usuario con ID: {}", cepas.size(), userId);
            return ResponseEntity.ok(cepas);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al obtener las cepas para el usuario con ID {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
