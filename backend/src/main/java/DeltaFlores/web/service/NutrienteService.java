package DeltaFlores.web.service;

import DeltaFlores.web.dto.NutrienteDto;
import DeltaFlores.web.entities.AppRole;
import DeltaFlores.web.entities.Nutriente;
import DeltaFlores.web.entities.User;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.NutrienteRepository;
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

@Service
@Log4j2
@RequiredArgsConstructor
public class NutrienteService {

    private final NutrienteRepository nutrienteRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        return userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    @Transactional
    public NutrienteDto createNutriente(NutrienteDto dto) {
        log.info("\n\n🍏 Creando nuevo nutriente: {}", dto.getTitulo());
        User currentUser = getCurrentUser();
        Nutriente nutriente = DtoMapper.nutrienteDtoToNutriente(dto, new Nutriente());
        nutriente.setUser(currentUser);
        Nutriente savedNutriente = nutrienteRepository.save(nutriente);
        log.info("\n\n✨ Nutriente {} creado con ID: {}", savedNutriente.getTitulo(), savedNutriente.getId());
        return DtoMapper.nutrienteToNutrienteDto(savedNutriente);
    }

    @Transactional(readOnly = true)
    public NutrienteDto getNutrienteById(Long id) {
        log.info("\n\n🔎 Buscando nutriente con ID: {}", id);
        User currentUser = getCurrentUser();
        Nutriente nutriente = nutrienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nutriente no encontrado con id: " + id));

        if (!nutriente.getUser().equals(currentUser) &&
            currentUser.getRol() != AppRole.ROLE_ADMIN &&
            currentUser.getRol() != AppRole.ROLE_SUPER_ADMIN) {
            throw new AccessDeniedException("No tienes permiso para ver este nutriente");
        }

        return DtoMapper.nutrienteToNutrienteDto(nutriente);
    }

    @Transactional(readOnly = true)
    public List<NutrienteDto> getAllNutrientes() {
        log.info("\n\n🔎 Obteniendo todos los nutrientes.");
        User currentUser = getCurrentUser();

        if (currentUser.getRol() == AppRole.ROLE_ADMIN || currentUser.getRol() == AppRole.ROLE_SUPER_ADMIN) {
            return nutrienteRepository.findAll().stream()
                    .map(DtoMapper::nutrienteToNutrienteDto)
                    .collect(Collectors.toList());
        } else {
            return nutrienteRepository.findByUserId(currentUser.getId()).stream()
                    .map(DtoMapper::nutrienteToNutrienteDto)
                    .collect(Collectors.toList());
        }
    }

    @Transactional(readOnly = true)
    public List<NutrienteDto> getNutrientesByTitulo(String titulo) {
        log.info("\n\n🔎 Buscando nutrientes por título: {}", titulo);
        return nutrienteRepository.findByTitulo(titulo).stream()
                .map(DtoMapper::nutrienteToNutrienteDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public NutrienteDto updateNutriente(Long id, NutrienteDto dto) {
        log.info("\n\n⬆️ Actualizando nutriente con ID: {}", id);
        User currentUser = getCurrentUser();
        Nutriente existingNutriente = nutrienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nutriente no encontrado con id: " + id));

        if (!existingNutriente.getUser().equals(currentUser)) {
            throw new AccessDeniedException("No tienes permiso para actualizar este nutriente");
        }

        Nutriente updatedNutriente = DtoMapper.nutrienteDtoToNutriente(dto, existingNutriente);
        updatedNutriente.setUser(currentUser); // Ensure the user is not changed
        updatedNutriente = nutrienteRepository.save(updatedNutriente);
        log.info("\n\n✨ Nutriente con ID: {} actualizado.", updatedNutriente.getId());
        return DtoMapper.nutrienteToNutrienteDto(updatedNutriente);
    }

    @Transactional
    public void deleteNutriente(Long id) {
        log.info("\n\n🗑️ Eliminando nutriente con ID: {}", id);
        User currentUser = getCurrentUser();
        Nutriente nutriente = nutrienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nutriente no encontrado con id: " + id));

        if (!nutriente.getUser().equals(currentUser) &&
            currentUser.getRol() != AppRole.ROLE_ADMIN &&
            currentUser.getRol() != AppRole.ROLE_SUPER_ADMIN) {
            throw new AccessDeniedException("No tienes permiso para eliminar este nutriente");
        }

        nutrienteRepository.deleteById(id);
        log.info("\n\n✨ Nutriente con ID: {} eliminado.", id);
    }
}