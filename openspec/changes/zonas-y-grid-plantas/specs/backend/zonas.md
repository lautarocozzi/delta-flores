# Backend: Zonas — Zona Entity, CRUD, and Sala Relationship

## Purpose

Define the Zona entity, its relationship with Sala, and the complete CRUD REST API. The Zona replaces the concept of "free-text ubicacion" with a structured grid division within a Sala, enabling visual zone-grid selection on the frontend.

## Requirements

### R-ZONAS-001: Zona Entity

The system MUST include a `Zona` JPA entity with the following fields:

| Field | Type | Constraints |
|-------|------|-------------|
| id | Long (auto-generated, identity) | PK, NOT NULL |
| salaId | Long (FK → Sala) | NOT NULL, indexed |
| nombre | String | NOT NULL, e.g. "Zona A", "Mesa 1" |
| posicionX | int | X position in the sala layout grid |
| posicionY | int | Y position in the sala layout grid |
| columnas | int | Number of columns in this zone |
| filas | int | Number of rows in this zone |

- The entity MUST be mapped to a `zonas` table.
- MUST have a `@ManyToOne(fetch = FetchType.LAZY)` relationship to `Sala`, mapped by `salaId`.
- MUST NOT have a direct relationship to `Planta` — plants reference the zone via `zonaId` (see `backend/plantas.md`).

#### Scenario: Zona entity creation

- GIVEN a Sala exists in the database
- WHEN a Zona is created with `salaId`, `nombre`, `posicionX`, `posicionY`, `columnas`, `filas`
- THEN the entity is persisted to the `zonas` table
- AND all fields are stored correctly
- AND the Zona can be retrieved by its ID

#### Scenario: Zona requires mandatory fields

- GIVEN a Zona creation attempt
- WHEN `nombre` is null/empty, `columnas` ≤ 0, or `filas` ≤ 0
- THEN the operation MUST fail with a validation error
- AND the entity MUST NOT be persisted

### R-ZONAS-002: Sala-Zona OneToMany Relationship

The `Sala` entity MUST be extended with:

```java
@OneToMany(mappedBy = "sala", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
private List<Zona> zonas = new ArrayList<>();
```

- When a Sala is deleted, all its Zonas MUST be cascade-deleted.
- The `SalaDto` MUST include a `List<ZonaDto> zonas` field.

#### Scenario: Sala zones cascade

- GIVEN a Sala with 3 Zonas
- WHEN the Sala is deleted
- THEN all 3 Zonas are also deleted from the `zonas` table
- AND no orphan Zona rows remain

### R-ZONAS-003: ZonaDto

The system MUST include a `ZonaDto` with:

| Field | Type |
|-------|------|
| id | Long |
| salaId | Long |
| nombre | String |
| posicionX | int |
| posicionY | int |
| columnas | int |
| filas | int |

- MUST have a no-arg constructor.
- MUST NOT include a nested SalaDto (avoids circular serialization).

### R-ZONAS-004: DtoMapper Zona Mapping

The `DtoMapper` MUST be extended with:

- `zonaToZonaDto(Zona zona)`: maps all fields including `salaId` from the Zona's Sala relationship.
- `zonaDtoToZona(ZonaDto dto, Zona zona)`: maps all fields from DTO to entity.

#### Scenario: Zona mapper preserves salaId

- GIVEN a Zona entity linked to a Sala with id = 5
- WHEN `zonaToZonaDto(zona)` is called
- THEN the resulting ZonaDto has `salaId = 5`

### R-ZONAS-005: ZonaRepository

MUST include a `ZonaRepository` extending `JpaRepository<Zona, Long>` with:

- `List<Zona> findBySalaId(Long salaId)` — finds all zones for a sala
- `Optional<Zona> findById(Long id)` — already from JpaRepository

### R-ZONAS-006: ZonaService

MUST include `ZonaService` with:

| Method | Description | Auth |
|--------|-------------|------|
| `getZonasBySala(Long salaId)` | Returns all Zonas for a Sala | Checks Sala ownership; admin bypass |
| `getZonaById(Long id)` | Returns single Zona | Checks Sala ownership via Zona's sala |
| `createZona(ZonaDto)` | Creates a new Zona | Checks Sala ownership |
| `updateZona(Long id, ZonaDto)` | Updates an existing Zona | Checks Sala ownership |
| `deleteZona(Long id)` | Deletes a Zona | Checks Sala ownership |

- ALL operations MUST verify that the current user owns the parent Sala (or is admin).
- Uses the same ownership pattern as `SalaService.checkOwnership()`.

#### Scenario: GROWER creates Zona in own Sala

- GIVEN a GROWER user who owns Sala #1
- WHEN they POST `/api/zonas` with `{ salaId: 1, nombre: "Zona A", posicionX: 0, posicionY: 0, columnas: 3, filas: 2 }`
- THEN the Zona is created
- AND HTTP 201 is returned

#### Scenario: GROWER cannot create Zona in another's Sala

- GIVEN a GROWER user who does NOT own Sala #2
- WHEN they POST `/api/zonas` with `salaId: 2`
- THEN the operation MUST fail with 403 Forbidden

#### Scenario: ADMIN bypasses ownership

- GIVEN an ADMIN or SUPER_ADMIN user
- WHEN they create, read, update, or delete a Zona for ANY Sala
- THEN the operation succeeds (admin bypass)

### R-ZONAS-007: ZonaController

MUST include `ZonaController` at `/api/zonas`:

| Method | Endpoint | Auth | Returns |
|--------|----------|------|---------|
| GET | `/api/zonas/sala/{salaId}` | Any authenticated | `List<ZonaDto>` |
| GET | `/api/zonas/{id}` | Any authenticated | `ZonaDto` |
| POST | `/api/zonas` | Any authenticated | `ZonaDto` (201) |
| PUT | `/api/zonas/{id}` | Any authenticated | `ZonaDto` |
| DELETE | `/api/zonas/{id}` | Any authenticated | 204 No Content |

- All endpoints MUST be annotated with `@PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")`.
- Standard error handling: 404 for not found, 403 for access denied, 500 for unexpected.

#### Scenario: GET zonas by sala returns empty list

- GIVEN a Sala with no Zonas defined
- WHEN GET `/api/zonas/sala/1` is called
- THEN HTTP 200 is returned
- AND the body is an empty JSON array `[]`

#### Scenario: GET zona by ID not found

- GIVEN no Zona exists with id = 999
- WHEN GET `/api/zonas/999` is called
- THEN HTTP 404 is returned

### R-ZONAS-008: Ubicacion Auto-Generation Format

The system MUST generate ubicacion strings in the format `{cepa.abreviatura}-Z{zonaId}-C{col}-F{fila}` whenever a plant is placed in a zone cell.

This format MUST be used:
- On plant creation via ZoneGrid selection (frontend computes and sends `ubicacion`).
- On PUT `/api/plantas/{id}/ubicacion` (backend generates or validates the format).

#### Scenario: Ubicacion format validation

- GIVEN a plant in Zona #3, column 2, row 1, with Cepa abreviatura "OGK"
- WHEN the ubicacion is generated
- THEN it MUST be `OGK-Z3-C2-F1`

#### Scenario: Ubicacion with single digits

- GIVEN a plant in Zona #12, column 1, row 1, with Cepa abreviatura "AK"
- WHEN the ubicacion is generated
- THEN it MUST be `AK-Z12-C1-F1`
