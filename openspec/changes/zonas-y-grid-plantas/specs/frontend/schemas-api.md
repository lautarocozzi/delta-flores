# Frontend: Schemas and API Layer — Updated Zod Schemas and New API Methods

## Purpose

Update Zod schemas (`DTOSchemas.ts`) for the new and modified DTOs, add new API methods to `api.ts`, and fix the role check bug in `PlantasPage.tsx`.

## Requirements

### R-FS-001: Updated CepaDtoSchema with abreviatura

The `CepaDtoSchema` in `DTOSchemas.ts` MUST be extended with:

```typescript
abreviatura: z.string().min(1, "Abreviatura requerida").max(10),
```

#### Scenario: CepaDto validation passes with abreviatura

- GIVEN a backend response with `{ ..., "abreviatura": "OGK" }`
- WHEN parsed with `CepaDtoSchema`
- THEN validation succeeds

#### Scenario: CepaDto validation fails without abreviatura

- GIVEN a backend response without `abreviatura`
- WHEN parsed with `CepaDtoSchema`
- THEN validation fails

### R-FS-002: New ZonaDtoSchema

MUST be added to `DTOSchemas.ts`:

```typescript
export const ZonaDtoSchema = z.object({
  id: z.number(),
  salaId: z.number(),
  nombre: z.string().min(1),
  posicionX: z.number().int().min(0),
  posicionY: z.number().int().min(0),
  columnas: z.number().int().min(1),
  filas: z.number().int().min(1),
});

export type ZonaDto = z.infer<typeof ZonaDtoSchema>;
```

- MUST be exported from `/interfaces/Planta.ts` for consistency:
  ```typescript
  export type { ZonaDto } from '@/schemas/DTOSchemas';
  ```

### R-FS-003: Updated PlantaDtoSchema with Grid Fields

The `PlantaDtoSchema` MUST be extended with:

```typescript
zonaId: z.number().nullable().optional(),
columnaEnZona: z.number().int().nullable().optional(),
filaEnZona: z.number().int().nullable().optional(),
```

### R-FS-004: Updated SalaDtoSchema with Zonas

The `SalaDtoSchema` MUST be extended with:

```typescript
zonas: z.array(ZonaDtoSchema).optional().default([]),
```

### R-FS-005: New API Methods in apiService

The `apiService` object in `api.ts` MUST be extended with:

| Method | Endpoint | Returns |
|--------|----------|---------|
| `getZonasBySala(salaId)` | GET `/api/zonas/sala/{salaId}` | `ZonaDto[]` |
| `getZonaById(id)` | GET `/api/zonas/{id}` | `ZonaDto` |
| `createZona(data)` | POST `/api/zonas` | `ZonaDto` |
| `updateZona(id, data)` | PUT `/api/zonas/{id}` | `ZonaDto` |
| `deleteZona(id)` | DELETE `/api/zonas/{id}` | void |
| `getPlantasByZona(zonaId)` | GET `/api/zonas/{zonaId}/plantas` | `PlantaDto[]` |
| `updateUbicacion(plantaId, data)` | PUT `/api/plantas/{id}/ubicacion` | `PlantaDto` |

#### Implementation Pattern

Each method MUST follow the existing contract validation pattern:

```typescript
getZonasBySala: async (salaId: number): Promise<ZonaDto[]> => {
  const response = await api.get(`/api/zonas/sala/${salaId}`);
  const parsed = z.array(ZonaDtoSchema).safeParse(response.data);
  if (!parsed.success) {
    console.error("❌ Backend violó contrato ZonaDto:", parsed.error.issues);
    backendContractError('zonas', `sala/${salaId}`);
  }
  return parsed.data;
},
```

### R-FS-006: Fix Role Check in PlantasPage.tsx

The following line in `PlantasPage.tsx`:

```typescript
const isSuperAdmin = user?.role === "SUPER_ADMIN";
```

MUST be changed to:

```typescript
const isSuperAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";
```

This ensures both ROLE_ADMIN and ROLE_SUPER_ADMIN can use the admin user-selector dropdown.

#### Scenario: Admin user sees user selector on PlantasPage

- GIVEN the fix is applied
- WHEN a user with role "ADMIN" visits PlantasPage
- THEN the `<Select>` with user list IS rendered
- AND the user can filter plants by other users

#### Scenario: Grower user still does not see selector

- GIVEN the fix is applied
- WHEN a user with role "GROWER" visits PlantasPage
- THEN the user selector is NOT rendered
- AND no regressions occur
