package DeltaFlores.web.utils;

import DeltaFlores.web.dto.*;
import DeltaFlores.web.entities.*;
import org.apache.coyote.BadRequestException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Collections;
import java.util.stream.Collectors;

public final class DtoMapper {

    private DtoMapper() {
    }

    // =====================================================================================
    // User Mapping
    // =====================================================================================

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

    public static UserDto UserToRegisterDtoToUserDto(UserDto userDto, UserToRegisterDto userToRegisterDto) throws BadRequestException {
        userDto.setId(userToRegisterDto.getId());
        userDto.setUsername(userToRegisterDto.getEmail());
        userDto.setNombre(userToRegisterDto.getNombre());
        userDto.setApellido(userToRegisterDto.getApellido());
        try {
            userDto.setRol(AppRole.ROLE_GROWER);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Rol inválido");
        }
        return userDto;
    }

    public static User UserDtoToUser(UserDto userDto, User user, BCryptPasswordEncoder bCryptPasswordEncoder) {
        if (userDto.getId() != null && userDto.getId() > 0) {
            user.setId(userDto.getId());
        }
        user.setNombre(userDto.getNombre());
        user.setApellido(userDto.getApellido());
        user.setUsername(userDto.getUsername());
        user.setFechaRegistro(userDto.getFechaRegistro());
        user.setRol(userDto.getRol());
        String password = userDto.getPassword();
        if (password != null && !password.isEmpty()) {
            user.setPassword(bCryptPasswordEncoder.encode(password));
        }
        return user;
    }

    public static SalaDto salaToSalaDto(Sala sala) {
        if (sala == null) {
            return null;
        }
        SalaDto salaDto = new SalaDto();
        salaDto.setId(sala.getId());
        salaDto.setNombre(sala.getNombre());
        salaDto.setDescripcion(sala.getDescripcion());
        salaDto.setHorasLuz(sala.getHorasLuz());
        salaDto.setHumedad(sala.getHumedad());
        salaDto.setTemperaturaAmbiente(sala.getTemperaturaAmbiente());
        if (sala.getUser() != null) {
            salaDto.setUserId(sala.getUser().getId());
        }
        if (sala.getPlantas() != null) {
            salaDto.setPlantaIds(sala.getPlantas().stream()
                    .map(Planta::getId)
                    .collect(Collectors.toSet()));
        }
        return salaDto;
    }

    public static Sala salaDtoToSala(SalaDto salaDto, Sala sala) {
        if (salaDto == null) {
            return null;
        }
        if (sala == null) {
            sala = new Sala();
        }
        if (salaDto.getId() != null && salaDto.getId() > 0) {
            sala.setId(salaDto.getId());
        }
        sala.setNombre(salaDto.getNombre());
        sala.setDescripcion(salaDto.getDescripcion());
        sala.setHorasLuz(salaDto.getHorasLuz());
        sala.setHumedad(salaDto.getHumedad());
        sala.setTemperaturaAmbiente(salaDto.getTemperaturaAmbiente());
        return sala;
    }


    public static PlantaDto plantaToPlantaDto(Planta planta) {
        PlantaDto plantaDto = new PlantaDto();
        plantaDto.setId(planta.getId());
        if (planta.getUser() != null) {
            plantaDto.setUserId(planta.getUser().getId());
        }
        plantaDto.setNombre(planta.getNombre());
        plantaDto.setPublic(planta.isPublic());
        plantaDto.setEtapa(planta.getEtapa());
        plantaDto.setUbicacion(planta.getUbicacion());
        plantaDto.setProduccion(planta.getProduccion());
        plantaDto.setFechaCreacion(planta.getFechaCreacion());
        if (planta.getSala() != null) {
            plantaDto.setSala(DtoMapper.salaToSalaDto(planta.getSala()));
        }
        if (planta.getCepa() != null) {
            plantaDto.setCepaDto(cepaToCepaDto(planta.getCepa()));
        }

        return plantaDto;
    }

