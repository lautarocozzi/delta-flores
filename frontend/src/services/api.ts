import api from "@/utils/api";
import { PlantaDto, SalaDto, CepaDto, UserDto, NutrienteDto, ZonaDto, SalaColaboradorDto } from "@/interfaces/Planta";
import { BackendEvent, WateringEventPayload, PruningEventPayload, StageChangeEventPayload, DefoliationEventPayload, MeasurementEventPayload } from "@/interfaces/Eventos";
import { PlantaDtoSchema, SalaDtoSchema, CepaDtoSchema, UserDtoSchema, NutrienteDtoSchema, ZonaDtoSchema, SalaColaboradorDtoSchema } from "@/schemas/DTOSchemas";
import { z } from 'zod';
import { validateResponse } from '@/utils/validationHelper';
import { ApiError } from '@/errors';

/** Helper para errores de validación Zod del backend */
function backendContractError(entity: string, id?: string): never {
  throw new ApiError(
    `Invalid server response${id ? ` for ${entity} ${id}` : ` for ${entity}`}`,
    502, // Bad Gateway — el backend mandó datos inválidos
    'BACKEND_CONTRACT_VIOLATION',
  );
}

export const apiService = {
  // --- AUTH ---
  loginUser: async (email: string, password: string): Promise<any> => {
    try {
      const response = await api.post('/login', { username: email, password });
      return response.data;
    } catch (error: unknown) {
      throw ApiError.fromAxiosError(error);
    }
  },

  registerUser: async (email: string, password: string): Promise<any> => {
    try {
      const response = await api.post('/api/users/register', {
        email,
        password,
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

    const parsed = z.array(PlantaDtoSchema).safeParse(response.data);
    if (!parsed.success) {
      console.error("❌ Backend violó contrato PlantaDto:", parsed.error.issues);
      backendContractError('plantas');
    }

    return parsed.data;
  },

  getPlantaById: async (id: string): Promise<PlantaDto> => {
    const response = await api.get(`/api/plantas/${id}`);

    const parsed = PlantaDtoSchema.safeParse(response.data);
    if (!parsed.success) {
      console.error("❌ Backend violó contrato PlantaDto (byId):", parsed.error.issues);
      backendContractError('planta', id);
    }

    return parsed.data;
  },

  getPlantEvents: async (id: string): Promise<BackendEvent[]> => {
    const response = await api.get(`/api/plantas/${id}/events`);
    return response.data;
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

    const parsed = z.array(SalaDtoSchema).safeParse(response.data);
    if (!parsed.success) {
      console.error("❌ Backend violó contrato SalaDto:", parsed.error.issues);
      backendContractError('salas');
    }

    return parsed.data;
  },

  getSalasDisponibles: async (): Promise<SalaDto[]> => {
    const response = await api.get('/api/salas/disponibles');

    const parsed = z.array(SalaDtoSchema).safeParse(response.data);
    if (!parsed.success) {
      console.error("❌ Backend violó contrato SalaDto (disponibles):", parsed.error.issues);
      backendContractError('salas', 'disponibles');
    }

    return parsed.data;
  },

  createSala: async (salaData: Partial<SalaDto>): Promise<SalaDto> => {
    const response = await api.post('/api/salas', salaData);
    return validateResponse(SalaDtoSchema, response.data, 'POST /api/salas');
  },

  updateSala: async (id: number, salaData: Partial<SalaDto>): Promise<SalaDto> => {
    const response = await api.put(`/api/salas/${id}`, salaData);
    return validateResponse(SalaDtoSchema, response.data, `PUT /api/salas/${id}`);
  },

  deleteSala: async (id: number): Promise<void> => {
    await api.delete(`/api/salas/${id}`);
  },

  // --- COLABORADORES ---
  getColaboradores: async (salaId: number): Promise<SalaColaboradorDto[]> => {
    const response = await api.get(`/api/salas/${salaId}/colaboradores`);
    const parsed = z.array(SalaColaboradorDtoSchema).safeParse(response.data);
    if (!parsed.success) {
      console.error("❌ Backend violó contrato SalaColaboradorDto:", parsed.error.issues);
      backendContractError('colaboradores', `sala/${salaId}`);
    }
    return parsed.data;
  },

  agregarColaborador: async (salaId: number, userId: number, tipoColaborador: string = "EDITOR"): Promise<SalaColaboradorDto> => {
    const response = await api.post(`/api/salas/${salaId}/colaboradores`, { userId, tipoColaborador });
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

    const parsed = z.array(CepaDtoSchema).safeParse(response.data);
    if (!parsed.success) {
      console.error("❌ Backend violó contrato CepaDto:", parsed.error.issues);
      backendContractError('cepas');
    }

    return parsed.data;
  },

  getCepasBySala: async (salaId: number): Promise<CepaDto[]> => {
    const response = await api.get(`/api/cepas/sala/${salaId}`);

    const parsed = z.array(CepaDtoSchema).safeParse(response.data);
    if (!parsed.success) {
      console.error("❌ Backend violó contrato CepaDto (bySala):", parsed.error.issues);
      backendContractError('cepas', `sala/${salaId}`);
    }

    return parsed.data;
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

    const parsed = z.array(NutrienteDtoSchema).safeParse(response.data);
    if (!parsed.success) {
      console.error("❌ Backend violó contrato NutrienteDto:", parsed.error.issues);
      backendContractError('nutrientes');
    }

    return parsed.data;
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

    const parsed = z.array(UserDtoSchema).safeParse(response.data);
    if (!parsed.success) {
      console.error("❌ Backend violó contrato UserDto:", parsed.error.issues);
      backendContractError('users');
    }

    return parsed.data;
  },

  // --- ADMIN: Get plants by userId (SUPER_ADMIN only) ---
  getPlantasByUserId: async (userId: number): Promise<PlantaDto[]> => {
    const response = await api.get(`/api/plantas/user/${userId}`);

    const parsed = z.array(PlantaDtoSchema).safeParse(response.data);
    if (!parsed.success) {
      console.error("❌ Backend violó contrato PlantaDto (byUserId):", parsed.error.issues);
      backendContractError('plantas', `user/${userId}`);
    }

    return parsed.data;
  },

  // --- PLANTAS BY SALA (bulk occupied cells) ---
  getPlantasBySala: async (salaId: number): Promise<PlantaDto[]> => {
    const response = await api.get(`/api/plantas/sala/${salaId}`);
    const parsed = z.array(PlantaDtoSchema).safeParse(response.data);
    if (!parsed.success) {
      console.error("❌ Backend violó contrato PlantaDto (bySala):", parsed.error.issues);
      backendContractError('plantas', `sala/${salaId}`);
    }
    return parsed.data;
  },

  // --- ZONAS ---
  getZonasBySala: async (salaId: number): Promise<ZonaDto[]> => {
    const response = await api.get(`/api/zonas/sala/${salaId}`);
    const parsed = z.array(ZonaDtoSchema).safeParse(response.data);
    if (!parsed.success) {
      console.error("❌ Backend violó contrato ZonaDto:", parsed.error.issues);
      backendContractError('zonas', `sala/${salaId}`);
    }
    return parsed.data;
  },

  getPlantasByZona: async (zonaId: number): Promise<PlantaDto[]> => {
    const response = await api.get(`/api/zonas/${zonaId}/plantas`);
    const parsed = z.array(PlantaDtoSchema).safeParse(response.data);
    if (!parsed.success) {
      console.error("❌ Backend violó contrato PlantaDto (byZona):", parsed.error.issues);
      backendContractError('plantas', `zona/${zonaId}`);
    }
    return parsed.data;
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
    const parsed = z.array(ZonaDtoSchema).safeParse(response.data);
    if (!parsed.success) {
      console.error("❌ Backend violó contrato ZonaDto (batch):", parsed.error.issues);
      backendContractError('zonas', 'batch');
    }
    return parsed.data;
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
    return response.data;
  },
};
