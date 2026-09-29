package DeltaFlores.web.controller;

import DeltaFlores.web.dto.UpdateUserRoleRequestDto;
import DeltaFlores.web.dto.UserDto;
import DeltaFlores.web.dto.UserToRegisterDto;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.service.PlantaService;
import DeltaFlores.web.service.SalaService;
import DeltaFlores.web.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Log4j2
public class UserController {

    private final UserService userService;
    private final SalaService salaService;
    private final PlantaService plantaService;

    @GetMapping("/seed-admin")
    public ResponseEntity<String> seedAdmin() {
        try {
            UserToRegisterDto dto = new UserToRegisterDto();
            dto.setNombre("Admin");
            dto.setApellido("Seeded");
            dto.setEmail("admin@delta.com");
            dto.setUsername("admin");
            dto.setPassword("admin123");
            userService.registerUser(dto);
            return ResponseEntity.ok("Admin seeded successfully");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error seeding: " + e.getMessage());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<UserDto> registerUser(@RequestBody @Valid UserToRegisterDto userToRegisterDto) {
        log.info("\n\n[Capa Controller] \uD83D\uDCBE Solicitud de registro para nuevo usuario: {}",
                userToRegisterDto.getEmail());
        try {
            UserDto createdUser = userService.registerUser(userToRegisterDto);
            log.info("\n\n[Capa Controller] \u2705 Usuario {} registrado con éxito con ID: {}",
                    createdUser.getUsername(), createdUser.getId());
            return new ResponseEntity<>(createdUser, HttpStatus.CREATED);
        } catch (IllegalStateException e) {
            log.warn("\n\n[Capa Controller] \u26A0\uFE0F Error al registrar usuario {}: {}",
                    userToRegisterDto.getEmail(), e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()) instanceof UserDto ? null : null);
        } catch (Exception e) {
            System.out.println("CRITICAL ERROR IN REGISTER:");
            e.printStackTrace();
            log.error("\n\n[Capa Controller] \u274C Error inesperado al registrar usuario {}: {}",
                    userToRegisterDto.getEmail(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        log.info("\n\n[Capa Controller] \uD83D\uDD0D Solicitud para obtener todos los usuarios.");
        try {
            List<UserDto> users = userService.obtenerTodosLosUsuarios();
            log.info("\n\n[Capa Controller] \u2705 {} usuarios obtenidos con éxito.", users.size());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error inesperado al obtener todos los usuarios: {}", e.getMessage(),
                    e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long id) {
        log.info("\n\n[Capa Controller] \uD83D\uDD0D Solicitud para obtener usuario con ID: {}", id);
        try {
            UserDto user = userService.getUserById(id);
            log.info("\n\n[Capa Controller] \u2705 Usuario con ID: {} obtenido con éxito.", id);
            return ResponseEntity.ok(user);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] \u26A0\uFE0F Usuario con ID: {} no encontrado.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al obtener usuario con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/nombre/{nombre}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<UserDto>> getUsersByNombre(@PathVariable String nombre) {
        log.info("\n\n[Capa Controller] \uD83D\uDD0D Solicitud para obtener usuarios por nombre: {}", nombre);
        try {
            List<UserDto> users = userService.getUsersByNombre(nombre);
            log.info("\n\n[Capa Controller] \u2705 {} usuarios obtenidos por nombre '{}'.", users.size(), nombre);
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al obtener usuarios por nombre '{}': {}", nombre,
                    e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/check-username/{username}")
    public ResponseEntity<Map<String, Boolean>> checkUsername(@PathVariable String username) {
        boolean available = !userService.existsByUsername(username);
        return ResponseEntity.ok(Map.of("available", available));
    }

    @GetMapping("/username/{username}")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<UserDto> getPublicProfileByUsername(@PathVariable String username) {
        log.info("\n\n[Capa Controller] \uD83D\uDD0D Solicitud de perfil público para username: {}", username);
        try {
            UserDto user = userService.getPublicProfileByUsername(username);
            return ResponseEntity.ok(user);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al obtener perfil público: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{username}/salas/{salaId}")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> getSalaByUsernameAndId(@PathVariable String username, @PathVariable Long salaId) {
        log.info("\n\n[Capa Controller] \uD83D\uDD0D Solicitud de sala ID: {} del usuario: {}", salaId, username);
        try {
            return ResponseEntity.ok(salaService.getSalaByUsernameAndId(username, salaId));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al obtener sala: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{username}/plantas/public")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> getPublicPlantasByUsername(@PathVariable String username) {
        log.info("\n\n[Capa Controller] \uD83D\uDD0D Solicitud de plantas públicas del usuario: {}", username);
        try {
            UserDto profileUser = userService.getPublicProfileByUsername(username);
            return ResponseEntity.ok(plantaService.getPublicPlantasByUserId(profileUser.getId()));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al obtener plantas públicas: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{username}/salas/public")
    @PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> getPublicSalasByUsername(
            @PathVariable String username,
            @RequestParam(defaultValue = "false") boolean includeCollaborations) {
        log.info("Solicitud de salas públicas del usuario: {} (includeCollaborations={})", username, includeCollaborations);
        try {
            UserDto profileUser = userService.getPublicProfileByUsername(username);
            return ResponseEntity.ok(salaService.getPublicSalasByUserId(profileUser.getId(), includeCollaborations));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error al obtener salas públicas: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or #id == principal.id")
    public ResponseEntity<UserDto> updateUser(@PathVariable Long id, @RequestBody UserDto userDto) {
        log.info("\n\n[Capa Controller] \u2B06\uFE0F Solicitud para actualizar usuario con ID: {}", id);
        try {
            UserDto updatedUser = userService.updateUser(id, userDto);
            log.info("\n\n[Capa Controller] \u2705 Usuario con ID: {} actualizado con éxito.", id);
            return ResponseEntity.ok(updatedUser);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] \u26A0\uFE0F Usuario con ID: {} no encontrado para actualizar.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al actualizar usuario con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}/profile")
    @PreAuthorize("#id == principal.id")
    public ResponseEntity<?> updateProfile(@PathVariable Long id, @RequestBody Map<String, String> body) {
        log.info("\n\n[Capa Controller] \u2B06\uFE0F Actualizando perfil del usuario con ID: {}", id);
        try {
            String username = body.get("username");
            String nombre = body.get("nombre");
            String apellido = body.get("apellido");
            UserDto updatedUser = userService.updateProfile(id, username, nombre, apellido);
            return ResponseEntity.ok(updatedUser);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al actualizar perfil: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}/password")
    @PreAuthorize("#id == principal.id")
    public ResponseEntity<?> updatePassword(@PathVariable Long id, @RequestBody Map<String, String> body) {
        log.info("\n\n[Capa Controller] \uD83D\uDD10 Cambiando contraseña del usuario con ID: {}", id);
        try {
            String currentPassword = body.get("currentPassword");
            String newPassword = body.get("newPassword");
            userService.updatePassword(id, currentPassword, newPassword);
            return ResponseEntity.ok(Map.of("message", "Contraseña actualizada correctamente."));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al cambiar contraseña: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{id}/image")
    @PreAuthorize("#id == principal.id")
    public ResponseEntity<?> uploadProfileImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        log.info("\n\n[Capa Controller] \uD83D\uDCF7 Subiendo imagen de perfil para usuario con ID: {}", id);
        try {
            UserDto updatedUser = userService.uploadProfileImage(id, file);
            return ResponseEntity.ok(updatedUser);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al subir imagen: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<UserDto> updateUserRole(@PathVariable Long id,
            @RequestBody @Valid UpdateUserRoleRequestDto roleRequest) {
        log.info("\n\n[Capa Controller] \uD83D\uDD11 Solicitud para cambiar rol del usuario con ID: {}", id);
        try {
            UserDto updatedUser = userService.updateUserRole(id, roleRequest.getRole());
            log.info("\n\n[Capa Controller] \u2705 Rol del usuario con ID: {} actualizado con éxito a {}.", id,
                    roleRequest.getRole());
            return ResponseEntity.ok(updatedUser);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] \u26A0\uFE0F Usuario con ID: {} no encontrado para cambiar rol.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al cambiar rol para usuario con ID {}: {}", id,
                    e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        log.info("\n\n[Capa Controller] \uD83D\uDDD1\uFE0F Solicitud para eliminar usuario con ID: {}", id);
        try {
            userService.deleteUser(id);
            log.info("\n\n[Capa Controller] \u2705 Usuario con ID: {} eliminado con éxito.", id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] \u26A0\uFE0F Usuario con ID: {} no encontrado para eliminar.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al eliminar usuario con ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
