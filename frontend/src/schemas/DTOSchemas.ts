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
});

// SalaDto - Alineado 100% con Backend
export const SalaDtoSchema = z.object({
    id: z.number(),
    nombre: z.string().min(1),
    descripcion: z.string().nullable().optional(),
    userId: z.number(),
    horasLuz: z.string().nullable().optional(),
    humedad: z.number().nullable().optional(),
    temperaturaAmbiente: z.number().nullable().optional(),
    plantaIds: z.array(z.number()).optional().default([]),
    // Nuevo: Tipo de ambiente (determina imagen default de plantas)
    tipoAmbiente: z.enum(['INTERIOR', 'EXTERIOR']).nullable().optional(),
    // Nuevo: URL de imagen personalizada para la sala
    imagenUrl: z.string().nullable().optional(),
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
    username: z.string().email(),  // Backend requiere formato email
    nombre: z.string().nullable().optional(),
    apellido: z.string().nullable().optional(),
    rol: z.enum(['ROLE_GROWER', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN']),  // Enum AppRole del backend
    fechaRegistro: z.string(),  // ISO date yyyy-MM-dd
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
