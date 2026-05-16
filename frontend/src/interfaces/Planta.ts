/**
 * TypeScript Types - Backend-First Approach
 * 
 * ✅ USO RECOMENDADO: Types inferidos de Zod schemas
 * 
 * import { PlantaDto, SalaDto, CepaDto, UserDto } from '@/schemas/DTOSchemas';
 * 
 * Razón: Schema Zod es la fuente de verdad con validación runtime
 */

// ✅ Re-exportar types de Zod schemas (ÚNICA forma de tipar)
export type {
  PlantaDto,
  SalaDto,
  CepaDto,
  UserDto,  // ✅ NUEVO (Sprint 2.2)
  NutrienteDto,  // ✅ NUEVO (Sprint 4 - Bloque 1)
  PlantEventDto,
  ZonaDto,  // ✅ NUEVO (Sprint zonas-y-grid-plantas)
  SalaColaboradorDto,  // ✅ NUEVO (colaboradores)
} from '@/schemas/DTOSchemas';

