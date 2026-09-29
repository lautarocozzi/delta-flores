package DeltaFlores.web.service;

import DeltaFlores.web.dto.PlantaDto;
import DeltaFlores.web.dto.SalaDto;
import DeltaFlores.web.entities.Cepa;
import DeltaFlores.web.entities.Planta;
import DeltaFlores.web.entities.Sala;
import DeltaFlores.web.entities.TipoColaborador;
import DeltaFlores.web.entities.User;
import DeltaFlores.web.entities.Zona;
import DeltaFlores.web.exception.ResourceAlreadyExistsException;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.CepaRepository;
import DeltaFlores.web.repository.FavoriteRepository;
import DeltaFlores.web.repository.PlantaRepository;
import DeltaFlores.web.repository.SalaColaboradorRepository;
import DeltaFlores.web.repository.SalaRepository;
import DeltaFlores.web.repository.UserRepository;
import DeltaFlores.web.repository.ZonaRepository;
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

@Log4j2
@Service
@RequiredArgsConstructor
public class PlantaService {

    private final PlantaRepository plantaRepository;
    private final UserRepository userRepository;
    private final SalaService salaService;
    private final CepaRepository cepaRepository;
    private final SalaColaboradorRepository salaColaboradorRepository;
    private final SalaRepository salaRepository;
    private final ZonaRepository zonaRepository;
    private final FavoriteRepository favoriteRepository;

    // --- Security & Helper Methods ---

