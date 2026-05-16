package DeltaFlores.web.controller;

import DeltaFlores.web.dto.NutrienteDto;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.service.NutrienteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/nutrientes")
@RequiredArgsConstructor
@Log4j2
public class NutrienteController {

    private final NutrienteService nutrienteService;

    @PostMapping
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<NutrienteDto> createNutriente(@RequestBody NutrienteDto nutrienteDto) {
        log.info("\n\n[Capa Controller] 🍏 Solicitud para crear nutriente.");
        try {
            NutrienteDto createdNutriente = nutrienteService.createNutriente(nutrienteDto);
            log.info("\n\n[Capa Controller] ✅ Nutriente creado con éxito con ID: {}", createdNutriente.getId());
            return new ResponseEntity<>(createdNutriente, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error inesperado al crear nutriente: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<NutrienteDto> getNutrienteById(@PathVariable Long id) {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener nutriente con ID: {}", id);
        try {
            NutrienteDto nutriente = nutrienteService.getNutrienteById(id);
            log.info("\n\n[Capa Controller] ✅ Nutriente con ID: {} obtenido con éxito.", id);
            return ResponseEntity.ok(nutriente);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Nutriente con ID: {} no encontrado.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener nutriente con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<NutrienteDto>> getAllNutrientes() {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener todos los nutrientes.");
        try {
            List<NutrienteDto> nutrientes = nutrienteService.getAllNutrientes();
            log.info("\n\n[Capa Controller] ✅ {} nutrientes obtenidos con éxito.", nutrientes.size());
            return ResponseEntity.ok(nutrientes);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener todos los nutrientes: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/titulo/{titulo}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<NutrienteDto>> getNutrientesByTitulo(@PathVariable String titulo) {
        log.info("\n\n[Capa Controller] 🔎 Solicitud para obtener nutrientes por título: {}", titulo);
        try {
            List<NutrienteDto> nutrientes = nutrienteService.getNutrientesByTitulo(titulo);
            log.info("\n\n[Capa Controller] ✅ {} nutrientes obtenidos por título: {}.", nutrientes.size(), titulo);
            return ResponseEntity.ok(nutrientes);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al obtener nutrientes por título {}: {}", titulo, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NutrienteDto> updateNutriente(@PathVariable Long id, @RequestBody NutrienteDto nutrienteDto) {
        log.info("\n\n[Capa Controller] ⬆️ Solicitud para actualizar nutriente con ID: {}", id);
        try {
            NutrienteDto updatedNutriente = nutrienteService.updateNutriente(id, nutrienteDto);
            log.info("\n\n[Capa Controller] ✅ Nutriente con ID: {} actualizado con éxito.", id);
            return ResponseEntity.ok(updatedNutriente);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Nutriente con ID: {} no encontrado para actualizar.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al actualizar nutriente con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteNutriente(@PathVariable Long id) {
        log.info("\n\n[Capa Controller] 🗑️ Solicitud para eliminar nutriente con ID: {}", id);
        try {
            nutrienteService.deleteNutriente(id);
            log.info("\n\n[Capa Controller] ✅ Nutriente con ID: {} eliminado con éxito.", id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] ⚠️ Nutriente con ID: {} no encontrado para eliminar.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] ❌ Error al eliminar nutriente con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
