package DeltaFlores.web.utils;

import DeltaFlores.web.dto.PlantaDto;
import DeltaFlores.web.dto.UserDto;
import DeltaFlores.web.dto.UserToRegisterDto;
import DeltaFlores.web.entities.AppRole;
import DeltaFlores.web.entities.Planta;
import DeltaFlores.web.entities.User;
import org.apache.coyote.BadRequestException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

public final class DtoMapper {

    private DtoMapper (){}

    public static UserDto userToUserDto(User user) {
        UserDto userDto = new UserDto();
        userDto.setId(user.getId());
        userDto.setNombre(user.getNombre());
        userDto.setApellido(user.getApellido());
        userDto.setUsername(user.getUsername());
        userDto.setPassword(user.getPassword());
        userDto.setRol(user.getRol());
        userDto.setFechaRegistro(user.getFechaRegistro());

        return userDto;

    }

    public static UserDto UserToRegisterDtoToUserDto(UserDto userDto , UserToRegisterDto userToRegisterDto) throws BadRequestException {
        userDto.setId(userToRegisterDto.getId());
        userDto.setUsername(userToRegisterDto.getEmail());
        userDto.setNombre(userToRegisterDto.getNombre());
        userDto.setApellido(userToRegisterDto.getApellido());
        try {
            userDto.setRol(User.Rol.valueOf(userToRegisterDto.getRol())); // ← Aquí la conversión segura

        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Rol inválido: " + userToRegisterDto.getRol());
        }
        userDto.setFechaRegistro(userToRegisterDto.getRegistryDate());
        return userDto;
    }

    public static User UserDtoToUser (UserDto userDto, User user, BCryptPasswordEncoder bCryptPasswordEncoder){

        Long id = userDto.getId();
        if (userDto.getId() != null && userDto.getId() > 0) {
            user.setId(userDto.getId());
        }

        user.setNombre(userDto.getNombre());
        user.setApellido(userDto.getApellido());
        user.setUsername(userDto.getUsername());
        user.setFechaRegistro(userDto.getFechaRegistro());
        user.setRol(userDto.getRol());
        String password = userDto.getPassword();
        password = password != null && !("").equals(password) ? bCryptPasswordEncoder.encode(password) : null;
        if (Optional.ofNullable(password).isPresent() && !user.getPassword().equals(password)){
            user.setPassword(bCryptPasswordEncoder.encode(userDto.getPassword()));
        }
        return user;
    }

    public static PlantaDto plantaToPlantaDto(Planta planta){

        PlantaDto plantaDto = new PlantaDto();

        plantaDto.setId(planta.getId());
        plantaDto.setEtapa(planta.getEtapa());
        plantaDto.setGenetica(planta.getGenetica());
        plantaDto.setFechaCreacion(planta.getFechaCreacion());
        plantaDto.setSala(planta.getSala());
        plantaDto.setNombre(planta.getNombre());
        plantaDto.setEvents(planta.getEvents());
        return plantaDto;
    }

    public static Planta plantaDtoToPlanta (Planta planta,PlantaDto plantaDto){
        Long id = plantaDto.getId();
        if (id!=null && id>0){
            planta.setId(id);
        }
        planta.setNombre(plantaDto.getNombre());
        planta.setEtapa(plantaDto.getEtapa());
        planta.setGenetica(plantaDto.getGenetica());
        planta.setFechaCreacion(plantaDto.getFechaCreacion());
        planta.setSala(plantaDto.getSala());
        planta.setEvents(plantaDto.getEvents());

        return planta;
    }

}