    private Authentication getAuthentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }

    private User getCurrentUser() {
        CustomUserDetails userDetails = (CustomUserDetails) getAuthentication().getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado en el contexto de seguridad"));
    }

    private void checkOwnership(Planta planta) {
        Authentication authentication = getAuthentication();
        User currentUser = getCurrentUser();

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(role -> role.getAuthority().equals("ROLE_ADMIN") || role.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (isAdmin) {
            log.info("Acceso de administrador concedido para el usuario '{}' a la planta con ID: {}", currentUser.getUsername(), planta.getId());
            return; // Skip ownership check
        }

        if (planta.getUser().getId().equals(currentUser.getId())) {
            return; // Owner of the plant
        }

        // Check if user is an EDITOR collaborator of the sala where the plant lives
        if (planta.getSala() != null) {
            try {
                salaService.checkAccess(planta.getSala(), TipoColaborador.EDITOR);
                log.debug("Acceso como colaborador EDITOR de sala concedido para planta ID: {}", planta.getId());
                return;
            } catch (AccessDeniedException e) {
                // Not a collaborator of this sala, fall through to denial
            }
        }

        log.warn("ACCESO DENEGADO: El usuario '{}' (ID: {}) intentó acceder a la planta con ID: {}, que pertenece al usuario con ID: {}",
                currentUser.getUsername(), currentUser.getId(), planta.getId(), planta.getUser().getId());
        throw new AccessDeniedException("No tiene permiso para acceder a esta planta.");
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(role -> role.getAuthority().equals("ROLE_ADMIN") || role.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }

    // --- CRUD Methods ---

    @Transactional
    public PlantaDto createPlanta(PlantaDto plantaDto) {
        User currentUser = getCurrentUser();
        log.info("Usuario '{}' creando nueva planta: {}", currentUser.getUsername(), plantaDto.getNombre());

        // Fetch Sala first — needed for both access check and cepa authorization
        Sala sala = salaRepository.findById(plantaDto.getSalaId())
                .orElseThrow(() -> new ResourceNotFoundException("Sala no encontrada con id: " + plantaDto.getSalaId()));

        // Fetch Cepa and check authorization
        Cepa cepa = cepaRepository.findById(plantaDto.getCepaId())
                .orElseThrow(() -> new ResourceNotFoundException("Cepa no encontrada con id: " + plantaDto.getCepaId()));
        
        boolean isOwner = cepa.getUser().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(role -> role.getAuthority().equals("ROLE_ADMIN") || role.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (!isOwner && !isAdmin) {
            // Allow EDITOR collaborators to use the sala owner's cepas
            boolean isEditorInSala = salaColaboradorRepository
                    .findBySalaIdAndUserId(sala.getId(), currentUser.getId())
                    .map(sc -> sc.getTipoColaborador() == TipoColaborador.EDITOR)
                    .orElse(false);
            boolean isCepaFromSalaOwner = cepa.getUser().getId().equals(sala.getUser().getId());
            if (!(isEditorInSala && isCepaFromSalaOwner)) {
                log.warn("ACCESO DENEGADO: El usuario '{}' intentó crear una planta usando la cepa con ID: {}, que no le pertenece.",
                        currentUser.getUsername(), cepa.getId());
                throw new AccessDeniedException("No tienes permiso para usar esta cepa. Solo los dueños, administradores o editores colaboradores pueden hacerlo.");
            }
        }

        // Verify sala access (owner or EDITOR collaborator)
        salaService.checkAccess(sala, TipoColaborador.EDITOR);


        // Handle zona assignment and auto-generate ubicacion
        Zona zona = null;
        if (plantaDto.getZonaId() != null) {
            zona = zonaRepository.findById(plantaDto.getZonaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Zona no encontrada con id: " + plantaDto.getZonaId()));

            // Validate column/row within bounds
            if (plantaDto.getColumnaEnZona() == null || plantaDto.getFilaEnZona() == null) {
                throw new IllegalArgumentException("Columna y fila son requeridas cuando se asigna una zona.");
            }
            if (plantaDto.getColumnaEnZona() < 0 || plantaDto.getColumnaEnZona() >= zona.getColumnas()) {
                throw new IllegalArgumentException("Columna fuera de los límites de la zona (0-" + (zona.getColumnas() - 1) + ").");
            }
            if (plantaDto.getFilaEnZona() < 0 || plantaDto.getFilaEnZona() >= zona.getFilas()) {
                throw new IllegalArgumentException("Fila fuera de los límites de la zona (0-" + (zona.getFilas() - 1) + ").");
            }

            // Check cell is not already occupied
            boolean occupied = plantaRepository.existsByZonaIdAndColumnaEnZonaAndFilaEnZona(
                    zona.getId(), plantaDto.getColumnaEnZona(), plantaDto.getFilaEnZona());
            if (occupied) {
                throw new ResourceAlreadyExistsException(
                        "La celda (" + plantaDto.getColumnaEnZona() + ", " + plantaDto.getFilaEnZona() +
                        ") ya está ocupada en la zona '" + zona.getNombre() + "'.");
            }

            // Auto-generate ubicacion
            String ubicacion = DtoMapper.generarUbicacion(
                    zona.getNombre(),
                    plantaDto.getColumnaEnZona(), plantaDto.getFilaEnZona());
            plantaDto.setUbicacion(ubicacion);
        }

        Planta planta = DtoMapper.plantaDtoToPlanta(new Planta(), plantaDto, cepa, sala, zona);
        planta.setUser(currentUser); // Set owner

        Planta savedPlanta = plantaRepository.save(planta);
        log.info("Planta {} creada con ID: {} para el usuario '{}'", savedPlanta.getNombre(), savedPlanta.getId(), currentUser.getUsername());
        return DtoMapper.plantaToPlantaDto(savedPlanta);
    }

    @Transactional(readOnly = true)
    public List<PlantaDto> getAllPlantas() {
        User currentUser = getCurrentUser();
        log.info("Obteniendo todas las plantas para el usuario '{}'", currentUser.getUsername());
        return plantaRepository.findByUserId(currentUser.getId()).stream().map(DtoMapper::plantaToPlantaDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PlantaDto getPlantaById(Long id) {
        log.info("Buscando planta con ID: {}", id);
        Planta planta = plantaRepository.findByIdWithEvents(id)
                .orElseThrow(() -> new ResourceNotFoundException("Planta no encontrada con id: " + id));
        checkOwnership(planta);
        log.info("Planta con ID: {} encontrada y verificada.", id);
        return DtoMapper.plantaToPlantaDto(planta);
    }

    @Transactional(readOnly = true)
    public List<PlantaDto> getPublicPlantas() {
        log.info("Obteniendo plantas públicas");
        return plantaRepository.findByIsPublicTrue().stream()
                .map(DtoMapper::plantaToPlantaDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PlantaDto> getPublicPlantasByUserId(Long userId) {
        log.info("Obteniendo plantas públicas del usuario ID: {}", userId);
        List<PlantaDto> dtos = plantaRepository.findByIsPublicTrueAndUserId(userId).stream()
                .map(DtoMapper::plantaToPlantaDto)
                .collect(Collectors.toList());

        // Enrich with favoriteCount
        if (!dtos.isEmpty()) {
            List<Long> plantIds = dtos.stream().map(PlantaDto::getId).collect(Collectors.toList());
            List<Object[]> counts = favoriteRepository.countByFavorableIdsAndType(plantIds, "PLANTA");
            java.util.Map<Long, Long> countMap = counts.stream()
                    .collect(java.util.stream.Collectors.toMap(
                            row -> (Long) row[0],
                            row -> (Long) row[1]
                    ));
            dtos.forEach(dto -> dto.setFavoriteCount(
                    countMap.getOrDefault(dto.getId(), 0L).intValue()
            ));
        }

        return dtos;
    }

    @Transactional
    public void deletePlanta(Long id) {
        log.info("Intentando eliminar planta con ID: {}", id);
        Planta planta = plantaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Planta no encontrada con id: " + id));
        checkOwnership(planta);
        plantaRepository.deleteById(id);
        log.info("Planta con ID: {} eliminada con éxito.", id);
    }

    @Transactional
    public PlantaDto updatePlanta(Long id, PlantaDto plantaDto) {
        log.info("Actualizando planta con ID: {}", id);
        Planta existingPlanta = plantaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Planta no encontrada con id: " + id));
        checkOwnership(existingPlanta);

        // Fetch Cepa and check authorization
        Cepa cepa = cepaRepository.findById(plantaDto.getCepaId())
                .orElseThrow(() -> new ResourceNotFoundException("Cepa no encontrada con id: " + plantaDto.getCepaId()));
        
        User currentUser = getCurrentUser();
        boolean isOwner = cepa.getUser().getId().equals(currentUser.getId());
        boolean isAdmin = isAdmin(getAuthentication());

        if (!isOwner && !isAdmin) {
            log.warn("ACCESO DENEGADO: El usuario '{}' intentó actualizar una planta usando la cepa con ID: {}, que no le pertenece.",
                    currentUser.getUsername(), cepa.getId());
            throw new AccessDeniedException("No tienes permiso para usar esta cepa.");
        }

        // Fetch Sala and check authorization (owner or EDITOR collaborator)
        Sala sala = salaRepository.findById(plantaDto.getSalaId())
                .orElseThrow(() -> new ResourceNotFoundException("Sala no encontrada con id: " + plantaDto.getSalaId()));
        salaService.checkAccess(sala, TipoColaborador.EDITOR);

        // Handle zona assignment
        Zona zona = null;
        if (plantaDto.getZonaId() != null) {
            zona = zonaRepository.findById(plantaDto.getZonaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Zona no encontrada con id: " + plantaDto.getZonaId()));

            // Validate column/row within bounds
            if (plantaDto.getColumnaEnZona() == null || plantaDto.getFilaEnZona() == null) {
                throw new IllegalArgumentException("Columna y fila son requeridas cuando se asigna una zona.");
            }
            if (plantaDto.getColumnaEnZona() < 0 || plantaDto.getColumnaEnZona() >= zona.getColumnas()) {
                throw new IllegalArgumentException("Columna fuera de los límites de la zona (0-" + (zona.getColumnas() - 1) + ").");
            }
            if (plantaDto.getFilaEnZona() < 0 || plantaDto.getFilaEnZona() >= zona.getFilas()) {
                throw new IllegalArgumentException("Fila fuera de los límites de la zona (0-" + (zona.getFilas() - 1) + ").");
            }

            // Check cell occupancy excluding the current plant
            boolean occupied = plantaRepository.existsOtherAtCell(
                    zona.getId(), plantaDto.getColumnaEnZona(), plantaDto.getFilaEnZona(), id);
            if (occupied) {
                throw new ResourceAlreadyExistsException(
                        "La celda (" + plantaDto.getColumnaEnZona() + ", " + plantaDto.getFilaEnZona() +
                        ") ya está ocupada en la zona '" + zona.getNombre() + "'.");
            }
        }

        // Use the mapper to update the entity with the resolved zona
        Planta updatedPlanta = DtoMapper.plantaDtoToPlanta(existingPlanta, plantaDto, cepa, sala, zona);
        
        plantaRepository.save(updatedPlanta);
        log.info("Planta con ID: {} actualizada con éxito.", updatedPlanta.getId());
        return DtoMapper.plantaToPlantaDto(updatedPlanta);
    }

    @Transactional
    public PlantaDto updateUbicacion(Long plantaId, Long zonaId, Integer columna, Integer fila) {
        log.info("Actualizando ubicación de planta ID: {} a zonaId: {}, columna: {}, fila: {}", plantaId, zonaId, columna, fila);
        Planta planta = plantaRepository.findById(plantaId)
                .orElseThrow(() -> new ResourceNotFoundException("Planta no encontrada con id: " + plantaId));
        checkOwnership(planta);

        if (zonaId != null) {
            Zona zona = zonaRepository.findById(zonaId)
                    .orElseThrow(() -> new ResourceNotFoundException("Zona no encontrada con id: " + zonaId));

            if (columna == null || fila == null) {
                throw new IllegalArgumentException("Columna y fila son requeridas cuando se asigna una zona.");
            }
            if (columna < 0 || columna >= zona.getColumnas()) {
                throw new IllegalArgumentException("Columna fuera de los límites de la zona (0-" + (zona.getColumnas() - 1) + ").");
            }
            if (fila < 0 || fila >= zona.getFilas()) {
                throw new IllegalArgumentException("Fila fuera de los límites de la zona (0-" + (zona.getFilas() - 1) + ").");
            }

            // Check cell occupancy excluding the current plant (allows no-op re-save)
            boolean occupied = plantaRepository.existsOtherAtCell(zonaId, columna, fila, plantaId);
            if (occupied) {
                throw new ResourceAlreadyExistsException(
                        "La celda (" + columna + ", " + fila + ") ya está ocupada en la zona '" + zona.getNombre() + "'.");
            }

            planta.setZona(zona);
            planta.setColumnaEnZona(columna);
            planta.setFilaEnZona(fila);

            // Auto-generate ubicacion
            String ubicacion = DtoMapper.generarUbicacion(
                    zona.getNombre(), columna, fila);
            planta.setUbicacion(ubicacion);
        } else {
            // Removing from grid: clear grid fields and reset ubicacion
            planta.setZona(null);
            planta.setColumnaEnZona(null);
            planta.setFilaEnZona(null);
            planta.setUbicacion("");
        }

        Planta savedPlanta = plantaRepository.save(planta);
        log.info("Ubicación de planta ID: {} actualizada con éxito.", plantaId);
        return DtoMapper.plantaToPlantaDto(savedPlanta);
    }

    // --- Search Methods ---

    @Transactional(readOnly = true)
    public List<PlantaDto> buscarPlantasPorPalabraClave(String palabraClave) {
        Authentication authentication = getAuthentication();
        User currentUser = getCurrentUser();
        List<Planta> plantas;

        if (isAdmin(authentication)) {
            log.info("Admin buscando todas las plantas por palabra clave: {}", palabraClave);
            plantas = plantaRepository.findByNombre(palabraClave);
        } else {
            log.info("Usuario '{}' buscando sus plantas por palabra clave: {}", currentUser.getUsername(), palabraClave);
            // This is not optimal. A custom query would be better.
            // For now, filter in memory.
            List<Planta> userPlantas = plantaRepository.findByUserId(currentUser.getId());
            plantas = userPlantas.stream()
                .filter(p -> p.getNombre().toLowerCase().contains(palabraClave.toLowerCase()))
                .collect(Collectors.toList());
        }
        
        log.info("{} plantas encontradas por palabra clave '{}'.", plantas.size(), palabraClave);
        return plantas.stream().map(DtoMapper::plantaToPlantaDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PlantaDto> plantasPorSala(Long salaId) {
        log.info("Buscando plantas por ID de sala: {}", salaId);
        // First, check if the user has access to the sala
        salaService.getSalaById(salaId);
        
        // If the above check passes, the user is either the owner or an admin, so it's safe to list the plants.
        List<Planta> plantas = plantaRepository.findBySalaId(salaId);
                
                log.info("{} plantas encontradas para sala ID: {}.", plantas.size(), salaId);
                return plantas.stream().map(DtoMapper::plantaToPlantaDto).collect(Collectors.toList());
            }
        
                @Transactional
                public PlantaDto transferPlanta(Long plantaId, Long newOwnerId) {
                    log.info("Iniciando transferencia de la planta ID: {} al nuevo propietario ID: {}", plantaId, newOwnerId);
                    
                    Planta planta = plantaRepository.findById(plantaId)
                        .orElseThrow(() -> new ResourceNotFoundException("Planta a transferir no encontrada con id: " + plantaId));
            
                    User newOwner = userRepository.findById(newOwnerId)
                        .orElseThrow(() -> new ResourceNotFoundException("Usuario destinatario no encontrado con id: " + newOwnerId));
                        
                    log.warn("Transferencia de propiedad de la planta '{}' (ID: {}) del usuario '{}' (ID: {}) al usuario '{}' (ID: {})", 
                        planta.getNombre(), planta.getId(), planta.getUser().getUsername(), planta.getUser().getId(), newOwner.getUsername(), newOwner.getId());
            
                    planta.setUser(newOwner);
                    Planta transferredPlanta = plantaRepository.save(planta);
                    
                    return DtoMapper.plantaToPlantaDto(transferredPlanta);
                }
            
                    @Transactional
                    public PlantaDto togglePublicStatus(Long plantaId) {
                        log.info("Cambiando estado de visibilidad para la planta ID: {}", plantaId);
                        Planta planta = plantaRepository.findById(plantaId)
                                .orElseThrow(() -> new ResourceNotFoundException("Planta no encontrada con id: " + plantaId));
                
                        // Only the owner or an admin can change the public status
                        checkOwnership(planta);
                
                        planta.setPublic(!planta.isPublic());
                        Planta updatedPlanta = plantaRepository.save(planta);
                
                        log.info("El estado de visibilidad para la planta ID: {} ha sido cambiado a: {}", plantaId, updatedPlanta.isPublic());
                        return DtoMapper.plantaToPlantaDto(updatedPlanta);
                    }
                
                    @Transactional(readOnly = true)
                    public List<PlantaDto> getPlantasByUserId(Long userId) {
                        log.info("Buscando todas las plantas para el usuario con ID: {}", userId);
                        List<Planta> plantas = plantaRepository.findByUserId(userId);
                        log.info("{} plantas encontradas para el usuario con ID: {}", plantas.size(), userId);
                        return plantas.stream().map(DtoMapper::plantaToPlantaDto).collect(Collectors.toList());
                    }

                    @Transactional
                    public void swapPlantasUbicacion(Long plantaId1, Long plantaId2) {
                        Planta p1 = plantaRepository.findById(plantaId1)
                                .orElseThrow(() -> new ResourceNotFoundException("Planta no encontrada con id: " + plantaId1));
                        Planta p2 = plantaRepository.findById(plantaId2)
                                .orElseThrow(() -> new ResourceNotFoundException("Planta no encontrada con id: " + plantaId2));

                        // Verify access to both plants' salas (EDITOR required for swap)
                        if (p1.getSala() != null) salaService.checkAccess(p1.getSala(), TipoColaborador.EDITOR);
                        if (p2.getSala() != null) salaService.checkAccess(p2.getSala(), TipoColaborador.EDITOR);

                        // Swap zone assignments
                        Long tempZonaId = p1.getZona() != null ? p1.getZona().getId() : null;
                        Integer tempCol = p1.getColumnaEnZona();
                        Integer tempFila = p1.getFilaEnZona();

                        // Set p1 from p2
                        p1.setZona(p2.getZona());
                        p1.setColumnaEnZona(p2.getColumnaEnZona());
                        p1.setFilaEnZona(p2.getFilaEnZona());

                        // Set p2 from temp (p1's original)
                        Zona tempZona = tempZonaId != null ? zonaRepository.findById(tempZonaId).orElse(null) : null;
                        p2.setZona(tempZona);
                        p2.setColumnaEnZona(tempCol);
                        p2.setFilaEnZona(tempFila);

                        plantaRepository.save(p1);
                        plantaRepository.save(p2);
                        log.info("Swap ubicación: planta {} ↔ planta {}", plantaId1, plantaId2);
                    }
                }            
