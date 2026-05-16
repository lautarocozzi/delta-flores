package DeltaFlores.web.service;

import DeltaFlores.web.dto.CepaDto;
import DeltaFlores.web.entities.Cepa;
import DeltaFlores.web.entities.User;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.CepaRepository;
import DeltaFlores.web.repository.UserRepository;
import DeltaFlores.web.security.CustomUserDetails;
import DeltaFlores.web.utils.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Log4j2
@RequiredArgsConstructor
public class CepaService {

    private final CepaRepository cepaRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado en el contexto de seguridad"));
    }

    @Transactional(readOnly = true)
    public List<CepaDto> getCepasForCurrentUser() {
        User currentUser = getCurrentUser();
        log.info("\n\n\uD83D\uDD0E Buscando todas las cepas para el usuario: {}", currentUser.getUsername());
        List<CepaDto> cepas = cepaRepository.findByUserId(currentUser.getId()).stream()
                .map(DtoMapper::cepaToCepaDto)
                .collect(Collectors.toList());
        log.info("\n\n\u2728 {} cepas encontradas para el usuario: {}", cepas.size(), currentUser.getUsername());
        return cepas;
    }

    @Transactional(readOnly = true)
    public CepaDto getCepaById(Long id) {
        User currentUser = getCurrentUser();
        log.info("\n\n\uD83D\uDD0E Buscando cepa con ID: {} para el usuario: {}", id, currentUser.getUsername());
        Cepa cepa = cepaRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("\n\n\u26A0\uFE0F No se encontró la cepa con ID: {}", id);
                    return new ResourceNotFoundException("Cepa no encontrada con id: " + id);
                });

        boolean isOwner = cepa.getUser().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(role -> role.getAuthority().equals("ROLE_ADMIN") || role.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (!isOwner && !isAdmin) {
            log.warn("\n\n\uD83D\uDEAB Acceso denegado. El usuario '{}' no es propietario ni admin de la cepa con ID: {}", currentUser.getUsername(), id);
            throw new AccessDeniedException("No tienes permiso para ver esta cepa.");
        }

        CepaDto cepaDto = DtoMapper.cepaToCepaDto(cepa);
        log.info("\n\n\u2728 Cepa encontrada: {}", cepaDto.getGeneticaParental());
        return cepaDto;
    }

    @Transactional
    public CepaDto createCepa(CepaDto cepaDto) {
        User currentUser = getCurrentUser();
        log.info("\n\n\uD83D\uDCBE Creando nueva cepa: {} para el usuario: {}", cepaDto.getGeneticaParental(), currentUser.getUsername());
        try {
            Cepa cepa = new Cepa();
            cepa.setUser(currentUser); // Associate with current user first
            DtoMapper.cepaDtoToCepa(cepaDto, cepa); // Then map the rest of the fields
            Cepa savedCepa = cepaRepository.save(cepa);
            log.info("\n\n\u2728 Cepa creada con éxito con ID: {}", savedCepa.getId());
            return DtoMapper.cepaToCepaDto(savedCepa);
        } catch (Exception e) {
            log.error("\n\n\u274C Error al crear la cepa: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public CepaDto updateCepa(Long id, CepaDto cepaDto) {
        User currentUser = getCurrentUser();
        log.info("\n\n\u2B06\uFE0F Actualizando cepa con ID: {} por el usuario: {}", id, currentUser.getUsername());
        Cepa existingCepa = cepaRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("\n\n\u26A0\uFE0F No se puede actualizar. No se encontró la cepa con ID: {}", id);
                    return new ResourceNotFoundException("Cepa no encontrada con id: " + id);
                });

        boolean isOwner = existingCepa.getUser().getId().equals(currentUser.getId());
        boolean isSuperAdmin = currentUser.getAuthorities().stream()
                .anyMatch(role -> role.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (!isOwner && !isSuperAdmin) {
             log.warn("\n\n\uD83D\uDEAB Acceso denegado. El usuario '{}' no es propietario ni SUPER_ADMIN de la cepa con ID: {}", currentUser.getUsername(), id);
            throw new AccessDeniedException("No tienes permiso para actualizar esta cepa.");
        }

        try {
            Cepa updatedCepa = DtoMapper.cepaDtoToCepa(cepaDto, existingCepa);
            updatedCepa.setUser(existingCepa.getUser()); // Ensure user is preserved
            updatedCepa = cepaRepository.save(updatedCepa);
            log.info("\n\n\u2728 Cepa con ID: {} actualizada con éxito.", updatedCepa.getId());
            return DtoMapper.cepaToCepaDto(updatedCepa);
        } catch (Exception e) {
            log.error("\n\n\u274C Error al actualizar la cepa con ID: {}: {}", id, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public void deleteCepa(Long id) {
        User currentUser = getCurrentUser();
        log.info("\n\n\uD83D\uDDD1\uFE0F Intentando eliminar cepa con ID: {} por el usuario: {}", id, currentUser.getUsername());
        Cepa cepa = cepaRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("\n\n\u26A0\uFE0F No se puede eliminar. No se encontró la cepa con ID: {}", id);
                    return new ResourceNotFoundException("Cepa no encontrada con id: " + id);
                });

        boolean isOwner = cepa.getUser().getId().equals(currentUser.getId());
        boolean isSuperAdmin = currentUser.getAuthorities().stream()
                .anyMatch(role -> role.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (!isOwner && !isSuperAdmin) {
             log.warn("\n\n\uD83D\uDEAB Acceso denegado. El usuario '{}' no es propietario ni SUPER_ADMIN de la cepa con ID: {}", currentUser.getUsername(), id);
            throw new AccessDeniedException("No tienes permiso para eliminar esta cepa.");
        }

        try {
            cepaRepository.deleteById(id);
            log.info("\n\n\u2728 Cepa con ID: {} eliminada con éxito.", id);
        } catch (Exception e) {
            log.error("\n\n\u274C Error al eliminar la cepa con ID: {}: {}", id, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public List<CepaDto> getCepasByUserId(Long userId) {
        log.info("\n\n\uD83D\uDD0E Buscando todas las cepas para el usuario con ID: {}", userId);
        List<CepaDto> cepas = cepaRepository.findByUserId(userId).stream()
                .map(DtoMapper::cepaToCepaDto)
                .collect(Collectors.toList());
        log.info("\n\n\u2728 {} cepas encontradas para el usuario con ID: {}", cepas.size(), userId);
        return cepas;
    }
}
