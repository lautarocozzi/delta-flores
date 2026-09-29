import { z } from 'zod';

/**
 * Schemas Zod 100% alineados con Backend DTOs
 * BACKEND-FIRST: Definidos exactamente como PlantaDto.java, SalaDto.java, CepaDto.java
 */

// PlantaDto - Alineado con /delta-flores/web/src/main/java/DeltaFlores/web/dto/PlantaDto.java
export const PlantaDtoSchema = z.object({
    id: z.number(),
    userId: z.number().optional(),
    nombre: z.string().min(1, "Nombre requerido"),
    isPublic: z.boolean().optional().default(false),
    etapa: z.enum(['GERMINACION', 'PLANTIN', 'VEGETACION', 'FLORACION', 'COSECHADA']),
    salaId: z.number(),
    produccion: z.number(),
    fechaCreacion: z.string(), // ISO date "yyyy-MM-dd"
    fechaFin: z.string().nullable().optional(),
    eventIds: z.array(z.number()).nullable().optional(),
    cepaId: z.number(),
    ubicacion: z.string().nullable().optional(),

    // Relaciones anidadas (solo para GET /plantas/{id} detallado)
    sala: z.object({
        id: z.number(),
        nombre: z.string(),
        tipoAmbiente: z.enum(['INTERIOR', 'EXTERIOR']).nullable().optional(),
    }).nullable().optional(),

    cepaDto: z.object({
        id: z.number(),
        geneticaParental: z.string(),
        abreviatura: z.string().nullable().optional(),
    }).nullable().optional(),

    // Zona fields — nullable para backward compat con plantas sin zona asignada
    zonaId: z.number().nullable().optional(),
    zonaNombre: z.string().nullable().optional(),
    columnaEnZona: z.number().nullable().optional(),
    filaEnZona: z.number().nullable().optional(),

    // Optional photo URL per plant
    imagenUrl: z.string().nullable().optional(),

    // Enriched: number of users who favorited this plant
    favoriteCount: z.number().optional().default(0),
});

// SalaDto - Alineado 100% con Backend
export const SalaDtoSchema = z.object({
    id: z.number(),
    nombre: z.string().min(1),
    descripcion: z.string().nullable().optional(),
    userId: z.number(),
    ownerUsername: z.string().nullable().optional(),
    horasLuz: z.string().nullable().optional(),
    humedad: z.number().nullable().optional(),
    temperaturaAmbiente: z.number().nullable().optional(),
    plantaIds: z.array(z.number()).optional().default([]),
    isPublic: z.boolean().optional().default(false),
    isPinned: z.boolean().optional().default(false),
    fechaModificacion: z.string().nullable().optional(),
    // Nuevo: Tipo de ambiente (determina imagen default de plantas)
    tipoAmbiente: z.enum(['INTERIOR', 'EXTERIOR']).nullable().optional(),
    // Nuevo: URL de imagen personalizada para la sala
    imagenUrl: z.string().nullable().optional(),
    // Tipo de colaboración del usuario actual (EDITOR/LECTURA, null si es owner)
    tipoColaborador: z.string().nullable().optional(),
});

// CepaDto - Alineado 100% con Backend (análisis líneas 98-107)
export const CepaDtoSchema = z.object({
    id: z.number(),
    geneticaParental: z.string().min(1),
    abreviatura: z.string().nullable().optional(),  // nullable-first, will become required later
    dominancia: z.string().nullable().optional(),  // camelCase (backend tiene bug PascalCase pendiente fix)
    aromaSabor: z.string().nullable().optional(),  // camelCase (backend tiene bug PascalCase pendiente fix)
    thc: z.string().nullable().optional(),
    cbd: z.string().nullable().optional(),
    detalle: z.string().nullable().optional(),
    userId: z.number().nullable().optional(),  // ✅ AGREGADO (análisis línea 369)
});

// UserDto - Alineado con Backend (análisis líneas 110-118)
// ✅ NUEVO SCHEMA (resuelve problema análisis línea 391)
export const UserDtoSchema = z.object({
    id: z.number(),
    username: z.string().nullable().optional(),
    email: z.string().email().nullable().optional(),
    nombre: z.string().nullable().optional(),
    apellido: z.string().nullable().optional(),
    imagenUrl: z.string().nullable().optional(),
    rol: z.string(),
    fechaRegistro: z.string(),
});

// PlantEventDto (si se necesita)
export const PlantEventDtoSchema = z.object({
    id: z.number(),
    plantaId: z.number(),
    eventType: z.string(),
    timestamp: z.string(),
});

// Exportar types inferidos de schemas
export type PlantaDto = z.infer<typeof PlantaDtoSchema>;
export type SalaDto = z.infer<typeof SalaDtoSchema>;
export type CepaDto = z.infer<typeof CepaDtoSchema>;
export type UserDto = z.infer<typeof UserDtoSchema>;  // ✅ NUEVO TYPE
export type PlantEventDto = z.infer<typeof PlantEventDtoSchema>;

// NutrienteDto - Alineado con Backend
export const NutrienteDtoSchema = z.object({
    id: z.number(),
    titulo: z.string().min(1, "Título requerido"),
    descripcion: z.string(),
});

// ZonaDto - Alineado con Backend ZonaDto.java
export const ZonaDtoSchema = z.object({
    id: z.number(),
    salaId: z.number(),
    salaNombre: z.string().optional(),
    nombre: z.string().min(1),
    posicionX: z.number().int().min(0).max(100).refine(val => val % 5 === 0, "posicionX debe ser múltiplo de 5"),
    posicionY: z.number().int().min(0).max(100).refine(val => val % 5 === 0, "posicionY debe ser múltiplo de 5"),
    columnas: z.number().int().min(1).max(20),
    filas: z.number().int().min(1).max(20),
    plantaIds: z.array(z.number()).optional(),
});

