package DeltaFlores.web.service;

import DeltaFlores.web.dto.PlantEventDto;
import DeltaFlores.web.dto.StageChangeEventDto;
import DeltaFlores.web.entities.Planta;
import DeltaFlores.web.entities.PlantEvent;
import DeltaFlores.web.entities.StageChangeEvent;
import DeltaFlores.web.entities.User;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.PlantEventRepository;
import DeltaFlores.web.repository.PlantaRepository;
import DeltaFlores.web.repository.UserRepository;
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
public class PlantEventService {

    private final PlantEventRepository plantEventRepository;
    private final PlantaRepository plantaRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<PlantEventDto> getAllEventsForPlanta(Long plantaId) {
        log.info("\n\n\uD83D\uDD0E Obteniendo todos los eventos para la planta ID: {}", plantaId);
        Planta planta = plantaRepository.findById(plantaId)
                .orElseThrow(() -> new ResourceNotFoundException("Planta no encontrada con id: " + plantaId));

        // Check ownership
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));
        if (!isAdmin) {
            String username = auth.getName();
            User currentUser = userRepository.findByUsername(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
            if (!planta.getUser().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("No tienes permiso para ver eventos de esta planta.");
            }
        }

        List<PlantEvent> events = plantEventRepository.findByPlantasIdOrderByFechaAsc(plantaId);
        log.info("\n\n\u2728 {} eventos encontrados para la planta ID: {}.", events.size(), plantaId);
        return events.stream()
                .map(DtoMapper::plantEventToPlantEventDto)
                .collect(Collectors.toList());
    }

    public List<PlantEventDto> getAllEventsForCurrentUser() {
        String username = org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication().getName();
        log.info("\n\n\uD83D\uDD0E Obteniendo todos los eventos para el usuario: {}", username);
        List<PlantEvent> events = plantEventRepository.findAllByPlantasUsuarioUsernameOrderByFechaDesc(username);
        log.info("\n\n\u2728 {} eventos encontrados para el usuario {}.", events.size(), username);
        return events.stream()
                .map(DtoMapper::plantEventToPlantEventDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PlantEventDto> getPublicEventsForPlanta(Long plantaId) {
        log.info("\n\n\uD83D\uDD0E Obteniendo eventos públicos para la planta ID: {}", plantaId);
        Planta planta = plantaRepository.findById(plantaId)
                .orElseThrow(() -> new ResourceNotFoundException("Planta no encontrada con id: " + plantaId));
        if (!planta.isPublic()) {
            log.warn("\n\n\u26A0\uFE0F Planta ID: {} no es pública. Acceso denegado.", plantaId);
            throw new ResourceNotFoundException("Planta no encontrada con id: " + plantaId);
        }
        List<PlantEvent> events = plantEventRepository.findByPlantasIdOrderByFechaAsc(plantaId);
        log.info("\n\n\u2728 {} eventos encontrados para la planta pública ID: {}.", events.size(), plantaId);
        return events.stream()
                .map(DtoMapper::plantEventToPlantEventDto)
                .collect(Collectors.toList());
    }
}