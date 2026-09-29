package DeltaFlores.web.service;


import DeltaFlores.web.dto.UserDto;
import DeltaFlores.web.dto.UserToRegisterDto;
import DeltaFlores.web.entities.AppRole;
import DeltaFlores.web.entities.User;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.UserRepository;
import DeltaFlores.web.utils.DtoMapper;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Log4j2
@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder bCryptPasswordEncoder;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public List<UserDto> obtenerTodosLosUsuarios(){
        log.info("\n\n\uD83D\uDD0D Listando todos los usuarios...");
        return userRepository.findAll().stream()
                .map(DtoMapper::userToUserDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserDto getUserById(Long id) {
        log.info("\n\n\uD83D\uDD0D Buscando usuario con ID: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("\n\n\u26A0\uFE0F Usuario no encontrado con ID: {}", id);
                    return new ResourceNotFoundException("Usuario no encontrado con id: " + id);
                });
        log.info("\n\n\u2728 Usuario con ID: {} encontrado.", id);
        return DtoMapper.userToUserDto(user);
    }

    @Transactional(readOnly = true)
    public List<UserDto> getUsersByNombre(String nombre) {
        log.info("\n\n\uD83D\uDD0D Buscando usuarios por nombre: {}", nombre);
        List<User> users = userRepository.findByNombreContainingIgnoreCase(nombre);
        log.info("\n\n\u2728 {} usuarios encontrados con nombre '{}'.", users.size(), nombre);
        return users.stream()
                .map(DtoMapper::userToUserDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserDto registerUser(UserToRegisterDto userToRegisterDto) {
        log.info("\n\n\uD83D\uDCBE Registrando nuevo usuario: {}", userToRegisterDto.getEmail());

        // Validate email uniqueness
        if (userRepository.findByEmail(userToRegisterDto.getEmail()).isPresent()) {
            log.warn("\n\n\u26A0\uFE0F El email {} ya está registrado.", userToRegisterDto.getEmail());
            throw new IllegalStateException("El email ya está registrado.");
        }

        // Validate username uniqueness
        if (userRepository.findByUsername(userToRegisterDto.getUsername()).isPresent()) {
            log.warn("\n\n\u26A0\uFE0F El username {} ya está en uso.", userToRegisterDto.getUsername());
            throw new IllegalStateException("El nombre de usuario ya está en uso.");
        }

        User user = new User();
        user.setEmail(userToRegisterDto.getEmail());
        user.setUsername(userToRegisterDto.getUsername());
        user.setNombre(userToRegisterDto.getNombre());
        user.setApellido(userToRegisterDto.getApellido());
        user.setPassword(bCryptPasswordEncoder.encode(userToRegisterDto.getPassword()));
        user.setRol(AppRole.ROLE_GROWER);

        User savedUser = userRepository.save(user);
        log.info("\n\n\u2728 Usuario registrado con éxito con ID: {}", savedUser.getId());
        return DtoMapper.userToUserDto(savedUser);
    }

    @Transactional
    public UserDto updateUser(Long id, UserDto userDto) {
        log.info("\n\n\u2B06\uFE0F Actualizando usuario con ID: {}", id);
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("\n\n\u26A0\uFE0F Usuario no encontrado con ID: {} para actualizar.", id);
                    return new ResourceNotFoundException("Usuario no encontrado con id: " + id);
                });

        existingUser.setNombre(userDto.getNombre());
        existingUser.setApellido(userDto.getApellido());

        User updatedUser = userRepository.save(existingUser);
        log.info("\n\n\u2728 Usuario con ID: {} actualizado.", updatedUser.getId());
        return DtoMapper.userToUserDto(updatedUser);
    }

    @Transactional
    public UserDto updateProfile(Long id, String username, String nombre, String apellido) {
        log.info("\n\n\u2B06\uFE0F Actualizando perfil del usuario con ID: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con id: " + id));

        // Validate username uniqueness if changed
        if (username != null && !username.equals(user.getUsername())) {
            if (userRepository.existsByUsername(username)) {
                throw new IllegalStateException("El nombre de usuario ya está en uso.");
            }
            user.setUsername(username);
        }

        if (nombre != null) user.setNombre(nombre);
        if (apellido != null) user.setApellido(apellido);

        User updatedUser = userRepository.save(user);
        log.info("\n\n\u2728 Perfil del usuario con ID: {} actualizado.", id);
        return DtoMapper.userToUserDto(updatedUser);
    }

    @Transactional
    public void updatePassword(Long id, String currentPassword, String newPassword) {
        log.info("\n\n\uD83D\uDD10 Cambiando contraseña del usuario con ID: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con id: " + id));

        if (!bCryptPasswordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalStateException("La contraseña actual es incorrecta.");
        }

        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalStateException("La contraseña debe tener al menos 8 caracteres.");
        }

        user.setPassword(bCryptPasswordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("\n\n✨ Contraseña del usuario con ID: {} actualizada.", id);
    }

    @Transactional
    public UserDto uploadProfileImage(Long id, MultipartFile file) {
        log.info("\n\n\uD83D\uDCF7 Subiendo imagen de perfil para usuario con ID: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con id: " + id));

        String imageUrl = fileStorageService.uploadFile(file);
        user.setImagenUrl(imageUrl);

        User updatedUser = userRepository.save(user);
        log.info("\n\n\u2728 Imagen de perfil actualizada para usuario con ID: {}", id);
        return DtoMapper.userToUserDto(updatedUser);
    }

    @Transactional
    public UserDto updateUserRole(Long id, @NotNull(message = "El rol no puede ser nulo.") AppRole newRole) {
        log.info("\n\n\uD83D\uDD11 Actualizando rol para el usuario con ID: {}", id);
        User userToUpdate = userRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("\n\n\u26A0\uFE0F Usuario no encontrado con ID: {} para actualizar rol.", id);
                    return new ResourceNotFoundException("Usuario no encontrado con id: " + id);
                });

        userToUpdate.setRol(newRole);
        User updatedUser = userRepository.save(userToUpdate);

        log.info("\n\n\u2728 Rol del usuario con ID: {} actualizado a {}.", updatedUser.getId(), newRole);
        return DtoMapper.userToUserDto(updatedUser);
    }

    @Transactional
    public void deleteUser(Long id) {
        log.info("\n\n\uD83D\uDDD1\uFE0F Eliminando usuario con ID: {}", id);
        if (!userRepository.existsById(id)) {
            log.warn("\n\n\u26A0\uFE0F Usuario no encontrado con ID: {} para eliminar.", id);
            throw new ResourceNotFoundException("Usuario no encontrado con id: " + id);
        }
        userRepository.deleteById(id);
        log.info("\n\n\u2728 Usuario con ID: {} eliminado con éxito.", id);
    }

    @Transactional(readOnly = true)
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    @Transactional(readOnly = true)
    public UserDto getPublicProfileByUsername(String username) {
        log.info("\n\n\uD83D\uDD0D Buscando perfil público por username: {}", username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con username: " + username));
        UserDto dto = DtoMapper.userToUserDto(user);
        dto.setEmail(null); // Excluir email del perfil público
        return dto;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Try by email first (login is by email), then by username
        User user = userRepository.findByEmail(username)
                .orElseGet(() -> userRepository.findByUsername(username)
                        .orElseThrow(() -> new UsernameNotFoundException("User not found with username/email: " + username)));

        return new DeltaFlores.web.security.CustomUserDetails(
                user.getId(),
                user.getEmail(),
                user.getPassword(),
                user.getAuthorities()
        );
    }
}
