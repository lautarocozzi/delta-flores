package DeltaFlores.web.utils;

import DeltaFlores.web.dto.*;
import DeltaFlores.web.entities.*;
import DeltaFlores.web.repository.PostVoteRepository;
import DeltaFlores.web.repository.PostReplyRepository;
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
        userDto.setEmail(user.getEmail());
        userDto.setImagenUrl(user.getImagenUrl());
        userDto.setPassword(user.getPassword());
        userDto.setRol(user.getRol());
        userDto.setFechaRegistro(user.getFechaRegistro());
        return userDto;
    }

    public static UserDto UserToRegisterDtoToUserDto(UserDto userDto, UserToRegisterDto userToRegisterDto)
            throws BadRequestException {
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
        salaDto.setTipoAmbiente(sala.getTipoAmbiente());
        salaDto.setImagenUrl(sala.getImagenUrl());
        salaDto.setPublic(sala.isPublic());
        salaDto.setPinned(sala.isPinned());
        salaDto.setFechaModificacion(sala.getFechaModificacion());
        if (sala.getUser() != null) {
            salaDto.setUserId(sala.getUser().getId());
            salaDto.setOwnerUsername(sala.getUser().getUsername());
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
        sala.setTipoAmbiente(salaDto.getTipoAmbiente());
        sala.setImagenUrl(salaDto.getImagenUrl());
        sala.setPublic(salaDto.isPublic());
        sala.setPinned(salaDto.isPinned());
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
        plantaDto.setImagenUrl(planta.getImagenUrl());
        plantaDto.setProduccion(planta.getProduccion());
        plantaDto.setFechaCreacion(planta.getFechaCreacion());
        if (planta.getSala() != null) {
            plantaDto.setSalaId(planta.getSala().getId());
            // Popular objeto completo para frontend
            SalaDto salaDto = new SalaDto();
            salaDto.setId(planta.getSala().getId());
            salaDto.setNombre(planta.getSala().getNombre());
            plantaDto.setSala(salaDto);
        }
        if (planta.getCepa() != null) {
            plantaDto.setCepaId(planta.getCepa().getId());
            // Popular objeto completo para frontend
            CepaDto cepaDto = new CepaDto();
            cepaDto.setId(planta.getCepa().getId());
            cepaDto.setGeneticaParental(planta.getCepa().getGeneticaParental());
            cepaDto.setAbreviatura(planta.getCepa().getAbreviatura());
            plantaDto.setCepaDto(cepaDto);
        }

        if (planta.getZona() != null) {
            plantaDto.setZonaId(planta.getZona().getId());
            plantaDto.setZonaNombre(planta.getZona().getNombre());
        }
        plantaDto.setColumnaEnZona(planta.getColumnaEnZona());
        plantaDto.setFilaEnZona(planta.getFilaEnZona());

        if (planta.getEvents() != null && !planta.getEvents().isEmpty()) {
            plantaDto.setEventIds(planta.getEvents().stream()
                    .map(PlantEvent::getId)
                    .collect(Collectors.toList()));
        }

        return plantaDto;
    }

    public static Planta plantaDtoToPlanta(Planta planta, PlantaDto plantaDto, Cepa cepa, Sala sala, Zona zona) {
        if (plantaDto.getId() != null && plantaDto.getId() > 0) {
            planta.setId(plantaDto.getId());
        }
        planta.setNombre(plantaDto.getNombre());
        planta.setPublic(plantaDto.isPublic());
        planta.setEtapa(plantaDto.getEtapa());
        planta.setFechaCreacion(plantaDto.getFechaCreacion());
        planta.setUbicacion(plantaDto.getUbicacion());
        planta.setImagenUrl(plantaDto.getImagenUrl());
        planta.setProduccion(plantaDto.getProduccion());
        planta.setFechaFin(plantaDto.getFechaFin());

        // Set the entities that were fetched by the service
        planta.setCepa(cepa);
        planta.setSala(sala);
        planta.setZona(zona);
        if (plantaDto.getColumnaEnZona() != null) {
            planta.setColumnaEnZona(plantaDto.getColumnaEnZona());
        }
        if (plantaDto.getFilaEnZona() != null) {
            planta.setFilaEnZona(plantaDto.getFilaEnZona());
        }

        return planta;
    }

    // =====================================================================================
    // Ubicacion Generation
    // =====================================================================================

    /**
     * Auto-generates the ubicacion string for a plant based on its zone name
     * and grid coordinates.
     * <p>
     * Format: {@code {zonaNombre}-F{fila+1}-C{col+1}} (1-based indices)
     * <p>
     * Spaces in zonaNombre are replaced with hyphens.
     * Returns {@code null} if zonaNombre is null (plant not placed in a zone grid).
     * If columna or fila is null, "?" is used as placeholder.
     *
     * @param zonaNombre  the zone name (spaces replaced with hyphens)
     * @param columna     the column index within the zone (0-based, displayed 1-based)
     * @param fila        the row index within the zone (0-based, displayed 1-based)
     * @return the generated ubicacion string, or null if zonaNombre is null
     */
    public static String generarUbicacion(String zonaNombre, Integer columna, Integer fila) {
        if (zonaNombre == null) {
            return null;
        }
        String col = columna != null ? String.valueOf(columna + 1) : "?";
        String fil = fila != null ? String.valueOf(fila + 1) : "?";
        return zonaNombre.replaceAll("\\s+", "-")
                + "-F" + fil
                + "-C" + col;
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
        cepaDto.setAbreviatura(cepa.getAbreviatura());
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
        cepa.setAbreviatura(cepaDto.getAbreviatura());
        return cepa;
    }

    // =====================================================================================
    // Zona Mapping
    // =====================================================================================

    public static ZonaDto zonaToZonaDto(Zona zona) {
        if (zona == null) {
            return null;
        }
        ZonaDto dto = new ZonaDto();
        dto.setId(zona.getId());
        dto.setNombre(zona.getNombre());
        dto.setPosicionX(zona.getPosicionX());
        dto.setPosicionY(zona.getPosicionY());
        dto.setColumnas(zona.getColumnas());
        dto.setFilas(zona.getFilas());
        if (zona.getSala() != null) {
            dto.setSalaId(zona.getSala().getId());
            dto.setSalaNombre(zona.getSala().getNombre());
        }
        if (zona.getPlantas() != null) {
            dto.setPlantaIds(zona.getPlantas().stream()
                    .map(Planta::getId)
                    .collect(Collectors.toList()));
        }
        return dto;
    }

    public static Zona zonaDtoToZona(ZonaDto dto, Zona zona, Sala sala) {
        if (dto == null) {
            return null;
        }
        if (zona == null) {
            zona = new Zona();
        }
        if (dto.getId() != null && dto.getId() > 0) {
            zona.setId(dto.getId());
        }
        zona.setNombre(dto.getNombre());
        zona.setPosicionX(dto.getPosicionX());
        zona.setPosicionY(dto.getPosicionY());
        zona.setColumnas(dto.getColumnas());
        zona.setFilas(dto.getFilas());
        zona.setSala(sala);
        return zona;
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
        if (nutriente.getUser() != null) {
            dto.setUserId(nutriente.getUser().getId());
        }
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
        dto.setEventType("NOTE");
        dto.setText(event.getText());
        dto.setMediaUrls(event.getMediaUrls());
        return dto;
    }

    private static WateringEventDto wateringEventToWateringEventDto(WateringEvent event) {
        WateringEventDto dto = new WateringEventDto();
        copyCommonEventPropertiesToDto(event, dto);
        dto.setEventType("WATERING");
        dto.setPhAgua(event.getPhAgua());
        dto.setEcAgua(event.getEcAgua());
        dto.setTempAgua(event.getTempAgua());
        return dto;
    }

    private static PruningEventDto pruningEventToPruningEventDto(PruningEvent event) {
        PruningEventDto dto = new PruningEventDto();
        copyCommonEventPropertiesToDto(event, dto);
        dto.setEventType("PRUNING");
        dto.setTipoPoda(event.getTipoPoda());
        return dto;
    }

    private static DefoliationEventDto defoliationEventToDefoliationEventDto(DefoliationEvent event) {
        DefoliationEventDto dto = new DefoliationEventDto();
        copyCommonEventPropertiesToDto(event, dto);
        dto.setEventType("DEFOLIATION");
        dto.setGradoDefoliacion(event.getGradoDefoliacion());
        return dto;
    }

    private static NutrientEventDto nutrientEventToNutrientEventDto(NutrientEvent event) {
        NutrientEventDto dto = new NutrientEventDto();
        copyCommonEventPropertiesToDto(event, dto);
        dto.setEventType("NUTRIENT");
        dto.setNutriente(nutrienteToNutrienteDto(event.getNutriente()));
        return dto;
    }

    private static StageChangeEventDto stageChangeEventToStageChangeEventDto(StageChangeEvent event) {
        StageChangeEventDto dto = new StageChangeEventDto();
        copyCommonEventPropertiesToDto(event, dto);
        dto.setEventType("STAGE_CHANGE");
        dto.setNuevaEtapa(event.getNuevaEtapa());
        dto.setEtapaAnterior(event.getEtapaAnterior());
        return dto;
    }

    public static MeasurementEventDto measurementEventToMeasurementEventDto(MeasurementEvent event) {
        MeasurementEventDto dto = new MeasurementEventDto();
        copyCommonEventPropertiesToDto(event, dto);
        dto.setEventType("MEASUREMENT");
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
        if (event.getPlantas() != null && !event.getPlantas().isEmpty()) {
            dto.setPlantaIds(event.getPlantas().stream()
                    .map(Planta::getId)
                    .collect(Collectors.toList()));
        }
    }

    // =====================================================================================
    // PlantEvent Polymorphic Mapping (DTO to Entity)
    // =====================================================================================

    public static PlantEvent plantEventDtoToPlantEvent(PlantEventDto eventDto, PlantEvent event) {
        if (eventDto instanceof NoteEventDto) {
            return noteEventDtoToNoteEvent((NoteEventDto) eventDto,
                    (event instanceof NoteEvent) ? (NoteEvent) event : new NoteEvent());
        } else if (eventDto instanceof WateringEventDto) {
            return wateringEventDtoToWateringEvent((WateringEventDto) eventDto,
                    (event instanceof WateringEvent) ? (WateringEvent) event : new WateringEvent());
        } else if (eventDto instanceof PruningEventDto) {
            return pruningEventDtoToPruningEvent((PruningEventDto) eventDto,
                    (event instanceof PruningEvent) ? (PruningEvent) event : new PruningEvent());
        } else if (eventDto instanceof DefoliationEventDto) {
            return defoliationEventDtoToDefoliationEvent((DefoliationEventDto) eventDto,
                    (event instanceof DefoliationEvent) ? (DefoliationEvent) event : new DefoliationEvent());
        } else if (eventDto instanceof NutrientEventDto) {
            return nutrientEventDtoToNutrientEvent((NutrientEventDto) eventDto,
                    (event instanceof NutrientEvent) ? (NutrientEvent) event : new NutrientEvent());
        } else if (eventDto instanceof StageChangeEventDto) {
            return stageChangeEventDtoToStageChangeEvent((StageChangeEventDto) eventDto,
                    (event instanceof StageChangeEvent) ? (StageChangeEvent) event : new StageChangeEvent());
        } else if (eventDto instanceof MeasurementEventDto) {
            return measurementEventDtoToMeasurementEvent((MeasurementEventDto) eventDto,
                    (event instanceof MeasurementEvent) ? (MeasurementEvent) event : new MeasurementEvent());
        }
        throw new IllegalArgumentException("Unknown event DTO type: " + eventDto.getClass().getName());
    }

    private static NoteEvent noteEventDtoToNoteEvent(NoteEventDto dto, NoteEvent event) {
        copyCommonEventPropertiesToEntity(dto, event);
        event.setText(dto.getText());
        // The 'mediaUrls' are set by the service after storing the files from
        // dto.getFiles()
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

    private static DefoliationEvent defoliationEventDtoToDefoliationEvent(DefoliationEventDto dto,
            DefoliationEvent event) {
        copyCommonEventPropertiesToEntity(dto, event);
        event.setGradoDefoliacion(dto.getGradoDefoliacion());
        return event;
    }

    private static NutrientEvent nutrientEventDtoToNutrientEvent(NutrientEventDto dto, NutrientEvent event) {
        copyCommonEventPropertiesToEntity(dto, event);
        event.setNutriente(nutrienteDtoToNutriente(dto.getNutriente(), event.getNutriente()));
        return event;
    }

    private static StageChangeEvent stageChangeEventDtoToStageChangeEvent(StageChangeEventDto dto,
            StageChangeEvent event) {
        copyCommonEventPropertiesToEntity(dto, event);
        event.setNuevaEtapa(dto.getNuevaEtapa());
        return event;
    }

    private static MeasurementEvent measurementEventDtoToMeasurementEvent(MeasurementEventDto dto,
            MeasurementEvent event) {
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

    // =====================================================================================
    // Notificacion Mapping
    // =====================================================================================

    // =====================================================================================
    // SalaColaborador Mapping
    // =====================================================================================

    public static SalaColaboradorDto salaColaboradorToDto(SalaColaborador sc) {
        SalaColaboradorDto dto = new SalaColaboradorDto();
        dto.setId(sc.getId());
        dto.setSalaId(sc.getSala().getId());
        dto.setSalaNombre(sc.getSala().getNombre());
        dto.setUserId(sc.getUser().getId());
        dto.setUserNombre(sc.getUser().getNombre());
        dto.setUserApellido(sc.getUser().getApellido());
        dto.setUserUsername(sc.getUser().getUsername());
        dto.setTipoColaborador(sc.getTipoColaborador() != null ? sc.getTipoColaborador().name() : "EDITOR");
        return dto;
    }

    public static NotificacionDto notificacionToNotificacionDto(Notificacion notificacion) {
        NotificacionDto dto = new NotificacionDto();
        dto.setId(notificacion.getId());
        dto.setTitulo(notificacion.getTitulo());
        dto.setDescripcion(notificacion.getDescripcion());
        dto.setTipoEvento(notificacion.getTipoEvento());
        dto.setFechaCreacion(notificacion.getFechaCreacion());
        dto.setFechaLeida(notificacion.getFechaLeida());
        dto.setLeida(notificacion.getFechaLeida() != null);

        User usuario = notificacion.getUsuario();
        if (usuario != null) {
            dto.setUsuarioId(usuario.getId());
            dto.setUsuarioNombre(usuario.getNombre());
            dto.setUsuarioApellido(usuario.getApellido());
            dto.setUsuarioUsername(usuario.getUsername());
            dto.setUsuarioRol(usuario.getRol());
        }

        return dto;
    }

    // ─── Post Mapping ──────────────────────────────────────

    public static PostDto postToDto(Post post, Long currentUserId,
                                     PostVoteRepository voteRepository,
                                     PostReplyRepository replyRepository) {
        if (post == null) return null;
        PostDto dto = new PostDto();
        dto.setId(post.getId());
        dto.setTitulo(post.getTitulo());
        dto.setContenido(post.getContenido());
        dto.setContenidoPreview(post.getContenidoPreview());
        dto.setTipoPost(post.getTipoPost());
        dto.setCategoria(post.getCategoria());
        dto.setResuelto(post.isResuelto());
        dto.setHero(post.isHero());
        dto.setVistas(post.getVistas());
        dto.setFechaCreacion(post.getFechaCreacion());

        if (post.getUser() != null) {
            dto.setUserId(post.getUser().getId());
            dto.setUserUsername(post.getUser().getUsername());
            dto.setUserNombre(post.getUser().getNombre());
            dto.setUserApellido(post.getUser().getApellido());
            dto.setUserImagenUrl(post.getUser().getImagenUrl());
        }

        // Vote counts
        long upCount = voteRepository.countByPostIdAndTipo(post.getId(), TipoVoto.UP);
        long downCount = voteRepository.countByPostIdAndTipo(post.getId(), TipoVoto.DOWN);
        dto.setUpCount((int) upCount);
        dto.setDownCount((int) downCount);
        dto.setScore((int) (upCount - downCount));

        // Reply count
        long replyCount = replyRepository.countByPostId(post.getId());
        dto.setReplyCount((int) replyCount);

        // Current user vote
        if (currentUserId != null) {
            voteRepository.findByPostIdAndUserId(post.getId(), currentUserId)
                    .ifPresent(v -> dto.setCurrentUserVote(v.getTipo().name()));
        }

        return dto;
    }

    public static PostReplyDto replyToDto(PostReply reply, Long currentUserId,
                                           PostVoteRepository voteRepository) {
        if (reply == null) return null;
        PostReplyDto dto = new PostReplyDto();
        dto.setId(reply.getId());
        dto.setContenido(reply.getContenido());
        dto.setPostId(reply.getPost().getId());
        dto.setSolucion(reply.isSolucion());
        dto.setFechaCreacion(reply.getFechaCreacion());

        if (reply.getUser() != null) {
            dto.setUserId(reply.getUser().getId());
            dto.setUserUsername(reply.getUser().getUsername());
            dto.setUserNombre(reply.getUser().getNombre());
            dto.setUserApellido(reply.getUser().getApellido());
            dto.setUserImagenUrl(reply.getUser().getImagenUrl());
        }

        // Vote counts
        long upCount = voteRepository.countByReplyIdAndTipo(reply.getId(), TipoVoto.UP);
        long downCount = voteRepository.countByReplyIdAndTipo(reply.getId(), TipoVoto.DOWN);
        dto.setUpCount((int) upCount);
        dto.setDownCount((int) downCount);
        dto.setScore((int) (upCount - downCount));

        // Current user vote
        if (currentUserId != null) {
            voteRepository.findByReplyIdAndUserId(reply.getId(), currentUserId)
                    .ifPresent(v -> dto.setCurrentUserVote(v.getTipo().name()));
        }

        return dto;
    }
}
