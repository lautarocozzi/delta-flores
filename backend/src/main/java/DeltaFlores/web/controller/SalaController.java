package DeltaFlores.web.controller;

import DeltaFlores.web.dto.MeasurementEventDto;
import DeltaFlores.web.dto.SalaColaboradorDto;
import DeltaFlores.web.dto.SalaDto;
import DeltaFlores.web.dto.ZonaBatchRequest;
import DeltaFlores.web.dto.ZonaDto;
import DeltaFlores.web.entities.TipoColaborador;
import DeltaFlores.web.entities.User;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.UserRepository;
import DeltaFlores.web.service.SalaService;
import DeltaFlores.web.service.ZonaService;
import DeltaFlores.web.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/salas")
@RequiredArgsConstructor
@Log4j2
public class SalaController {

    private final SalaService salaService;
    private final ZonaService zonaService;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    // ─── Sala CRUD ─────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<SalaDto> createSala(@RequestBody SalaDto salaDto) {
        try {
            SalaDto createdSala = salaService.createSala(salaDto);
            return new ResponseEntity<>(createdSala, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("Error al crear sala: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<SalaDto>> getAllSalas() {
        try {
            List<SalaDto> salas = salaService.getAllSalas();
            return ResponseEntity.ok(salas);
        } catch (Exception e) {
            log.error("Error al obtener salas: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Returns salas where the current user is owner OR colaborador.
     */
    @GetMapping("/disponibles")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<SalaDto>> getSalasDisponibles() {
        try {
            List<SalaDto> salas = salaService.getSalasDisponibles();
            return ResponseEntity.ok(salas);
        } catch (Exception e) {
            log.error("Error al obtener salas disponibles: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<SalaDto> getSalaById(@PathVariable Long id) {
        try {
            SalaDto sala = salaService.getSalaById(id);
            return ResponseEntity.ok(sala);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error al obtener sala ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<SalaDto> updateSala(@PathVariable Long id, @RequestBody SalaDto salaDto) {
        try {
            SalaDto updatedSala = salaService.updateSala(id, salaDto);
            return ResponseEntity.ok(updatedSala);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error al actualizar sala ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> deleteSala(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean deletePlants) {
        try {
            salaService.deleteSala(id, deletePlants);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error al eliminar sala ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}/toggle-public")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<SalaDto> toggleSalaPublic(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, Boolean> body) {
        try {
            boolean propagateVisibility = body != null && Boolean.TRUE.equals(body.get("propagateVisibility"));
            SalaDto updated = salaService.toggleSalaPublic(id, propagateVisibility);
            return ResponseEntity.ok(updated);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            log.error("Error al cambiar visibilidad de sala ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}/pin")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<SalaDto> toggleSalaPin(@PathVariable Long id) {
        try {
            SalaDto updated = salaService.toggleSalaPin(id);
            return ResponseEntity.ok(updated);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            log.error("Error al pinear sala ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ─── Colaboradores ──────────────────────────────────────────

    /**
     * Get all unique collaborators from salas where the current user is the owner.
     * Used for task assignment dropdown.
     */
    @GetMapping("/mis-colaboradores")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<SalaColaboradorDto>> getMisColaboradores() {
        try {
            User currentUser = getCurrentUser();
            List<SalaColaboradorDto> cols = salaService.getColaboradoresByOwnerId(currentUser.getId());
            return ResponseEntity.ok(cols);
        } catch (Exception e) {
            log.error("Error al obtener mis colaboradores: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{salaId}/colaboradores")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<SalaColaboradorDto>> getColaboradores(@PathVariable Long salaId) {
        try {
            List<SalaColaboradorDto> cols = salaService.getColaboradores(salaId);
            return ResponseEntity.ok(cols);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            log.error("Error al obtener colaboradores de sala {}: {}", salaId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{salaId}/colaboradores")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> agregarColaborador(
            @PathVariable Long salaId,
            @RequestBody Map<String, Object> body) {
        // Accept either 'email' or 'userId'
        Long userId = body.get("userId") != null ? ((Number) body.get("userId")).longValue() : null;
        String email = body.get("email") != null ? body.get("email").toString().trim() : null;
        if (userId == null && (email == null || email.isEmpty())) {
            return ResponseEntity.badRequest().body("Se requiere 'email' o 'userId' en el body.");
        }
        String tipoStr = body.get("tipoColaborador") != null ? body.get("tipoColaborador").toString() : "EDITOR";
        TipoColaborador tipo;
        try {
            tipo = TipoColaborador.valueOf(tipoStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("tipoColaborador debe ser 'EDITOR' o 'LECTURA'.");
        }
        try {
            // Resolve email to userId if needed
            if (userId == null && email != null) {
                userId = salaService.getUserIdByEmail(email);
            }
            SalaColaboradorDto col = salaService.agregarColaborador(salaId, userId, tipo);
            return new ResponseEntity<>(col, HttpStatus.CREATED);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            log.error("Error al agregar colaborador a sala {}: {}", salaId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{salaId}/colaboradores/{userId}")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> removerColaborador(
            @PathVariable Long salaId,
            @PathVariable Long userId) {
        try {
            salaService.removerColaborador(salaId, userId);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            log.error("Error al remover colaborador de sala {}: {}", salaId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ─── Zonas batch ─────────────────────────────────────────

    @PostMapping("/{salaId}/zonas/batch")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<ZonaDto>> createZonasBatch(
            @PathVariable Long salaId,
            @RequestBody @Valid ZonaBatchRequest request) {
        log.info("Solicitud para crear {} zonas en sala ID: {}", request.getZonas().size(), salaId);
        try {
            List<ZonaDto> created = zonaService.createZonasBatch(salaId, request.getZonas());
            log.info("{} zonas creadas en batch para sala ID: {}", created.size(), salaId);
            return new ResponseEntity<>(created, HttpStatus.CREATED);
        } catch (ResourceNotFoundException e) {
            log.warn("Recurso no encontrado al crear zonas batch: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            log.error("Error al crear zonas batch para sala {}: {}", salaId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ─── Métricas ────────────────────────────────────────────

    @GetMapping("/{salaId}/metrics")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<MeasurementEventDto>> getSalaMetrics(
            @PathVariable Long salaId,
            @RequestParam(defaultValue = "6") int months) {
        try {
            List<MeasurementEventDto> metrics = salaService.getSalaMetrics(salaId, months);
            return ResponseEntity.ok(metrics);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            log.error("Error al obtener métricas de sala {}: {}", salaId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