    public static Planta plantaDtoToPlanta(Planta planta, PlantaDto plantaDto) {
        if (plantaDto.getId() != null && plantaDto.getId() > 0) {
            planta.setId(plantaDto.getId());
        }
        planta.setNombre(plantaDto.getNombre());
        planta.setPublic(plantaDto.isPublic());
        planta.setEtapa(plantaDto.getEtapa());
        planta.setFechaCreacion(plantaDto.getFechaCreacion());
        if (plantaDto.getSala() != null) {
            Sala sala = planta.getSala() != null ? planta.getSala() : new Sala();
            planta.setSala(salaDtoToSala(plantaDto.getSala(), sala));
        } else {
            planta.setSala(null);
        }
        if (plantaDto.getCepaDto() != null) {
            Cepa cepa = planta.getCepa() != null ? planta.getCepa() : new Cepa();
            planta.setCepa(cepaDtoToCepa(plantaDto.getCepaDto(), cepa));
        }

        return planta;
    }

    // =====================================================================================
    // Cepa Mapping
    // =====================================================================================

    public static CepaDto cepaToCepaDto(Cepa cepa) {
        CepaDto cepaDto = new CepaDto();
        cepaDto.setId(cepa.getId());
        cepaDto.setGeneticaParental(cepa.getGeneticaParental());
        cepaDto.setDominancia(cepa.getDominancia());
        cepaDto.setAromaSabor(cepa.getAromaSabor());
        cepaDto.setThc(cepa.getThc());
        cepaDto.setCbd(cepa.getCbd());
        cepaDto.setDetalle(cepa.getDetalle());
        if (cepa.getUser() != null) {
            cepaDto.setUserId(cepa.getUser().getId());
        }
        // Avoid circular mapping by not mapping plantas here.
        return cepaDto;
    }

    public static Cepa cepaDtoToCepa(CepaDto cepaDto, Cepa cepa) {
        if (cepaDto.getId() != null && cepaDto.getId() > 0) {
            cepa.setId(cepaDto.getId());
        }
        cepa.setGeneticaParental(cepaDto.getGeneticaParental());
        cepa.setDominancia(cepaDto.getDominancia());
        cepa.setAromaSabor(cepaDto.getAromaSabor());
        cepa.setThc(cepaDto.getThc());
        cepa.setCbd(cepaDto.getCbd());
        cepa.setDetalle(cepaDto.getDetalle());
        return cepa;
    }

    // =====================================================================================
    // Nutriente Mapping
    // =====================================================================================

    public static NutrienteDto nutrienteToNutrienteDto(Nutriente nutriente) {
        if (nutriente == null) {
            return null;
        }
        NutrienteDto dto = new NutrienteDto();
        dto.setId(nutriente.getId());
        dto.setTitulo(nutriente.getTitulo());
        dto.setDescripcion(nutriente.getDescripcion());
        return dto;
    }

    public static Nutriente nutrienteDtoToNutriente(NutrienteDto dto, Nutriente nutriente) {
        if (dto == null) {
            return null;
        }
        if (nutriente == null) {
            nutriente = new Nutriente();
        }
        if (dto.getId() != null) {
             nutriente.setId(dto.getId());
        }
        nutriente.setTitulo(dto.getTitulo());
        nutriente.setDescripcion(dto.getDescripcion());
        return nutriente;
    }

    // =====================================================================================
    // PlantEvent Polymorphic Mapping (Entity to DTO)
    // =====================================================================================

