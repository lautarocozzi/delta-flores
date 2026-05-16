package DeltaFlores.web.service.events;

import DeltaFlores.web.dto.NoteEventDto;
import DeltaFlores.web.entities.NoteEvent;
import DeltaFlores.web.entities.Planta;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.NoteEventRepository;
import DeltaFlores.web.repository.PlantaRepository;
import DeltaFlores.web.repository.UserRepository;
import DeltaFlores.web.service.MinioFileStorageService;
import DeltaFlores.web.utils.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import DeltaFlores.web.entities.User;
import DeltaFlores.web.entities.AppRole;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Log4j2
@RequiredArgsConstructor
public class NoteEventService {

    private final NoteEventRepository noteEventRepository;
    private final PlantaRepository plantaRepository;
    private final MinioFileStorageService fileStorageService;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        return userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    @Transactional
    public NoteEventDto createNoteEvent(NoteEventDto dto, List<MultipartFile> files) {
        log.info("\n\n📝 Creando nuevo evento de nota...");
        NoteEvent event = new NoteEvent();
        event.setFecha(dto.getFecha());
        event.setText(dto.getText());

        // Handle file uploads, storing object names
        List<String> mediaObjectNames = new ArrayList<>();
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                String objectName = fileStorageService.uploadFile(file);
                mediaObjectNames.add(objectName);
            }
        }
        event.setMediaUrls(mediaObjectNames); // The entity field now stores object names

        if (dto.getPlantaIds() != null && !dto.getPlantaIds().isEmpty()) {
            List<Planta> plantas = plantaRepository.findAllById(dto.getPlantaIds());
            if (plantas.isEmpty()) {
                throw new ResourceNotFoundException("No se encontraron plantas con los IDs proporcionados.");
            }
            if (plantas.size() != dto.getPlantaIds().size()) {
                log.warn("\u26A0\uFE0F Algunos IDs de plantas no fueron encontrados al crear el evento.");
            }
            event.setPlantas(plantas);
        } else {
            log.warn("\u26A0\uFE0F Creando un evento de nota sin plantas asociadas.");
        }

        NoteEvent savedEvent = noteEventRepository.save(event);
        log.info("\n\n✨ Evento de nota creado con ID: {}", savedEvent.getId());
        return toDtoWithPresignedUrls(savedEvent);
    }

    @Transactional(readOnly = true)
    public NoteEventDto getNoteEventById(Long id) {
        log.info("\n\n🔎 Buscando evento de nota con ID: {}", id);
        User currentUser = getCurrentUser();
        NoteEvent event = noteEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evento de nota no encontrado con id: " + id));

        boolean isPublic = event.getPlantas().stream().anyMatch(Planta::isPublic);

        if (!isPublic && currentUser.getRol() == AppRole.ROLE_GROWER) {
            boolean isOwner = event.getPlantas().stream().allMatch(planta -> planta.getUser().equals(currentUser));
            if (!isOwner) {
                throw new AccessDeniedException("No tienes permiso para ver este evento.");
            }
        }

        return toDtoWithPresignedUrls(event);
    }

    private NoteEventDto toDtoWithPresignedUrls(NoteEvent event) {
        NoteEventDto dto = (NoteEventDto) DtoMapper.plantEventToPlantEventDto(event);
        if (event.getMediaUrls() != null && !event.getMediaUrls().isEmpty()) {
            List<String> presignedUrls = event.getMediaUrls().stream()
                    .map(fileStorageService::getPresignedUrl)
                    .collect(Collectors.toList());
            dto.setMediaUrls(presignedUrls);
        }
        return dto;
    }

    @Transactional(readOnly = true)
    public List<NoteEventDto> getAllNoteEvents() {
        log.info("\n\n🔎 Obteniendo todos los eventos de nota.");
        return noteEventRepository.findAll().stream()
                .map(this::toDtoWithPresignedUrls)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NoteEventDto> getNoteEventsByPlantaId(Long plantaId) {
        log.info("\n\n🔎 Obteniendo eventos de nota para la planta ID: {}", plantaId);
        return noteEventRepository.findByPlantaId(plantaId).stream()
                .map(this::toDtoWithPresignedUrls)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NoteEventDto> getNoteEventsByFecha(LocalDate fecha) {
        log.info("\n\n🔎 Obteniendo eventos de nota para la fecha: {}", fecha);
        return noteEventRepository.findByFecha(fecha).stream()
                .map(this::toDtoWithPresignedUrls)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NoteEventDto> getNoteEventsByFechaAfter(LocalDate fecha) {
        log.info("\n\n🔎 Obteniendo eventos de nota posteriores a la fecha: {}", fecha);
        return noteEventRepository.findByFechaAfter(fecha).stream()
                .map(this::toDtoWithPresignedUrls)
                .collect(Collectors.toList());
    }

    @Transactional
    public NoteEventDto updateNoteEvent(Long id, NoteEventDto dto, List<MultipartFile> newFiles) {
        log.info("\n\n⬆️ Actualizando evento de nota con ID: {}", id);
        User currentUser = getCurrentUser();
        NoteEvent existingEvent = noteEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evento de nota no encontrado con id: " + id));

        if (currentUser.getRol() == AppRole.ROLE_GROWER) {
            for (Planta planta : existingEvent.getPlantas()) {
                if (!planta.getUser().equals(currentUser)) {
                    throw new AccessDeniedException("No tienes permiso para actualizar este evento");
                }
            }
        }

        existingEvent.setFecha(dto.getFecha());
        existingEvent.setText(dto.getText());

        // --- File Management Logic ---
        List<String> existingObjectNames = existingEvent.getMediaUrls() != null ? new ArrayList<>(existingEvent.getMediaUrls()) : new ArrayList<>();
        List<String> objectNamesToKeep = dto.getMediaUrls() != null ? dto.getMediaUrls() : new ArrayList<>();
        List<String> newObjectNames = new ArrayList<>();

        // 1. Delete files that are no longer referenced
        List<String> objectNamesToDelete = new ArrayList<>(existingObjectNames);
        objectNamesToDelete.removeAll(objectNamesToKeep);
        for (String objectName : objectNamesToDelete) {
            fileStorageService.deleteFile(objectName);
            log.info("🗑️ Archivo obsoleto eliminado de MinIO: {}", objectName);
        }

        // 2. Upload new files
        if (newFiles != null && !newFiles.isEmpty()) {
            for (MultipartFile file : newFiles) {
                String newObjectName = fileStorageService.uploadFile(file);
                newObjectNames.add(newObjectName);
            }
        }
        
        // 3. Combine kept and new object names for the final list
        List<String> finalObjectNames = new ArrayList<>(objectNamesToKeep);
        finalObjectNames.addAll(newObjectNames);
        existingEvent.setMediaUrls(finalObjectNames);
        // --- End File Management ---


        if (dto.getPlantaIds() != null) {
            List<Planta> plantas = plantaRepository.findAllById(dto.getPlantaIds());
             if (plantas.size() != dto.getPlantaIds().size()) {
                log.warn("\u26A0\uFE0F Algunos IDs de plantas no fueron encontrados al actualizar el evento.");
            }
            existingEvent.setPlantas(plantas);
        }

        NoteEvent updatedEvent = noteEventRepository.save(existingEvent);
        log.info("\n\n✨ Evento de nota con ID: {} actualizado.", updatedEvent.getId());
        return toDtoWithPresignedUrls(updatedEvent);
    }

    @Transactional
    public void deleteNoteEvent(Long id) {
        log.info("\n\n🗑️ Eliminando evento de nota con ID: {}", id);
        User currentUser = getCurrentUser();
        NoteEvent eventToDelete = noteEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evento de nota no encontrado con id: " + id));

        if (currentUser.getRol() == AppRole.ROLE_GROWER) {
            for (Planta planta : eventToDelete.getPlantas()) {
                if (!planta.getUser().equals(currentUser)) {
                    throw new AccessDeniedException("No tienes permiso para eliminar este evento");
                }
            }
        }

        // Delete associated files from MinIO using their object names
        if (eventToDelete.getMediaUrls() != null) {
            for (String objectName : eventToDelete.getMediaUrls()) {
                fileStorageService.deleteFile(objectName);
            }
        }
        noteEventRepository.deleteById(id);
        log.info("\n\n✨ Evento de nota con ID: {} eliminado.", id);
    }
}
