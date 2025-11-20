package DeltaFlores.web.service.events;

import DeltaFlores.web.dto.NoteEventDto;
import DeltaFlores.web.entities.NoteEvent;
import DeltaFlores.web.entities.Planta;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.NoteEventRepository;
import DeltaFlores.web.repository.PlantaRepository;
import DeltaFlores.web.service.MinioFileStorageService;
import DeltaFlores.web.utils.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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

    @Transactional
    public NoteEventDto createNoteEvent(NoteEventDto dto, List<MultipartFile> files) {
        log.info("\n\n📝 Creando nuevo evento de nota...");
        NoteEvent event = new NoteEvent();
        event.setFecha(dto.getFecha());
        event.setText(dto.getText());

        // Handle file uploads
        List<String> mediaUrls = new ArrayList<>();
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                String fileUrl = fileStorageService.uploadFile(file);
                mediaUrls.add(fileUrl);
            }
        }
        event.setMediaUrls(mediaUrls);

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
        return (NoteEventDto) DtoMapper.plantEventToPlantEventDto(savedEvent);
    }

    @Transactional(readOnly = true)
    public NoteEventDto getNoteEventById(Long id) {
        log.info("\n\n🔎 Buscando evento de nota con ID: {}", id);
        NoteEvent event = noteEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evento de nota no encontrado con id: " + id));
        return (NoteEventDto) DtoMapper.plantEventToPlantEventDto(event);
    }

    @Transactional(readOnly = true)
    public List<NoteEventDto> getAllNoteEvents() {
        log.info("\n\n🔎 Obteniendo todos los eventos de nota.");
        return noteEventRepository.findAll().stream()
                .map(event -> (NoteEventDto) DtoMapper.plantEventToPlantEventDto(event))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NoteEventDto> getNoteEventsByPlantaId(Long plantaId) {
        log.info("\n\n🔎 Obteniendo eventos de nota para la planta ID: {}", plantaId);
        return noteEventRepository.findByPlantaId(plantaId).stream()
                .map(event -> (NoteEventDto) DtoMapper.plantEventToPlantEventDto(event))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NoteEventDto> getNoteEventsByFecha(LocalDate fecha) {
        log.info("\n\n🔎 Obteniendo eventos de nota para la fecha: {}", fecha);
        return noteEventRepository.findByFecha(fecha).stream()
                .map(event -> (NoteEventDto) DtoMapper.plantEventToPlantEventDto(event))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NoteEventDto> getNoteEventsByFechaAfter(LocalDate fecha) {
        log.info("\n\n🔎 Obteniendo eventos de nota posteriores a la fecha: {}", fecha);
        return noteEventRepository.findByFechaAfter(fecha).stream()
                .map(event -> (NoteEventDto) DtoMapper.plantEventToPlantEventDto(event))
                .collect(Collectors.toList());
    }

    @Transactional
    public NoteEventDto updateNoteEvent(Long id, NoteEventDto dto, List<MultipartFile> newFiles) {
        log.info("\n\n⬆️ Actualizando evento de nota con ID: {}", id);
        NoteEvent existingEvent = noteEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evento de nota no encontrado con id: " + id));

        existingEvent.setFecha(dto.getFecha());
        existingEvent.setText(dto.getText());

        // Handle new file uploads (append to existing mediaUrls or replace)
        if (newFiles != null && !newFiles.isEmpty()) {
            List<String> currentMediaUrls = existingEvent.getMediaUrls() != null ? new ArrayList<>(existingEvent.getMediaUrls()) : new ArrayList<>();
            for (MultipartFile file : newFiles) {
                String fileUrl = fileStorageService.uploadFile(file);
                currentMediaUrls.add(fileUrl);
            }
            existingEvent.setMediaUrls(currentMediaUrls);
        }
        // If dto contains mediaUrls, it means they are part of the update request
        // e.g. for removing some old ones or replacing them entirely
        if (dto.getMediaUrls() != null) {
            existingEvent.setMediaUrls(dto.getMediaUrls());
        }

        if (dto.getPlantaIds() != null) {
            List<Planta> plantas = plantaRepository.findAllById(dto.getPlantaIds());
             if (plantas.size() != dto.getPlantaIds().size()) {
                log.warn("\u26A0\uFE0F Algunos IDs de plantas no fueron encontrados al actualizar el evento.");
            }
            existingEvent.setPlantas(plantas);
        }

        NoteEvent updatedEvent = noteEventRepository.save(existingEvent);
        log.info("\n\n✨ Evento de nota con ID: {} actualizado.", updatedEvent.getId());
        return (NoteEventDto) DtoMapper.plantEventToPlantEventDto(updatedEvent);
    }

    @Transactional
    public void deleteNoteEvent(Long id) {
        log.info("\n\n🗑️ Eliminando evento de nota con ID: {}", id);
        if (!noteEventRepository.existsById(id)) {
            throw new ResourceNotFoundException("Evento de nota no encontrado con id: " + id);
        }
        // Optional: Delete associated files from storage
        NoteEvent eventToDelete = noteEventRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Evento de nota no encontrado con id: " + id));
        if (eventToDelete.getMediaUrls() != null) {
            for (String url : eventToDelete.getMediaUrls()) {
                fileStorageService.deleteFile(url);
            }
        }
        noteEventRepository.deleteById(id);
        log.info("\n\n✨ Evento de nota con ID: {} eliminado.", id);
    }
}