    public static PlantEventDto plantEventToPlantEventDto(PlantEvent event) {
        if (event instanceof NoteEvent) {
            return noteEventToNoteEventDto((NoteEvent) event);
        } else if (event instanceof WateringEvent) {
            return wateringEventToWateringEventDto((WateringEvent) event);
        } else if (event instanceof PruningEvent) {
            return pruningEventToPruningEventDto((PruningEvent) event);
        } else if (event instanceof DefoliationEvent) {
            return defoliationEventToDefoliationEventDto((DefoliationEvent) event);
        } else if (event instanceof NutrientEvent) {
            return nutrientEventToNutrientEventDto((NutrientEvent) event);
        } else if (event instanceof StageChangeEvent) {
            return stageChangeEventToStageChangeEventDto((StageChangeEvent) event);
        } else if (event instanceof MeasurementEvent) {
            return measurementEventToMeasurementEventDto((MeasurementEvent) event);
        }
        throw new IllegalArgumentException("Unknown event type: " + event.getClass().getName());
    }

    private static NoteEventDto noteEventToNoteEventDto(NoteEvent event) {
        NoteEventDto dto = new NoteEventDto();
        copyCommonEventPropertiesToDto(event, dto);
        dto.setText(event.getText());
        dto.setMediaUrls(event.getMediaUrls());
        return dto;
    }

    private static WateringEventDto wateringEventToWateringEventDto(WateringEvent event) {
        WateringEventDto dto = new WateringEventDto();
        copyCommonEventPropertiesToDto(event, dto);
        dto.setPhAgua(event.getPhAgua());
        dto.setEcAgua(event.getEcAgua());
        dto.setTempAgua(event.getTempAgua());
        return dto;
    }

    private static PruningEventDto pruningEventToPruningEventDto(PruningEvent event) {
        PruningEventDto dto = new PruningEventDto();
        copyCommonEventPropertiesToDto(event, dto);
        dto.setTipoPoda(event.getTipoPoda());
        return dto;
    }

    private static DefoliationEventDto defoliationEventToDefoliationEventDto(DefoliationEvent event) {
        DefoliationEventDto dto = new DefoliationEventDto();
        copyCommonEventPropertiesToDto(event, dto);
        dto.setGradoDefoliacion(event.getGradoDefoliacion());
        return dto;
    }

    private static NutrientEventDto nutrientEventToNutrientEventDto(NutrientEvent event) {
        NutrientEventDto dto = new NutrientEventDto();
        copyCommonEventPropertiesToDto(event, dto);
        dto.setNutriente(nutrienteToNutrienteDto(event.getNutriente()));
        return dto;
    }

    private static StageChangeEventDto stageChangeEventToStageChangeEventDto(StageChangeEvent event) {
        StageChangeEventDto dto = new StageChangeEventDto();
        copyCommonEventPropertiesToDto(event, dto);
        dto.setNuevaEtapa(event.getNuevaEtapa());
        return dto;
    }

    private static MeasurementEventDto measurementEventToMeasurementEventDto(MeasurementEvent event) {
        MeasurementEventDto dto = new MeasurementEventDto();
        copyCommonEventPropertiesToDto(event, dto);
        dto.setHorasLuz(event.getHorasLuz()); // Now String
        dto.setHumedad(event.getHumedad());
        dto.setTemperaturaAmbiente(event.getTemperaturaAmbiente());
        dto.setAlturaPlanta(event.getAlturaPlanta()); // Now int
        dto.setDistanciaLuz(event.getDistanciaLuz()); // Now int
        return dto;
    }

    private static void copyCommonEventPropertiesToDto(PlantEvent event, PlantEventDto dto) {
        dto.setId(event.getId());
        dto.setFecha(event.getFecha());

    }

    // =====================================================================================
    // PlantEvent Polymorphic Mapping (DTO to Entity)
    // =====================================================================================

