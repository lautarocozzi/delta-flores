package DeltaFlores.web.service;

import DeltaFlores.web.dto.PlantaDto;
import DeltaFlores.web.entities.Favorite;
import DeltaFlores.web.entities.User;
import DeltaFlores.web.exception.ResourceNotFoundException;
import DeltaFlores.web.repository.FavoriteRepository;
import DeltaFlores.web.repository.PlantaRepository;
import DeltaFlores.web.repository.UserRepository;
import lombok.extern.log4j.Log4j2;
import org.apache.coyote.BadRequestException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

import static DeltaFlores.web.utils.DtoMapper.plantaToPlantaDto;

@Log4j2
@Service
public class FavoriteService {
    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final PlantaRepository plantaRepository;

    public FavoriteService(FavoriteRepository favoriteRepository, UserRepository userRepository, PlantaRepository plantaRepository){
        this.favoriteRepository = favoriteRepository;
        this.userRepository = userRepository;
        this.plantaRepository=plantaRepository;
    }

    public PlantaDto saveFavorite (PlantaDto plantaDto)throws ResourceNotFoundException {
        Authentication auth = getAuth();
        Favorite favorite = new Favorite();

        User user = (User) userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("No existe usuario en BBDD"));
        favorite.setUser(user);
        boolean exiteFavorito = favorite.getUser().getFavoritos()
                .stream()
                .anyMatch(favorite1 -> favorite1.getFavorito().equals(plantaDto.getId()));
        if (exiteFavorito){
            Favorite favoritoExistente = user.getFavoritos()
                    .stream()
                    .filter(fav -> fav.getFavorito().equals(plantaDto.getId()))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("No se encontró el favorito para eliminar"));
            favoriteRepository.deleteById(favoritoExistente.getId());
            return plantaDto;

        }
        if (plantaRepository.existsById(plantaDto.getId())){
            favorite.setFavorito(plantaDto.getId());
        }else throw new ResourceNotFoundException("No existe esa planta en BBDD");


        favoriteRepository.save(favorite);
        return plantaDto;
    }

    public List<PlantaDto> listarFavoritos(Long usuarioId) throws ResourceNotFoundException {
        User user = userRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe usuario en BBDD asociado a ese id"));
        List<PlantaDto> plantaDtoList = user.getFavoritos()
                .stream()
                .map(favorite -> {
                    try {
                        return plantaToPlantaDto(
                                plantaRepository.findById(favorite.getFavorito())
                                        .orElseThrow(()->new BadRequestException("Error al recuperar los favoritos"))
                        );
                    } catch (BadRequestException e) {
                        throw new RuntimeException(e);
                    }
                })
                .collect(Collectors.toList());
        return plantaDtoList;
    }

    public void eliminarFavorito(Long plantaId) throws ResourceNotFoundException {
        Authentication auth = getAuth();
        User user = (User) userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("No existe usuario en BBDD asociado a ese id"));
        Favorite favorito = user.getFavoritos()
                .stream()
                .filter(favorite -> favorite.getFavorito().equals(plantaId))
                .findFirst().orElseThrow(()-> new ResourceNotFoundException("No existe esa planta en los favoritos del usuario"));
        favoriteRepository.deleteById(favorito.getId());
    }

    private Authentication getAuth() throws ResourceNotFoundException {
        SecurityContext context = SecurityContextHolder.getContext();

        if (context == null) {
            log.error("No security context");
            throw new ResourceNotFoundException("Error al consultar el security context");
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            log.error("No auth in security context");
            throw new ResourceNotFoundException("Usuario no autenticado");
        }
        return auth;
    }
}
