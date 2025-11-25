package DeltaFlores.web.service;


import DeltaFlores.web.dto.UserDto;
import DeltaFlores.web.dto.UserToRegisterDto;
import DeltaFlores.web.entities.User;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.UserRepository;
import DeltaFlores.web.utils.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Log4j2
@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder bCryptPasswordEncoder;
    // private final EmailTemplateService emailTemplateService; // Comentado si no se usa

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
        if (userRepository.findByUsername(userToRegisterDto.getEmail()).isPresent()) {
            log.warn("\n\n\u26A0\uFE0F El email {} ya está registrado.", userToRegisterDto.getEmail());
            throw new IllegalStateException("El email ya está registrado.");
        }

        User user = new User();
        user.setUsername(userToRegisterDto.getEmail());
        user.setNombre(userToRegisterDto.getNombre());
        user.setApellido(userToRegisterDto.getApellido());
        user.setPassword(bCryptPasswordEncoder.encode(userToRegisterDto.getPassword()));
        user.setRol(DeltaFlores.web.entities.AppRole.ROLE_GROWER);

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
        // Username and Role might be updated through specific flows, not general update
        // Password update should be a separate method due to encoding

        User updatedUser = userRepository.save(existingUser);
        log.info("\n\n\u2728 Usuario con ID: {} actualizado.", updatedUser.getId());
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

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        return new org.springframework.security.core.userdetails.User(user.getUsername(), user.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority(user.getRol().name())));
    }
}