export type ZonaDto = z.infer<typeof ZonaDtoSchema>;
export type NutrienteDto = z.infer<typeof NutrienteDtoSchema>;

// SalaColaboradorDto - Alineado con Backend
export const SalaColaboradorDtoSchema = z.object({
    id: z.number(),
    salaId: z.number(),
    salaNombre: z.string(),
    userId: z.number(),
    userNombre: z.string(),
    userApellido: z.string(),
    userUsername: z.string(),
    tipoColaborador: z.string(),
});

export type SalaColaboradorDto = z.infer<typeof SalaColaboradorDtoSchema>;

// DeviceSessionGroupDto - Alineado con Backend DeviceSessionGroupDto.java
export const DeviceSessionGroupSchema = z.object({
    deviceKey: z.string(),       // SHA-256 hash of userAgent for grouping
    browser: z.string(),
    os: z.string(),
    ipAddress: z.string().nullable(),
    lastActive: z.string(),      // ISO 8601
    isCurrent: z.boolean(),
    sessionCount: z.number(),
    sessionIds: z.array(z.string()), // UUIDs
});

export type DeviceSessionGroup = z.infer<typeof DeviceSessionGroupSchema>;

// ─── Comunidad / Posts ─────────────────────────────────────

export const PostDtoSchema = z.object({
    id: z.number(),
    titulo: z.string(),
    contenido: z.string(),
    contenidoPreview: z.string().nullable().optional(),
    tipoPost: z.enum(['DEBATE', 'GUIA']),
    categoria: z.enum(['CULTIVO', 'NUTRICION', 'EQUIPAMIENTO', 'GENETICA', 'GASTRONOMIA', 'PRODUCTOS_HEMP']),
    isResuelto: z.boolean(),
    isHero: z.boolean(),
    vistas: z.number(),
    userId: z.number(),
    userUsername: z.string().nullable().optional(),
    userNombre: z.string().nullable().optional(),
    userApellido: z.string().nullable().optional(),
    userImagenUrl: z.string().nullable().optional(),
    upCount: z.number(),
    downCount: z.number(),
    score: z.number(),
    replyCount: z.number(),
    currentUserVote: z.enum(['UP', 'DOWN']).nullable().optional(),
    fechaCreacion: z.string(),
});

export const PostReplyDtoSchema = z.object({
    id: z.number(),
    contenido: z.string(),
    postId: z.number(),
    userId: z.number(),
    userUsername: z.string().nullable().optional(),
    userNombre: z.string().nullable().optional(),
    userApellido: z.string().nullable().optional(),
    userImagenUrl: z.string().nullable().optional(),
    isSolucion: z.boolean(),
    upCount: z.number(),
    downCount: z.number(),
    score: z.number(),
    currentUserVote: z.enum(['UP', 'DOWN']).nullable().optional(),
    fechaCreacion: z.string(),
});

export const PostDetailDtoSchema = PostDtoSchema.extend({
    replies: z.array(PostReplyDtoSchema),
});

export const TopPlantaDtoSchema = z.object({
    plantaId: z.number(),
    plantaNombre: z.string().nullable().optional(),
    plantaImagenUrl: z.string().nullable().optional(),
    cepaNombre: z.string().nullable().optional(),
    favoriteCount: z.number(),
    userId: z.number().nullable().optional(),
    userUsername: z.string().nullable().optional(),
});

export type PostDto = z.infer<typeof PostDtoSchema>;
export type PostReplyDto = z.infer<typeof PostReplyDtoSchema>;
export type PostDetailDto = z.infer<typeof PostDetailDtoSchema>;
export type TopPlantaDto = z.infer<typeof TopPlantaDtoSchema>;

// TareaProgramadaDto - Tareas programadas
export const TareaProgramadaDtoSchema = z.object({
    id: z.number().optional(),
    titulo: z.string(),
    descripcion: z.string().optional().default(''),
    recurrencia: z.enum(['NINGUNA', 'DIARIA', 'SEMANAL', 'MENSUAL']),
    fechaProgramada: z.string(),
    fechaProximaEjecucion: z.string().nullable().optional(),
    activa: z.boolean(),
    isActiva: z.boolean().optional(),
    fechaCreacion: z.string().optional(),
    creadorId: z.number().optional(),
    creadorUsername: z.string().optional(),
    usuarioDestinoId: z.number().optional(),
    usuarioDestinoUsername: z.string().optional(),
    salaAsociadaId: z.number().nullable().optional(),
    salaAsociadaNombre: z.string().nullable().optional(),
    plantaAsociadaId: z.number().nullable().optional(),
    plantaAsociadaNombre: z.string().nullable().optional(),
    colaboradorAsignadoId: z.number().nullable().optional(),
    colaboradorAsignadoUsername: z.string().nullable().optional(),
    colaboradorAsignadoNombre: z.string().nullable().optional(),
});

export type TareaProgramadaDto = z.infer<typeof TareaProgramadaDtoSchema>;

// ColaboradorInfoDto - Info de colaborador para asignación de tareas
export const ColaboradorInfoDtoSchema = z.object({
    id: z.number(),
    salaId: z.number(),
    salaNombre: z.string(),
    userId: z.number(),
    userNombre: z.string().nullable().optional(),
    userApellido: z.string().nullable().optional(),
    userUsername: z.string(),
    tipoColaborador: z.string(),
});

export type ColaboradorInfoDto = z.infer<typeof ColaboradorInfoDtoSchema>;
