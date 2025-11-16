package DeltaFlores.web.service;

import DeltaFlores.web.dto.NoteEventDto;
import DeltaFlores.web.entities.NoteEvent;
import DeltaFlores.web.entities.Planta;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.PlantEventRepository;
import DeltaFlores.web.repository.PlantaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PlantEventService {

    private final PlantEventRepository plantEventRepository;
    private final PlantaRepository plantaRepository;
    private final MinioFileStorageService fileStorageService; // Inyecta la implementación de MinIO

    public void createNoteEvent(Long plantaId, NoteEventDto noteEventDto) {
        Planta planta = plantaRepository.findById(plantaId).orElseThrow(() -> new ResourceNotFoundException("Planta not found with id: " + plantaId));

        List<String> mediaUrls = new ArrayList<>();
        if (noteEventDto.getFiles() != null && !noteEventDto.getFiles().isEmpty()) {
            for (MultipartFile file : noteEventDto.getFiles()) {
                String fileUrl = fileStorageService.uploadFile(file);
                mediaUrls.add(fileUrl);
            }
        }

        NoteEvent noteEvent = new NoteEvent();
        noteEvent.setPlanta(planta);
        noteEvent.setText(noteEventDto.getText());
        noteEvent.setMediaUrls(mediaUrls);

        plantEventRepository.save(noteEvent);
    }
}
