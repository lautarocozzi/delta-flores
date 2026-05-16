package DeltaFlores.web.controller;


import DeltaFlores.web.dto.UpdateUserRoleRequestDto;
import DeltaFlores.web.dto.UserDto;
import DeltaFlores.web.dto.UserToRegisterDto;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Log4j2
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<UserDto> registerUser(@RequestBody @Valid UserToRegisterDto userToRegisterDto) {
        log.info("\n\n[Capa Controller] \uD83D\uDCBE Solicitud de registro para nuevo usuario: {}", userToRegisterDto.getEmail());
        try {
            UserDto createdUser = userService.registerUser(userToRegisterDto);
            log.info("\n\n[Capa Controller] \u2705 Usuario {} registrado con éxito con ID: {}", createdUser.getUsername(), createdUser.getId());
            return new ResponseEntity<>(createdUser, HttpStatus.CREATED);
        } catch (IllegalStateException e) {
            log.warn("\n\n[Capa Controller] \u26A0\uFE0F Error al registrar usuario {}: {}", userToRegisterDto.getEmail(), e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build(); // 409 Conflict for duplicate user
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error inesperado al registrar usuario {}: {}", userToRegisterDto.getEmail(), e.getMessage(), e);
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
            log.error("\n\n[Capa Controller] \u274C Error inesperado al obtener todos los usuarios: {}", e.getMessage(), e);
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
            log.error("\n\n[Capa Controller] \u274C Error al obtener usuarios por nombre '{}': {}", nombre, e.getMessage(), e);
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

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<UserDto> updateUserRole(@PathVariable Long id, @RequestBody @Valid UpdateUserRoleRequestDto roleRequest) {
        log.info("\n\n[Capa Controller] \uD83D\uDD11 Solicitud para cambiar rol del usuario con ID: {}", id);
        try {
            UserDto updatedUser = userService.updateUserRole(id, roleRequest.getRole());
            log.info("\n\n[Capa Controller] \u2705 Rol del usuario con ID: {} actualizado con éxito a {}.", id, roleRequest.getRole());
            return ResponseEntity.ok(updatedUser);
        } catch (ResourceNotFoundException e) {
            log.warn("\n\n[Capa Controller] \u26A0\uFE0F Usuario con ID: {} no encontrado para cambiar rol.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("\n\n[Capa Controller] \u274C Error al cambiar rol para usuario con ID {}: {}", id, e.getMessage(), e);
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
