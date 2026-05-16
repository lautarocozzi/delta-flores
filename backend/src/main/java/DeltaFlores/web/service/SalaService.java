package DeltaFlores.web.service;

import DeltaFlores.web.dto.SalaDto;
import DeltaFlores.web.entities.Sala;
import DeltaFlores.web.entities.User;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.SalaRepository;
import DeltaFlores.web.repository.UserRepository;
import DeltaFlores.web.security.CustomUserDetails;
import DeltaFlores.web.utils.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Log4j2
@RequiredArgsConstructor
public class SalaService {

    private final SalaRepository salaRepository;
    private final UserRepository userRepository;

    private Authentication getAuthentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }

    private User getCurrentUser() {
        CustomUserDetails userDetails = (CustomUserDetails) getAuthentication().getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado en el contexto de seguridad"));
    }

    private void checkOwnership(Sala sala) {
        Authentication authentication = getAuthentication();
        User currentUser = getCurrentUser();

        // Admin/Super_Admin can bypass the ownership check
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(role -> role.getAuthority().equals("ROLE_ADMIN") || role.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (isAdmin) {
            log.info("Acceso de administrador concedido para el usuario '{}' a la sala con ID: {}", currentUser.getUsername(), sala.getId());
            return; // Skip ownership check
        }

        // For non-admin users, enforce ownership
        if (!sala.getUser().getId().equals(currentUser.getId())) {
            log.warn("ACCESO DENEGADO: El usuario '{}' (ID: {}) intentó acceder a la sala con ID: {}, que pertenece al usuario con ID: {}",
                    currentUser.getUsername(), currentUser.getId(), sala.getId(), sala.getUser().getId());
            throw new AccessDeniedException("No tiene permiso para acceder a esta sala.");
        }
    }

    @Transactional
    public SalaDto createSala(SalaDto salaDto) {
        User currentUser = getCurrentUser();
        log.info("Usuario '{}' (ID: {}) está creando una nueva sala: {}", currentUser.getUsername(), currentUser.getId(), salaDto.getNombre());
        
        Sala sala = DtoMapper.salaDtoToSala(salaDto, new Sala());
        sala.setUser(currentUser); // Assign owner
        
        Sala savedSala = salaRepository.save(sala);
        log.info("Sala {} creada con ID: {} para el usuario '{}'", savedSala.getNombre(), savedSala.getId(), currentUser.getUsername());
        return DtoMapper.salaToSalaDto(savedSala);
    }

    @Transactional(readOnly = true)
    public List<SalaDto> getAllSalas() {
        Authentication authentication = getAuthentication();
        User currentUser = getCurrentUser();

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(role -> role.getAuthority().equals("ROLE_ADMIN") || role.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (isAdmin) {
            log.info("Usuario admin '{}' obteniendo todas las salas del sistema.", currentUser.getUsername());
            return salaRepository.findAll().stream()
                    .map(DtoMapper::salaToSalaDto)
                    .collect(Collectors.toList());
        } else {
            log.info("Obteniendo todas las salas para el usuario '{}' (ID: {})", currentUser.getUsername(), currentUser.getId());
            return salaRepository.findByUserId(currentUser.getId()).stream()
                    .map(DtoMapper::salaToSalaDto)
                    .collect(Collectors.toList());
        }
    }

    @Transactional(readOnly = true)
    public SalaDto getSalaById(Long id) {
        log.info("Buscando sala con ID: {}", id);
        Sala sala = salaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sala no encontrada con id: " + id));
        
        checkOwnership(sala); // Verify ownership or admin access

        log.info("Sala con ID: {} encontrada y verificada para el usuario actual.", id);
        return DtoMapper.salaToSalaDto(sala);
    }

    @Transactional
    public SalaDto updateSala(Long id, SalaDto salaDto) {
        log.info("Actualizando sala con ID: {}", id);
        Sala sala = salaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sala no encontrada con id: " + id));
        
        checkOwnership(sala); // Verify ownership or admin access

        Sala updatedSalaEntity = DtoMapper.salaDtoToSala(salaDto, sala);
        updatedSalaEntity = salaRepository.save(updatedSalaEntity);
        log.info("Sala con ID: {} actualizada por un usuario autorizado.", updatedSalaEntity.getId());
        return DtoMapper.salaToSalaDto(updatedSalaEntity);
    }

    @Transactional
    public void deleteSala(Long id) {
        log.info("Eliminando sala con ID: {}", id);
        Sala sala = salaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sala no encontrada con id: " + id));

        checkOwnership(sala); // Verify ownership or admin access

        salaRepository.deleteById(id);
        log.info("Sala con ID: {} eliminada con éxito por un usuario autorizado.", id);
    }
}
