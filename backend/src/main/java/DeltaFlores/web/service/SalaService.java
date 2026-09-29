package DeltaFlores.web.service;

import DeltaFlores.web.dto.MeasurementEventDto;
import DeltaFlores.web.dto.SalaColaboradorDto;
import DeltaFlores.web.dto.SalaDto;
import DeltaFlores.web.entities.MeasurementEvent;
import DeltaFlores.web.entities.Planta;
import DeltaFlores.web.entities.Sala;
import DeltaFlores.web.entities.SalaColaborador;
import DeltaFlores.web.entities.TipoColaborador;
import DeltaFlores.web.entities.User;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.MeasurementEventRepository;
import DeltaFlores.web.repository.PlantaRepository;
import DeltaFlores.web.repository.SalaColaboradorRepository;
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

import java.util.Map;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@Log4j2
@RequiredArgsConstructor
public class SalaService {

    private final SalaRepository salaRepository;
    private final UserRepository userRepository;
    private final SalaColaboradorRepository salaColaboradorRepository;
    private final MeasurementEventRepository measurementEventRepository;
    private final PlantaRepository plantaRepository;

    private Authentication getAuthentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }

    private User getCurrentUser() {
        CustomUserDetails userDetails = (CustomUserDetails) getAuthentication().getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado en el contexto de seguridad"));
    }

    public Long getUserIdByEmail(String email) {
        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró usuario con email: " + email));
    }

    /**
     * Checks if the current user has access to the sala.
     * Access granted if: user is ADMIN/SUPER_ADMIN, user is the sala owner,
     * or user is a registered colaborador.
     * Delegates to checkAccess(sala, null) for backward compatibility.
     */
    public void checkAccess(Sala sala) {
        checkAccess(sala, null);
    }

    /**
     * Checks if the current user has the required access level to the sala.
     * Access levels:
     *   - null (no specific level): any collaborator (EDITOR or LECTURA) passes
     *   - EDITOR: must be owner, admin, or an EDITOR collaborator
     *   - LECTURA: any collaborator passes (EDITOR or LECTURA)
     */
    public void checkAccess(Sala sala, TipoColaborador requiredLevel) {
        Authentication authentication = getAuthentication();
        User currentUser = getCurrentUser();

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(role -> role.getAuthority().equals("ROLE_ADMIN") || role.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (isAdmin) {
            log.debug("Acceso de administrador concedido para el usuario '{}' a la sala ID: {}", currentUser.getUsername(), sala.getId());
            return;
        }

        // Owner check — owners always have full access
        if (sala.getUser().getId().equals(currentUser.getId())) {
            return;
        }

        // Colaborador check
        Optional<TipoColaborador> maybeTipo = getColaboradorTipo(sala.getId(), currentUser.getId());
        if (maybeTipo.isPresent()) {
            TipoColaborador tipo = maybeTipo.get();
            if (requiredLevel == null) {
                // Any collaborator type is sufficient
                log.debug("Acceso como colaborador ({}) concedido para el usuario '{}' a la sala ID: {}",
                        tipo, currentUser.getUsername(), sala.getId());
                return;
            }
            if (requiredLevel == TipoColaborador.LECTURA) {
                // Both EDITOR and LECTURA collaborators can read
                log.debug("Acceso de lectura como colaborador ({}) concedido para el usuario '{}' a la sala ID: {}",
                        tipo, currentUser.getUsername(), sala.getId());
                return;
            }
            if (requiredLevel == TipoColaborador.EDITOR && tipo == TipoColaborador.EDITOR) {
                log.debug("Acceso de edición como colaborador concedido para el usuario '{}' a la sala ID: {}",
                        currentUser.getUsername(), sala.getId());
                return;
            }
            // LECTURA collaborator tried to access EDITOR-only operation
            log.warn("ACCESO DENEGADO: El colaborador de LECTURA '{}' intentó una operación de edición en la sala ID: {}",
                    currentUser.getUsername(), sala.getId());
            throw new AccessDeniedException("No tiene permiso de edición en esta sala. Su rol es de solo lectura.");
        }

        log.warn("ACCESO DENEGADO: El usuario '{}' (ID: {}) intentó acceder a la sala ID: {}, que pertenece al usuario ID: {}",
                currentUser.getUsername(), currentUser.getId(), sala.getId(), sala.getUser().getId());
        throw new AccessDeniedException("No tiene permiso para acceder a esta sala.");
    }

    /**
     * Returns the collaborator type for a user in a specific sala, or empty if not a collaborator.
     */
    private Optional<TipoColaborador> getColaboradorTipo(Long salaId, Long userId) {
        return salaColaboradorRepository.findBySalaIdAndUserId(salaId, userId)
                .map(SalaColaborador::getTipoColaborador);
    }

    /**
     * Returns true if the given user is an EDITOR collaborator in the specified sala.
     * Does NOT throw — returns false if the user is not a collaborator or is LECTURA only.
     */
    public boolean isEditor(Long salaId, Long userId) {
        return getColaboradorTipo(salaId, userId)
                .map(tipo -> tipo == TipoColaborador.EDITOR)
                .orElse(false);
    }

    // ─── Sala CRUD ─────────────────────────────────────────────

    @Transactional
    public SalaDto createSala(SalaDto salaDto) {
        User currentUser = getCurrentUser();
        log.info("Usuario '{}' (ID: {}) está creando una nueva sala: {}", currentUser.getUsername(), currentUser.getId(), salaDto.getNombre());

        Sala sala = DtoMapper.salaDtoToSala(salaDto, new Sala());
        sala.setUser(currentUser);

        Sala savedSala = salaRepository.save(sala);
        log.info("Sala {} creada con ID: {} para el usuario '{}'", savedSala.getNombre(), savedSala.getId(), currentUser.getUsername());
        return DtoMapper.salaToSalaDto(savedSala);
    }

    @Transactional(readOnly = true)
    public List<SalaDto> getAllSalas() {
        User currentUser = getCurrentUser();
        log.info("Obteniendo salas para el usuario '{}' (ID: {}) — propias + colaboradas", currentUser.getUsername(), currentUser.getId());

        List<Sala> propias = salaRepository.findByUserId(currentUser.getId());
        List<Sala> colaboradas = salaColaboradorRepository.findByUserId(currentUser.getId()).stream()
                .map(SalaColaborador::getSala)
                .collect(Collectors.toList());

        return Stream.concat(propias.stream(), colaboradas.stream())
                .distinct()
                .map(DtoMapper::salaToSalaDto)
                .collect(Collectors.toList());
    }

    /**
     * Returns salas where the current user is owner OR colaborador.
     */
    @Transactional(readOnly = true)
    public List<SalaDto> getSalasDisponibles() {
        User currentUser = getCurrentUser();
        log.debug("Obteniendo salas disponibles para usuario ID: {}", currentUser.getId());

        // Own salas
        List<Sala> propias = salaRepository.findByUserId(currentUser.getId());

        // Colaborated salas with tipo
        List<SalaColaborador> colaboraciones = salaColaboradorRepository.findByUserId(currentUser.getId());
        Map<Long, String> colabTipoMap = colaboraciones.stream()
                .collect(Collectors.toMap(
                        sc -> sc.getSala().getId(),
                        sc -> sc.getTipoColaborador() != null ? sc.getTipoColaborador().name() : "EDITOR"
                ));
        List<Sala> colaboradas = colaboraciones.stream()
                .map(SalaColaborador::getSala)
                .collect(Collectors.toList());

        // Merge without duplicates
        return Stream.concat(propias.stream(), colaboradas.stream())
                .distinct()
                .map(sala -> {
                    SalaDto dto = DtoMapper.salaToSalaDto(sala);
                    // Set tipoColaborador for salas where user is a collaborator
                    if (!sala.getUser().getId().equals(currentUser.getId())) {
                        dto.setTipoColaborador(colabTipoMap.getOrDefault(sala.getId(), "EDITOR"));
                    }
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SalaDto> getPublicSalasByUserId(Long userId, boolean includeCollaborations) {
        log.info("Obteniendo salas públicas del usuario ID: {} (includeCollaborations={})", userId, includeCollaborations);

        // Salas propias que el dueño marcó como públicas
        List<Sala> propiasPublicas = salaRepository.findByIsPublicTrueAndUserId(userId);

        if (!includeCollaborations) {
            // Solo las salas públicas propias (perfil de otro usuario)
            return propiasPublicas.stream()
                    .map(DtoMapper::salaToSalaDto)
                    .collect(Collectors.toList());
        }

        // Salas donde el usuario es colaborador (solo para su propio perfil)
        User currentUser = getCurrentUser();
        List<SalaColaborador> colaboraciones = salaColaboradorRepository.findByUserId(userId);
        Map<Long, String> colabTipoMap = colaboraciones.stream()
                .collect(Collectors.toMap(
                        sc -> sc.getSala().getId(),
                        sc -> sc.getTipoColaborador() != null ? sc.getTipoColaborador().name() : "EDITOR"
                ));
        List<Sala> colaboradas = colaboraciones.stream()
                .map(SalaColaborador::getSala)
                .collect(Collectors.toList());

        // Merge sin duplicados
        return Stream.concat(propiasPublicas.stream(), colaboradas.stream())
                .distinct()
                .map(sala -> {
                    SalaDto dto = DtoMapper.salaToSalaDto(sala);
                    if (!sala.getUser().getId().equals(currentUser.getId())) {
                        dto.setTipoColaborador(colabTipoMap.getOrDefault(sala.getId(), "EDITOR"));
                    }
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SalaDto getSalaById(Long id) {
        log.info("Buscando sala con ID: {}", id);
        Sala sala = salaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sala no encontrada con id: " + id));

        checkAccess(sala);

        SalaDto dto = DtoMapper.salaToSalaDto(sala);

        // Populate tipoColaborador if current user is a collaborator
        User currentUser = getCurrentUser();
        if (!sala.getUser().getId().equals(currentUser.getId())) {
            salaColaboradorRepository.findBySalaIdAndUserId(id, currentUser.getId())
                    .ifPresent(sc -> dto.setTipoColaborador(
                            sc.getTipoColaborador() != null ? sc.getTipoColaborador().name() : "EDITOR"
                    ));
        }

        log.info("Sala con ID: {} encontrada y verificada.", id);
        return dto;
    }

    @Transactional(readOnly = true)
    public SalaDto getSalaByUsernameAndId(String username, Long salaId) {
        log.info("Buscando sala ID: {} del usuario: {}", salaId, username);
        User owner = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con username: " + username));

        Sala sala = salaRepository.findById(salaId)
                .orElseThrow(() -> new ResourceNotFoundException("Sala no encontrada con id: " + salaId));

        // Verificar que la sala pertenece al usuario indicado
        if (!sala.getUser().getId().equals(owner.getId())) {
            throw new AccessDeniedException("Acceso denegado a esta sala.");
        }

        // Si es pública, cualquier usuario autenticado puede verla
        if (sala.isPublic()) {
            log.info("Sala ID: {} es pública, acceso concedido.", salaId);
            return DtoMapper.salaToSalaDto(sala);
        }

        // Si es privada, verificar acceso normal (owner, colaborador, admin)
        checkAccess(sala);

        log.info("Sala ID: {} del usuario {} encontrada y verificada.", salaId, username);
        return DtoMapper.salaToSalaDto(sala);
    }

    @Transactional
    public SalaDto updateSala(Long id, SalaDto salaDto) {
        log.info("Actualizando sala con ID: {}", id);
        Sala sala = salaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sala no encontrada con id: " + id));

        checkAccess(sala, TipoColaborador.EDITOR);

        Sala updatedSalaEntity = DtoMapper.salaDtoToSala(salaDto, sala);
        updatedSalaEntity = salaRepository.save(updatedSalaEntity);
        log.info("Sala con ID: {} actualizada.", updatedSalaEntity.getId());
        return DtoMapper.salaToSalaDto(updatedSalaEntity);
    }

    @Transactional
    public void deleteSala(Long id, boolean deletePlants) {
        log.info("Eliminando sala con ID: {} (deletePlants={})", id, deletePlants);
        Sala sala = salaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sala no encontrada con id: " + id));

        checkAccess(sala, TipoColaborador.EDITOR);

        if (deletePlants) {
            // Limpiar join table plants_has_events antes de eliminar plantas
            List<Long> plantaIds = sala.getPlantas().stream()
                    .map(Planta::getId)
                    .collect(Collectors.toList());
            if (!plantaIds.isEmpty()) {
                plantaRepository.deleteEventsByPlantaIds(plantaIds);
            }
            // Eliminar plantas manualmente (FK no tiene cascade)
            List<Planta> plantas = new ArrayList<>(sala.getPlantas());
            for (Planta planta : plantas) {
                plantaRepository.deleteById(planta.getId());
            }
            log.info("{} plantas eliminadas junto con sala ID: {}", plantas.size(), id);
        } else {
            // Desasociar plantas (salaId = null)
            List<Planta> plantas = new ArrayList<>(sala.getPlantas());
            for (Planta planta : plantas) {
                planta.setSala(null);
                plantaRepository.save(planta);
            }
            log.info("{} plantas desasociadas de sala ID: {}", plantas.size(), id);
        }

        salaRepository.deleteById(id);
        log.info("Sala con ID: {} eliminada.", id);
    }

    @Transactional
    public SalaDto toggleSalaPublic(Long id, boolean propagateVisibility) {
        log.info("Cambiando visibilidad de sala ID: {}, propagateVisibility: {}", id, propagateVisibility);
        Sala sala = salaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sala no encontrada con id: " + id));

        checkAccess(sala, TipoColaborador.EDITOR);

        sala.setPublic(!sala.isPublic());

        // Propagar visibilidad a plantas solo si el usuario lo pidió
        if (propagateVisibility) {
            for (Planta planta : sala.getPlantas()) {
                planta.setPublic(sala.isPublic());
            }
        }

        Sala saved = salaRepository.save(sala);
        log.info("Sala ID: {} visibilidad cambiada a: {}, propagateVisibility: {}", id, saved.isPublic(), propagateVisibility);
        return DtoMapper.salaToSalaDto(saved);
    }

    @Transactional
    public SalaDto toggleSalaPin(Long id) {
        log.info("Cambiando pin de sala ID: {}", id);
        Sala sala = salaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sala no encontrada con id: " + id));

        checkAccess(sala, TipoColaborador.EDITOR);

        sala.setPinned(!sala.isPinned());
        Sala saved = salaRepository.save(sala);
        log.info("Sala ID: {} pin cambiado a: {}", id, saved.isPinned());
        return DtoMapper.salaToSalaDto(saved);
    }

    // ─── Colaboradores ──────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SalaColaboradorDto> getColaboradores(Long salaId) {
        Sala sala = salaRepository.findById(salaId)
                .orElseThrow(() -> new ResourceNotFoundException("Sala no encontrada con id: " + salaId));

        // Only owner, admin, or EDITOR collaborator can list colaboradores
        checkAccess(sala, TipoColaborador.EDITOR);

        return salaColaboradorRepository.findBySalaId(salaId).stream()
                .map(DtoMapper::salaColaboradorToDto)
                .collect(Collectors.toList());
    }

    /**
     * Get all unique collaborators from salas where the given user is the owner.
     * Used for task assignment dropdown.
     */
    @Transactional(readOnly = true)
    public List<SalaColaboradorDto> getColaboradoresByOwnerId(Long ownerId) {
        return salaColaboradorRepository.findColaboradoresByOwnerId(ownerId).stream()
                .map(DtoMapper::salaColaboradorToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public SalaColaboradorDto agregarColaborador(Long salaId, Long userId, TipoColaborador tipoColaborador) {
        Sala sala = salaRepository.findById(salaId)
                .orElseThrow(() -> new ResourceNotFoundException("Sala no encontrada con id: " + salaId));

        // Only sala owner or SUPER_ADMIN can add colaboradores
        User currentUser = getCurrentUser();
        boolean isSuperAdmin = getAuthentication().getAuthorities().stream()
                .anyMatch(role -> role.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (!sala.getUser().getId().equals(currentUser.getId()) && !isSuperAdmin) {
            log.warn("ACCESO DENEGADO: Usuario '{}' intentó agregar colaborador a sala ID: {} sin ser el dueño",
                    currentUser.getUsername(), salaId);
            throw new AccessDeniedException("Solo el dueño de la sala o SUPER_ADMIN puede agregar colaboradores.");
        }

        User colaborador = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con id: " + userId));

        if (salaColaboradorRepository.existsBySalaIdAndUserId(salaId, userId)) {
            throw new IllegalArgumentException("El usuario ya es colaborador de esta sala.");
        }

        TipoColaborador tipo = tipoColaborador != null ? tipoColaborador : TipoColaborador.EDITOR;
        SalaColaborador sc = new SalaColaborador(sala, colaborador, tipo);
        SalaColaborador saved = salaColaboradorRepository.save(sc);
        log.info("Usuario '{}' (ID: {}) agregado como colaborador ({}) a sala ID: {}", colaborador.getUsername(), userId, tipo, salaId);
        return DtoMapper.salaColaboradorToDto(saved);
    }

    @Transactional
    public void removerColaborador(Long salaId, Long userId) {
        Sala sala = salaRepository.findById(salaId)
                .orElseThrow(() -> new ResourceNotFoundException("Sala no encontrada con id: " + salaId));

        // Only sala owner or SUPER_ADMIN can remove colaboradores
        User currentUser = getCurrentUser();
        boolean isSuperAdmin = getAuthentication().getAuthorities().stream()
                .anyMatch(role -> role.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (!sala.getUser().getId().equals(currentUser.getId()) && !isSuperAdmin) {
            log.warn("ACCESO DENEGADO: Usuario '{}' intentó remover colaborador de sala ID: {} sin ser el dueño",
                    currentUser.getUsername(), salaId);
            throw new AccessDeniedException("Solo el dueño de la sala o SUPER_ADMIN puede remover colaboradores.");
        }

        salaColaboradorRepository.deleteBySalaIdAndUserId(salaId, userId);
        log.info("Usuario ID: {} removido como colaborador de sala ID: {}", userId, salaId);
    }

    /**
     * Returns MeasurementEvents for a specific sala from the last N months.
     * Access check: user must have access to the sala (owner, collaborator, or admin).
     */
    @Transactional(readOnly = true)
    public List<MeasurementEventDto> getSalaMetrics(Long salaId, int months) {
        Sala sala = salaRepository.findById(salaId)
                .orElseThrow(() -> new ResourceNotFoundException("Sala no encontrada con id: " + salaId));
        checkAccess(sala);

        LocalDate fromDate = LocalDate.now().minusMonths(months);
        List<MeasurementEvent> events = measurementEventRepository.findBySalaIdAndFechaAfter(salaId, fromDate);

        return events.stream()
                .map(DtoMapper::measurementEventToMeasurementEventDto)
                .collect(Collectors.toList());
    }
}
