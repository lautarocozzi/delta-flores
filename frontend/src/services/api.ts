import api from "@/utils/api";
import { PlantaDto, SalaDto, CepaDto, UserDto, NutrienteDto, ZonaDto, SalaColaboradorDto, DeviceSessionGroup } from "@/interfaces/Planta";
import { BackendEvent, WateringEventPayload, PruningEventPayload, StageChangeEventPayload, DefoliationEventPayload, MeasurementEventPayload } from "@/interfaces/Eventos";
import { PlantaDtoSchema, SalaDtoSchema, CepaDtoSchema, UserDtoSchema, NutrienteDtoSchema, ZonaDtoSchema, SalaColaboradorDtoSchema, DeviceSessionGroupSchema, PostDtoSchema, PostDetailDtoSchema, PostReplyDtoSchema, TopPlantaDtoSchema, TareaProgramadaDtoSchema, ColaboradorInfoDtoSchema } from "@/schemas/DTOSchemas";
import { validateResponse, validateArrayResponse } from '@/utils/validationHelper';
import { ApiError } from '@/errors';

export const apiService = {
  // --- AUTH ---
  getMe: async (): Promise<UserDto> => {
    try {
      const response = await api.get('/api/auth/me');
      return validateResponse(UserDtoSchema, response.data, 'GET /api/auth/me');
    } catch (error: unknown) {
      throw ApiError.fromAxiosError(error);
    }
  },

  loginUser: async (email: string, password: string): Promise<{ access_token: string }> => {
    try {
      const response = await api.post('/login', { username: email, password });
      return response.data;
    } catch (error: unknown) {
      throw ApiError.fromAxiosError(error);
    }
  },

  registerUser: async (email: string, password: string, username: string): Promise<{ message: string }> => {
    try {
      const response = await api.post('/api/users/register', {
        email,
        password,
        username,
        nombre: 'Usuario',
        apellido: 'Nuevo'
      });
      return response.data;
    } catch (error: unknown) {
      throw ApiError.fromAxiosError(error);
    }
  },

  // --- PLANTAS ---
  getPlantas: async (): Promise<PlantaDto[]> => {
    const response = await api.get('/api/plantas');

    return validateArrayResponse(PlantaDtoSchema, response.data, 'GET /api/plantas');
  },

  getPlantaById: async (id: string): Promise<PlantaDto> => {
    const response = await api.get(`/api/plantas/${id}`);

    return validateResponse(PlantaDtoSchema, response.data, `GET /api/plantas/${id}`);
  },

  getPlantEvents: async (id: string): Promise<BackendEvent[]> => {
    const response = await api.get(`/api/plantas/${id}/events`);
    return validateArrayResponse(PlantEventSchema, response.data, `GET /api/plantas/${id}/events`);
  },

  getPublicPlantEvents: async (id: string): Promise<BackendEvent[]> => {
    const response = await api.get(`/api/plantas/${id}/events/public`);
    return validateArrayResponse(PlantEventSchema, response.data, `GET /api/plantas/${id}/events/public`);
  },

  createPlanta: async (plantaData: Partial<PlantaDto>): Promise<PlantaDto> => {
    const response = await api.post('/api/plantas', plantaData);
    return validateResponse(PlantaDtoSchema, response.data, 'POST /api/plantas');
  },

  deletePlanta: async (id: number): Promise<void> => {
    await api.delete(`/api/plantas/${id}`);
  },

  updatePlanta: async (id: number, plantaData: Partial<PlantaDto>): Promise<PlantaDto> => {
    const response = await api.put(`/api/plantas/${id}`, plantaData);
    return validateResponse(PlantaDtoSchema, response.data, `PUT /api/plantas/${id}`);
  },

  // --- SALAS ---
  getSalas: async (): Promise<SalaDto[]> => {
    const response = await api.get('/api/salas');

    return validateArrayResponse(SalaDtoSchema, response.data, 'GET /api/salas');
  },

  getSalaById: async (id: number): Promise<SalaDto> => {
    const response = await api.get(`/api/salas/${id}`);

    return validateResponse(SalaDtoSchema, response.data, `GET /api/salas/${id}`);
  },

  getSalasDisponibles: async (): Promise<SalaDto[]> => {
    const response = await api.get('/api/salas/disponibles');

    return validateArrayResponse(SalaDtoSchema, response.data, 'GET /api/salas/disponibles');
  },

  createSala: async (salaData: Partial<SalaDto>): Promise<SalaDto> => {
    const response = await api.post('/api/salas', salaData);
    return validateResponse(SalaDtoSchema, response.data, 'POST /api/salas');
  },

  updateSala: async (id: number, salaData: Partial<SalaDto>): Promise<SalaDto> => {
    const response = await api.put(`/api/salas/${id}`, salaData);
    return validateResponse(SalaDtoSchema, response.data, `PUT /api/salas/${id}`);
  },

  deleteSala: async (id: number, deletePlants: boolean = false): Promise<void> => {
    try {
      await api.delete(`/api/salas/${id}`, { params: { deletePlants } });
    } catch (error: unknown) {
      throw ApiError.fromAxiosError(error);
    }
  },

  toggleSalaPublic: async (id: number, propagateVisibility: boolean = false): Promise<SalaDto> => {
    const response = await api.put(`/api/salas/${id}/toggle-public`, { propagateVisibility });
    return validateResponse(SalaDtoSchema, response.data, `PUT /api/salas/${id}/toggle-public`);
  },

  toggleSalaPin: async (id: number): Promise<SalaDto> => {
    const response = await api.put(`/api/salas/${id}/pin`);
    return validateResponse(SalaDtoSchema, response.data, `PUT /api/salas/${id}/pin`);
  },

  // --- PUBLIC PROFILE ---
  getPublicProfileByUsername: async (username: string): Promise<UserDto> => {
    const response = await api.get(`/api/users/username/${encodeURIComponent(username)}`);
    return validateResponse(UserDtoSchema, response.data, `GET /api/users/username/${username}`);
  },

  getSalaByUsernameAndId: async (username: string, salaId: number): Promise<SalaDto> => {
    const response = await api.get(`/api/users/${encodeURIComponent(username)}/salas/${salaId}`);
    return validateResponse(SalaDtoSchema, response.data, `GET /api/users/${username}/salas/${salaId}`);
  },

  getPublicPlantasByUsername: async (username: string): Promise<PlantaDto[]> => {
    const response = await api.get(`/api/users/${encodeURIComponent(username)}/plantas/public`);
    return validateArrayResponse(PlantaDtoSchema, response.data, `GET /api/users/${username}/plantas/public`);
  },

  getPublicSalasByUsername: async (username: string, includeCollaborations: boolean = false): Promise<SalaDto[]> => {
    const response = await api.get(`/api/users/${encodeURIComponent(username)}/salas/public`, {
      params: { includeCollaborations },
    });
    return validateArrayResponse(SalaDtoSchema, response.data, `GET /api/users/${username}/salas/public`);
  },

  // --- COLABORADORES ---
  getColaboradores: async (salaId: number): Promise<SalaColaboradorDto[]> => {
    const response = await api.get(`/api/salas/${salaId}/colaboradores`);
    return validateArrayResponse(SalaColaboradorDtoSchema, response.data, `GET /api/salas/${salaId}/colaboradores`);
  },

  agregarColaborador: async (salaId: number, email: string, tipoColaborador: string = "EDITOR"): Promise<SalaColaboradorDto> => {
    const response = await api.post(`/api/salas/${salaId}/colaboradores`, { email, tipoColaborador });
    return validateResponse(SalaColaboradorDtoSchema, response.data, `POST /api/salas/${salaId}/colaboradores`);
  },

  removerColaborador: async (salaId: number, userId: number): Promise<void> => {
    await api.delete(`/api/salas/${salaId}/colaboradores/${userId}`);
  },

  // --- MÉTRICAS DE SALA ---
  getSalaMetrics: async (salaId: number, months: number = 6): Promise<BackendEvent[]> => {
    const response = await api.get(`/api/salas/${salaId}/metrics`, { params: { months } });
    return response.data;
  },

  // --- CEPAS ---
  getCepas: async (): Promise<CepaDto[]> => {
    const response = await api.get('/api/cepas');

    return validateArrayResponse(CepaDtoSchema, response.data, 'GET /api/cepas');
  },

  getCepasBySala: async (salaId: number): Promise<CepaDto[]> => {
    const response = await api.get(`/api/cepas/sala/${salaId}`);

    return validateArrayResponse(CepaDtoSchema, response.data, `GET /api/cepas/sala/${salaId}`);
  },

  createCepa: async (cepaData: Partial<CepaDto>): Promise<CepaDto> => {
    const response = await api.post('/api/cepas', cepaData);
    return response.data;
  },

  updateCepa: async (id: number, cepaData: Partial<CepaDto>): Promise<CepaDto> => {
    const response = await api.put(`/api/cepas/${id}`, cepaData);
    return response.data;
  },

  deleteCepa: async (id: number): Promise<void> => {
    await api.delete(`/api/cepas/${id}`);
  },

  // --- NUTRIENTES ---
  getNutrientes: async (): Promise<NutrienteDto[]> => {
    const response = await api.get('/api/nutrientes');

    return validateArrayResponse(NutrienteDtoSchema, response.data, 'GET /api/nutrientes');
  },

  createNutriente: async (nutrienteData: { titulo: string, descripcion: string }): Promise<any> => {
    const response = await api.post('/api/nutrientes', nutrienteData);
    return response.data;
  },

  updateNutriente: async (id: number, nutrienteData: { titulo: string, descripcion: string }): Promise<any> => {
    const response = await api.put(`/api/nutrientes/${id}`, nutrienteData);
    return response.data;
  },

  deleteNutriente: async (id: number): Promise<void> => {
    await api.delete(`/api/nutrientes/${id}`);
  },

  // --- USUARIOS ---
  getUsers: async (): Promise<UserDto[]> => {
    const response = await api.get('/api/users');

    return validateArrayResponse(UserDtoSchema, response.data, 'GET /api/users');
  },

  // --- ADMIN: Get plants by userId (SUPER_ADMIN only) ---
  getPlantasByUserId: async (userId: number): Promise<PlantaDto[]> => {
    const response = await api.get(`/api/plantas/user/${userId}`);

    return validateArrayResponse(PlantaDtoSchema, response.data, `GET /api/plantas/user/${userId}`);
  },

  // --- PLANTAS BY SALA (bulk occupied cells) ---
  getPlantasBySala: async (salaId: number): Promise<PlantaDto[]> => {
    const response = await api.get(`/api/plantas/sala/${salaId}`);
    return validateArrayResponse(PlantaDtoSchema, response.data, `GET /api/plantas/sala/${salaId}`);
  },

  // --- ZONAS ---
  getZonasBySala: async (salaId: number): Promise<ZonaDto[]> => {
    const response = await api.get(`/api/zonas/sala/${salaId}`);
    return validateArrayResponse(ZonaDtoSchema, response.data, `GET /api/zonas/sala/${salaId}`);
  },

  getPlantasByZona: async (zonaId: number): Promise<PlantaDto[]> => {
    const response = await api.get(`/api/zonas/${zonaId}/plantas`);
    return validateArrayResponse(PlantaDtoSchema, response.data, `GET /api/zonas/${zonaId}/plantas`);
  },

  createZona: async (zonaData: Partial<ZonaDto>): Promise<ZonaDto> => {
    const response = await api.post('/api/zonas', zonaData);
    return validateResponse(ZonaDtoSchema, response.data, 'POST /api/zonas');
  },

  updateZona: async (id: number, zonaData: Partial<ZonaDto>): Promise<ZonaDto> => {
    const response = await api.put(`/api/zonas/${id}`, zonaData);
    return validateResponse(ZonaDtoSchema, response.data, `PUT /api/zonas/${id}`);
  },

  deleteZona: async (id: number): Promise<void> => {
    await api.delete(`/api/zonas/${id}`);
  },

  createZonasBatch: async (salaId: number, zonas: { posicionX: number; posicionY: number; columnas: number; filas: number }[]): Promise<ZonaDto[]> => {
    const response = await api.post(`/api/salas/${salaId}/zonas/batch`, { zonas });
    return validateArrayResponse(ZonaDtoSchema, response.data, `POST /api/salas/${salaId}/zonas/batch`);
  },

  updateUbicacion: async (plantaId: number, ubicacion: { zonaId: number; columna: number; fila: number }): Promise<PlantaDto> => {
    const response = await api.put(`/api/plantas/${plantaId}/ubicacion`, ubicacion);
    return validateResponse(PlantaDtoSchema, response.data, `PUT /api/plantas/${plantaId}/ubicacion`);
  },

  // Swap two plants' zone locations
  swapPlantasUbicacion: async (plantaId1: number, plantaId2: number): Promise<void> => {
    await api.put(`/api/plantas/${plantaId1}/swap/${plantaId2}`);
  },

  // --- EVENTOS ---
  createNutrientEvent: async (eventData: any): Promise<BackendEvent> => {
    const response = await api.post('/api/events/nutrient', eventData);
    return response.data;
  },

  createWateringEvent: async (eventData: WateringEventPayload): Promise<BackendEvent> => {
    const response = await api.post('/api/events/watering', eventData);
    return response.data;
  },

  createPruningEvent: async (eventData: PruningEventPayload): Promise<BackendEvent> => {
    const response = await api.post('/api/events/pruning', eventData);
    return response.data;
  },

  createNoteEvent: async (formData: FormData): Promise<BackendEvent> => {
    const response = await api.post('/api/events/note', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  createPhotoEvent: async (formData: FormData): Promise<BackendEvent> => {
    const response = await api.post('/api/events/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  createStageChangeEvent: async (eventData: StageChangeEventPayload): Promise<BackendEvent> => {
    const response = await api.post('/api/events/stage-change', eventData);
    return response.data;
  },

  createDefoliationEvent: async (eventData: DefoliationEventPayload): Promise<BackendEvent> => {
    const response = await api.post('/api/events/defoliation', eventData);
    return response.data;
  },

  createMeasurementEvent: async (eventData: MeasurementEventPayload): Promise<BackendEvent> => {
    const response = await api.post('/api/events/measurement', eventData);
    return response.data;
  },

  deleteEvent: async (eventType: string, eventId: string): Promise<void> => {
    await api.delete(`/api/events/${eventType.toLowerCase()}/${eventId}`);
  },

  updateEvent: async (eventType: string, eventId: string, payload: any): Promise<BackendEvent> => {
    const isFormData = payload instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const response = await api.put(`/api/events/${eventType.toLowerCase()}/${eventId}`, payload, config);
    return response.data;
  },

  getAllEventsForCurrentUser: async (filters: any = {}): Promise<BackendEvent[]> => {
    const queryParams = new URLSearchParams();
    if (filters.type && filters.type !== 'Todos') queryParams.append('eventType', filters.type);
    if (filters.sala && filters.sala !== 'Todas') queryParams.append('salaId', filters.sala);
    if (filters.plantId && filters.plantId !== 'Todas') queryParams.append('plantId', filters.plantId);
    if (filters.dateRange?.from) queryParams.append('startDate', filters.dateRange.from.toISOString().split('T')[0]);
    if (filters.dateRange?.to) queryParams.append('endDate', filters.dateRange.to.toISOString().split('T')[0]);

    const response = await api.get(`/api/log/events`, { params: queryParams });
    return response.data;
  },

  // --- FAVORITES ---
  addFavoritePlanta: async (id: number): Promise<void> => {
    await api.post(`/api/favorites/plantas/${id}`);
  },

  removeFavoritePlanta: async (id: number): Promise<void> => {
    await api.delete(`/api/favorites/plantas/${id}`);
  },

  getFavoritePlantas: async (): Promise<PlantaDto[]> => {
    const response = await api.get('/api/favorites/plantas');
    return validateArrayResponse(PlantaDtoSchema, response.data, 'GET /api/favorites/plantas');
  },

  // --- USER PROFILE ---
  updateUserProfile: async (id: number, data: { username?: string; nombre?: string; apellido?: string }): Promise<UserDto> => {
    try {
      const response = await api.put(`/api/users/${id}/profile`, data);
      return validateResponse(UserDtoSchema, response.data, `PUT /api/users/${id}/profile`);
    } catch (error: unknown) {
      throw ApiError.fromAxiosError(error);
    }
  },

  updatePassword: async (id: number, currentPassword: string, newPassword: string): Promise<void> => {
    try {
      await api.put(`/api/users/${id}/password`, { currentPassword, newPassword });
    } catch (error: unknown) {
      throw ApiError.fromAxiosError(error);
    }
  },

  uploadProfileImage: async (id: number, file: File): Promise<UserDto> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post(`/api/users/${id}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return validateResponse(UserDtoSchema, response.data, `POST /api/users/${id}/image`);
    } catch (error: unknown) {
      throw ApiError.fromAxiosError(error);
    }
  },

  checkUsername: async (username: string): Promise<boolean> => {
    try {
      const response = await api.get(`/api/users/check-username/${encodeURIComponent(username)}`);
      return response.data.available;
    } catch (error: unknown) {
      throw ApiError.fromAxiosError(error);
    }
  },

  // --- PUBLIC PLANTAS ---
  getPublicPlantas: async (): Promise<PlantaDto[]> => {
    const response = await api.get('/api/plantas/public');
    return validateArrayResponse(PlantaDtoSchema, response.data, 'GET /api/plantas/public');
  },

  togglePublicStatus: async (plantaId: number): Promise<PlantaDto> => {
    const response = await api.put(`/api/plantas/${plantaId}/toggle-public`);
    return validateResponse(PlantaDtoSchema, response.data, `PUT /api/plantas/${plantaId}/toggle-public`);
  },

  // --- SESSIONS (Multi-Device Management) ---
  getSessions: async (): Promise<DeviceSessionGroup[]> => {
    const response = await api.get('/api/auth/sessions');
    return validateArrayResponse(DeviceSessionGroupSchema, response.data, 'GET /api/auth/sessions');
  },

  revokeSession: async (sessionId: string): Promise<void> => {
    await api.delete(`/api/auth/sessions/${sessionId}`);
  },

  revokeDeviceSessions: async (deviceKey: string): Promise<void> => {
    await api.delete(`/api/auth/sessions/device/${deviceKey}`);
  },

  revokeAllSessions: async (): Promise<void> => {
    await api.delete('/api/auth/sessions');
  },

  // ─── Comunidad / Posts ───────────────────────────────────

  getPosts: async (params: {
    categoria?: string;
    tipo?: string;
    sort?: string;
    search?: string;
    page?: number;
    size?: number;
  } = {}): Promise<{ content: PostDto[]; totalElements: number; totalPages: number; last: boolean }> => {
    const response = await api.get('/api/comunidad/posts', { params });
    const data = response.data;
    return {
      content: data.content.map((item: any) => validateResponse(PostDtoSchema, item, 'GET /api/comunidad/posts')),
      totalElements: data.totalElements,
      totalPages: data.totalPages,
      last: data.last,
    };
  },

  getHeroPosts: async (): Promise<PostDto[]> => {
    const response = await api.get('/api/comunidad/posts/hero');
    return response.data.map((item: any) => validateResponse(PostDtoSchema, item, 'GET /api/comunidad/posts/hero'));
  },

  getPost: async (id: number): Promise<PostDetailDto> => {
    const response = await api.get(`/api/comunidad/posts/${id}`);
    return validateResponse(PostDetailDtoSchema, response.data, `GET /api/comunidad/posts/${id}`);
  },

  createPost: async (data: { titulo: string; contenido: string; tipoPost: string; categoria: string }): Promise<PostDto> => {
    const response = await api.post('/api/comunidad/posts', data);
    return validateResponse(PostDtoSchema, response.data, 'POST /api/comunidad/posts');
  },

  updatePost: async (id: number, data: { titulo: string; contenido: string; tipoPost: string; categoria: string }): Promise<PostDto> => {
    const response = await api.put(`/api/comunidad/posts/${id}`, data);
    return validateResponse(PostDtoSchema, response.data, `PUT /api/comunidad/posts/${id}`);
  },

  deletePost: async (id: number): Promise<void> => {
    await api.delete(`/api/comunidad/posts/${id}`);
  },

  votePost: async (id: number, tipo: 'UP' | 'DOWN'): Promise<PostDto> => {
    const response = await api.post(`/api/comunidad/posts/${id}/vote`, { tipo });
    return validateResponse(PostDtoSchema, response.data, `POST /api/comunidad/posts/${id}/vote`);
  },

  markResuelto: async (id: number): Promise<PostDto> => {
    const response = await api.post(`/api/comunidad/posts/${id}/resolve`);
    return validateResponse(PostDtoSchema, response.data, `POST /api/comunidad/posts/${id}/resolve`);
  },

  toggleHeroPost: async (id: number): Promise<PostDto> => {
    const response = await api.put(`/api/comunidad/posts/${id}/hero`);
    return validateResponse(PostDtoSchema, response.data, `PUT /api/comunidad/posts/${id}/hero`);
  },

  getReplies: async (postId: number): Promise<PostReplyDto[]> => {
    const response = await api.get(`/api/comunidad/posts/${postId}/replies`);
    return response.data.map((item: any) => validateResponse(PostReplyDtoSchema, item, `GET /api/comunidad/posts/${postId}/replies`));
  },

  createReply: async (postId: number, contenido: string): Promise<PostReplyDto> => {
    const response = await api.post(`/api/comunidad/posts/${postId}/replies`, { contenido });
    return validateResponse(PostReplyDtoSchema, response.data, `POST /api/comunidad/posts/${postId}/replies`);
  },

  deleteReply: async (replyId: number): Promise<void> => {
    await api.delete(`/api/comunidad/posts/replies/${replyId}`);
  },

  voteReply: async (replyId: number, tipo: 'UP' | 'DOWN'): Promise<PostReplyDto> => {
    const response = await api.post(`/api/comunidad/posts/replies/${replyId}/vote`, { tipo });
    return validateResponse(PostReplyDtoSchema, response.data, `POST /api/comunidad/posts/replies/${replyId}/vote`);
  },

  markSolucion: async (replyId: number): Promise<PostReplyDto> => {
    const response = await api.post(`/api/comunidad/posts/replies/${replyId}/solve`);
    return validateResponse(PostReplyDtoSchema, response.data, `POST /api/comunidad/posts/replies/${replyId}/solve`);
  },

  getTopPlantas: async (limit: number = 10): Promise<TopPlantaDto[]> => {
    const response = await api.get('/api/comunidad/top-plantas', { params: { limit } });
    return response.data.map((item: any) => validateResponse(TopPlantaDtoSchema, item, 'GET /api/comunidad/top-plantas'));
  },

  getUserPosts: async (userId: number, page: number = 0, size: number = 20): Promise<{ content: PostDto[]; totalElements: number; totalPages: number; last: boolean }> => {
    const response = await api.get(`/api/comunidad/posts/user/${userId}`, { params: { page, size } });
    const data = response.data;
    return {
      content: data.content.map((item: any) => validateResponse(PostDtoSchema, item, 'GET /api/comunidad/posts/user/' + userId)),
      totalElements: data.totalElements,
      totalPages: data.totalPages,
      last: data.last,
    };
  },

  deletePostAdmin: async (id: number): Promise<void> => {
    await api.delete(`/api/comunidad/admin/posts/${id}`);
  },

  deleteReplyAdmin: async (replyId: number): Promise<void> => {
    await api.delete(`/api/comunidad/admin/replies/${replyId}`);
  },

  // --- COLABORADORES ---
  getMisColaboradores: async () => {
    const response = await api.get('/api/salas/mis-colaboradores');
    return validateArrayResponse(ColaboradorInfoDtoSchema, response.data, 'GET /api/salas/mis-colaboradores');
  },

  // --- TAREAS PROGRAMADAS ---
  getTareas: async () => {
    const response = await api.get('/api/tareas');
    return validateArrayResponse(TareaProgramadaDtoSchema, response.data, 'GET /api/tareas');
  },

  getTareasPendientes: async () => {
    const response = await api.get('/api/tareas/pendientes');
    return validateArrayResponse(TareaProgramadaDtoSchema, response.data, 'GET /api/tareas/pendientes');
  },

  createTarea: async (data: {
    titulo: string;
    descripcion?: string;
    recurrencia: string;
    fechaProgramada: string;
    usuarioDestinoId?: number;
    salaAsociadaId?: number | null;
    plantaAsociadaId?: number | null;
    colaboradorAsignadoId?: number | null;
  }) => {
    const response = await api.post('/api/tareas', data);
    return validateResponse(TareaProgramadaDtoSchema, response.data, 'POST /api/tareas');
  },

  updateTarea: async (id: number, data: {
    titulo: string;
    descripcion?: string;
    recurrencia: string;
    fechaProgramada: string;
    usuarioDestinoId?: number;
    salaAsociadaId?: number | null;
    plantaAsociadaId?: number | null;
    colaboradorAsignadoId?: number | null;
  }) => {
    const response = await api.put(`/api/tareas/${id}`, data);
    return validateResponse(TareaProgramadaDtoSchema, response.data, `PUT /api/tareas/${id}`);
  },

  toggleTarea: async (id: number) => {
    const response = await api.put(`/api/tareas/${id}/toggle`);
    return validateResponse(TareaProgramadaDtoSchema, response.data, `PUT /api/tareas/${id}/toggle`);
  },

  deleteTarea: async (id: number): Promise<void> => {
    await api.delete(`/api/tareas/${id}`);
  },
};
