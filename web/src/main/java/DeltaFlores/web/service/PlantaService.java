package DeltaFlores.web.service;

import DeltaFlores.web.dto.PlantaDto;
import DeltaFlores.web.dto.SalaDto;
import DeltaFlores.web.entities.Cepa;
import DeltaFlores.web.entities.Planta;
import DeltaFlores.web.entities.User;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.CepaRepository;
import DeltaFlores.web.repository.PlantaRepository;
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

@Log4j2
@Service
@RequiredArgsConstructor
public class PlantaService {

    private final PlantaRepository plantaRepository;
    private final UserRepository userRepository;
    private final SalaService salaService;
    private final CepaRepository cepaRepository;

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

        if (!planta.getUser().getId().equals(currentUser.getId())) {
            log.warn("ACCESO DENEGADO: El usuario '{}' (ID: {}) intentó acceder a la planta con ID: {}, que pertenece al usuario con ID: {}",
                    currentUser.getUsername(), currentUser.getId(), planta.getId(), planta.getUser().getId());
            throw new AccessDeniedException("No tiene permiso para acceder a esta planta.");
        }
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

        // Ensure the user owns the sala they are assigning the plant to
        SalaDto targetSalaDto = salaService.getSalaById(plantaDto.getSala().getId());
        log.info("Sala target con ID {} verificada para el usuario.", targetSalaDto.getId());

        Cepa cepa = cepaRepository.findById(plantaDto.getCepaDto().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Cepa no encontrada con id: " + plantaDto.getCepaDto().getId()));

        Planta planta = new Planta();
        planta.setNombre(plantaDto.getNombre());
        planta.setEtapa(plantaDto.getEtapa());
        planta.setProduccion(plantaDto.getProduccion());
        planta.setUbicacion(plantaDto.getUbicacion());
        planta.setFechaCreacion(plantaDto.getFechaCreacion());
        planta.setUser(currentUser); // Set owner
        planta.setSala(DtoMapper.salaDtoToSala(targetSalaDto, null));
        planta.setCepa(cepa);


        Planta savedPlanta = plantaRepository.save(planta);
        log.info("Planta {} creada con ID: {} para el usuario '{}'", savedPlanta.getNombre(), savedPlanta.getId(), currentUser.getUsername());
        return DtoMapper.plantaToPlantaDto(savedPlanta);
    }

    @Transactional(readOnly = true)
    public List<PlantaDto> getAllPlantas() {
        Authentication authentication = getAuthentication();
        User currentUser = getCurrentUser();

        if (isAdmin(authentication)) {
            log.info("Usuario admin '{}' obteniendo todas las plantas del sistema.", currentUser.getUsername());
            return plantaRepository.findAll().stream().map(DtoMapper::plantaToPlantaDto).collect(Collectors.toList());
        } else {
            log.info("Obteniendo todas las plantas para el usuario '{}'", currentUser.getUsername());
            return plantaRepository.findByUserId(currentUser.getId()).stream().map(DtoMapper::plantaToPlantaDto).collect(Collectors.toList());
        }
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

        // If the sala is being changed, verify ownership of the new sala
        if (!existingPlanta.getSala().getId().equals(plantaDto.getSala().getId())) {
            SalaDto newSala = salaService.getSalaById(plantaDto.getSala().getId());
            log.info("El usuario también es propietario de la nueva sala de destino ID: {}. Procediendo con la actualización.", newSala.getId());
        }
        
        Cepa cepa = cepaRepository.findById(plantaDto.getCepaDto().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Cepa no encontrada con id: " + plantaDto.getCepaDto().getId()));

        // Map updated fields from DTO
        existingPlanta.setNombre(plantaDto.getNombre());
        existingPlanta.setEtapa(plantaDto.getEtapa());
        existingPlanta.setProduccion(plantaDto.getProduccion());
        existingPlanta.setUbicacion(plantaDto.getUbicacion());
        existingPlanta.setSala(DtoMapper.salaDtoToSala(plantaDto.getSala(), null));
        existingPlanta.setCepa(cepa);
        
        Planta updatedPlanta = plantaRepository.save(existingPlanta);
        log.info("Planta con ID: {} actualizada con éxito.", updatedPlanta.getId());
        return DtoMapper.plantaToPlantaDto(updatedPlanta);
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
}