    public static PlantEvent plantEventDtoToPlantEvent(PlantEventDto eventDto, PlantEvent event) {
        if (eventDto instanceof NoteEventDto) {
            return noteEventDtoToNoteEvent((NoteEventDto) eventDto, (event instanceof NoteEvent) ? (NoteEvent) event : new NoteEvent());
        } else if (eventDto instanceof WateringEventDto) {
            return wateringEventDtoToWateringEvent((WateringEventDto) eventDto, (event instanceof WateringEvent) ? (WateringEvent) event : new WateringEvent());
        } else if (eventDto instanceof PruningEventDto) {
            return pruningEventDtoToPruningEvent((PruningEventDto) eventDto, (event instanceof PruningEvent) ? (PruningEvent) event : new PruningEvent());
        } else if (eventDto instanceof DefoliationEventDto) {
            return defoliationEventDtoToDefoliationEvent((DefoliationEventDto) eventDto, (event instanceof DefoliationEvent) ? (DefoliationEvent) event : new DefoliationEvent());
        } else if (eventDto instanceof NutrientEventDto) {
            return nutrientEventDtoToNutrientEvent((NutrientEventDto) eventDto, (event instanceof NutrientEvent) ? (NutrientEvent) event : new NutrientEvent());
        } else if (eventDto instanceof StageChangeEventDto) {
            return stageChangeEventDtoToStageChangeEvent((StageChangeEventDto) eventDto, (event instanceof StageChangeEvent) ? (StageChangeEvent) event : new StageChangeEvent());
        } else if (eventDto instanceof MeasurementEventDto) {
            return measurementEventDtoToMeasurementEvent((MeasurementEventDto) eventDto, (event instanceof MeasurementEvent) ? (MeasurementEvent) event : new MeasurementEvent());
        }
        throw new IllegalArgumentException("Unknown event DTO type: " + eventDto.getClass().getName());
    }

    private static NoteEvent noteEventDtoToNoteEvent(NoteEventDto dto, NoteEvent event) {
        copyCommonEventPropertiesToEntity(dto, event);
        event.setText(dto.getText());
        // The 'mediaUrls' are set by the service after storing the files from dto.getFiles()
        return event;
    }

    private static WateringEvent wateringEventDtoToWateringEvent(WateringEventDto dto, WateringEvent event) {
        copyCommonEventPropertiesToEntity(dto, event);
        event.setPhAgua(dto.getPhAgua());
        event.setEcAgua(dto.getEcAgua());
        event.setTempAgua(dto.getTempAgua());
        return event;
    }

    private static PruningEvent pruningEventDtoToPruningEvent(PruningEventDto dto, PruningEvent event) {
        copyCommonEventPropertiesToEntity(dto, event);
        event.setTipoPoda(dto.getTipoPoda());
        return event;
    }

    private static DefoliationEvent defoliationEventDtoToDefoliationEvent(DefoliationEventDto dto, DefoliationEvent event) {
        copyCommonEventPropertiesToEntity(dto, event);
        event.setGradoDefoliacion(dto.getGradoDefoliacion());
        return event;
    }

    private static NutrientEvent nutrientEventDtoToNutrientEvent(NutrientEventDto dto, NutrientEvent event) {
        copyCommonEventPropertiesToEntity(dto, event);
        event.setNutriente(nutrienteDtoToNutriente(dto.getNutriente(), event.getNutriente()));
        return event;
    }

    private static StageChangeEvent stageChangeEventDtoToStageChangeEvent(StageChangeEventDto dto, StageChangeEvent event) {
        copyCommonEventPropertiesToEntity(dto, event);
        event.setNuevaEtapa(dto.getNuevaEtapa());
        return event;
    }

    private static MeasurementEvent measurementEventDtoToMeasurementEvent(MeasurementEventDto dto, MeasurementEvent event) {
        copyCommonEventPropertiesToEntity(dto, event);
        event.setHorasLuz(dto.getHorasLuz()); // Now String
        event.setHumedad(dto.getHumedad());
        event.setTemperaturaAmbiente(dto.getTemperaturaAmbiente());
        event.setAlturaPlanta(dto.getAlturaPlanta()); // Now int
        event.setDistanciaLuz(dto.getDistanciaLuz()); // Now int
        return event;
    }

    private static void copyCommonEventPropertiesToEntity(PlantEventDto dto, PlantEvent event) {
        if (dto.getId() != null && dto.getId() > 0) {
            event.setId(dto.getId());
        }
        event.setFecha(dto.getFecha());

    }
}
