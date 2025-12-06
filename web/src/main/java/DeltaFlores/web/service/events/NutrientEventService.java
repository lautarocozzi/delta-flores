package DeltaFlores.web.service.events;

import DeltaFlores.web.dto.NutrientEventDto;
import DeltaFlores.web.entities.NutrientEvent;
import DeltaFlores.web.entities.Planta;
import DeltaFlores.web.entities.Nutriente;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.NutrientEventRepository;
import DeltaFlores.web.repository.PlantaRepository;
import DeltaFlores.web.repository.NutrienteRepository;
import DeltaFlores.web.repository.UserRepository;
import DeltaFlores.web.service.NutrienteService; // Inyectar NutrienteService
import DeltaFlores.web.utils.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import DeltaFlores.web.entities.User;
import DeltaFlores.web.entities.AppRole;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Log4j2
@RequiredArgsConstructor
public class NutrientEventService {

    private final NutrientEventRepository nutrientEventRepository;
    private final PlantaRepository plantaRepository;
    private final UserRepository userRepository;
    //private final NutrienteService nutrienteService; // Inyectar NutrienteService

    @Autowired
    private final NutrienteRepository nutrienteRepository;

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        return userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    @Transactional
    public NutrientEventDto createNutrientEvent(NutrientEventDto dto) {
        log.info("\n\n🌱 Creando nuevo evento de nutriente...");
        NutrientEvent event = new NutrientEvent();
        event.setFecha(dto.getFecha());

        Optional<Nutriente> nutriente = null;
        // Manejar el nutriente asociado
        if (dto.getNutriente() != null && dto.getNutriente().getId() != null) {
            // Verificar si el nutriente existe
            nutriente = nutrienteRepository.findById(dto.getNutriente().getId());
            event.setNutriente(nutriente.get());
        } else {
            throw new ResourceNotFoundException("Se requiere un nutriente válido para el evento.");
        }

        if (dto.getPlantaIds() != null && !dto.getPlantaIds().isEmpty()) {
            List<Planta> plantas = plantaRepository.findAllById(dto.getPlantaIds());
            if (plantas.isEmpty()) {
                throw new ResourceNotFoundException("No se encontraron plantas con los IDs proporcionados.");
            }
            if (plantas.size() != dto.getPlantaIds().size()) {
                log.warn("\u26A0️ Algunos IDs de plantas no fueron encontrados al crear el evento.");
            }
            event.setPlantas(plantas);
        } else {
            log.warn("\u26A0️ Creando un evento de nutriente sin plantas asociadas.");
        }

        NutrientEvent savedEvent = nutrientEventRepository.save(event);
        log.info("\n\n✨ Evento de nutriente creado con ID: {}", savedEvent.getId());
        return (NutrientEventDto) DtoMapper.plantEventToPlantEventDto(savedEvent);
    }

    @Transactional(readOnly = true)
    public NutrientEventDto getNutrientEventById(Long id) {
        log.info("\n\n🔎 Buscando evento de nutriente con ID: {}", id);
        NutrientEvent event = nutrientEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evento de nutriente no encontrado con id: " + id));
        return (NutrientEventDto) DtoMapper.plantEventToPlantEventDto(event);
    }

    @Transactional(readOnly = true)
    public List<NutrientEventDto> getAllNutrientEvents() {
        log.info("\n\n🔎 Obteniendo todos los eventos de nutriente.");
        return nutrientEventRepository.findAll().stream()
                .map(event -> (NutrientEventDto) DtoMapper.plantEventToPlantEventDto(event))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NutrientEventDto> getNutrientEventsByPlantaId(Long plantaId) {
        log.info("\n\n🔎 Obteniendo eventos de nutriente para la planta ID: {}", plantaId);
        return nutrientEventRepository.findByPlantaId(plantaId).stream()
                .map(event -> (NutrientEventDto) DtoMapper.plantEventToPlantEventDto(event))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NutrientEventDto> getNutrientEventsByFecha(LocalDate fecha) {
        log.info("\n\n🔎 Obteniendo eventos de nutriente para la fecha: {}", fecha);
        return nutrientEventRepository.findByFecha(fecha).stream()
                .map(event -> (NutrientEventDto) DtoMapper.plantEventToPlantEventDto(event))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NutrientEventDto> getNutrientEventsByFechaAfter(LocalDate fecha) {
        log.info("\n\n🔎 Obteniendo eventos de nutriente posteriores a la fecha: {}", fecha);
        return nutrientEventRepository.findByFechaAfter(fecha).stream()
                .map(event -> (NutrientEventDto) DtoMapper.plantEventToPlantEventDto(event))
                .collect(Collectors.toList());
    }

    @Transactional
    public NutrientEventDto updateNutrientEvent(Long id, NutrientEventDto dto) {
        log.info("\n\n⬆️ Actualizando evento de nutriente con ID: {}", id);
        User currentUser = getCurrentUser();
        NutrientEvent existingEvent = nutrientEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evento de nutriente no encontrado con id: " + id));

        if (currentUser.getRol() == AppRole.ROLE_GROWER) {
            for (Planta planta : existingEvent.getPlantas()) {
                if (!planta.getUser().equals(currentUser)) {
                    throw new AccessDeniedException("No tienes permiso para actualizar este evento");
                }
            }
        }

        existingEvent.setFecha(dto.getFecha());

        Optional<Nutriente> nutriente = null;
        // Manejar el nutriente asociado
        if (dto.getNutriente() != null && dto.getNutriente().getId() != null) {
            // Verificar si el nutriente existe
            nutriente = nutrienteRepository.findById(dto.getNutriente().getId());
            existingEvent.setNutriente(nutriente.get());
        } else {
            throw new ResourceNotFoundException("Se requiere un nutriente válido para el evento.");
        }



        if (dto.getPlantaIds() != null) {
            List<Planta> plantas = plantaRepository.findAllById(dto.getPlantaIds());
             if (plantas.size() != dto.getPlantaIds().size()) {
                log.warn("\u26A0️ Algunos IDs de plantas no fueron encontrados al actualizar el evento.");
            }
            existingEvent.setPlantas(plantas);
        }

        NutrientEvent updatedEvent = nutrientEventRepository.save(existingEvent);
        log.info("\n\n✨ Evento de nutriente con ID: {} actualizado.", updatedEvent.getId());
        return (NutrientEventDto) DtoMapper.plantEventToPlantEventDto(updatedEvent);
    }

    @Transactional
    public void deleteNutrientEvent(Long id) {
        log.info("\n\n🗑️ Eliminando evento de nutriente con ID: {}", id);
        User currentUser = getCurrentUser();
        NutrientEvent event = nutrientEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evento de nutriente no encontrado con id: " + id));

        if (currentUser.getRol() == AppRole.ROLE_GROWER) {
            for (Planta planta : event.getPlantas()) {
                if (!planta.getUser().equals(currentUser)) {
                    throw new AccessDeniedException("No tienes permiso para eliminar este evento");
                }
            }
        }

        nutrientEventRepository.deleteById(id);
        log.info("\n\n✨ Evento de nutriente con ID: {} eliminado.", id);
    }
}
