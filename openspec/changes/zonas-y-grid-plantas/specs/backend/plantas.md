# Backend: Plantas — Grid Fields and Location Endpoints

## Purpose

Add grid-positioning fields (`zonaId`, `columnaEnZona`, `filaEnZona`) to the `Planta` entity, create endpoints for querying plants by zone and updating a plant's location, and keep the existing `ubicacion` field as a generated/display string.

## Requirements

### R-PLANTA-001: Grid Fields on Planta Entity

The `Planta` entity MUST be extended with:

| Field | Type | Constraints |
|-------|------|-------------|
| zonaId | Long | FK → Zona, nullable (backward-compatible) |
| columnaEnZona | Integer | nullable, 1-based |
| filaEnZona | Integer | nullable, 1-based |

- All three fields MUST be nullable to support existing plants that have no zone assignment (`ubicacion` free-text retained).
- No JPA relationship to Zona — these are plain columns.
- The existing `ubicacion` (String, nullable) MUST be retained as a computed/display field.

#### Scenario: New plant with zone assignment

- GIVEN a new Planta with `zonaId = 1`, `columnaEnZona = 2`, `filaEnZona = 3`
- WHEN the plant is persisted
- THEN the grid fields are stored in the database
- AND the columns are named `zona_id`, `columna_en_zona`, `fila_en_zona`

#### Scenario: Existing plant without zone (backward compat)

- GIVEN an existing plant with no `zonaId`
- WHEN the plant is loaded
- THEN `zonaId`, `columnaEnZona`, `filaEnZona` are null
- AND `ubicacion` still contains the original free-text value
- AND all existing queries and mappings continue to work

### R-PLANTA-002: Grid Fields on PlantaDto

The `PlantaDto` MUST be extended with:

| Field | Type |
|-------|------|
| zonaId | Long (nullable) |
| columnaEnZona | Integer (nullable) |
| filaEnZona | Integer (nullable) |

- Existing plants with null grid fields MUST serialize these as JSON null.

### R-PLANTA-003: DtoMapper Grid Fields

- `plantaToPlantaDto`: MUST map `zonaId`, `columnaEnZona`, `filaEnZona` from entity to DTO.
- `plantaDtoToPlanta`: MUST map `zonaId`, `columnaEnZona`, `filaEnZona` from DTO to entity.

### R-PLANTA-004: GET /api/zonas/{zonaId}/plantas

The system MUST expose a new endpoint:

`GET /api/zonas/{zonaId}/plantas`

| Aspect | Detail |
|--------|--------|
| Controller | PlantaController (or ZonaController — architectural decision) |
| Auth | `@PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")` |
| Returns | `List<PlantaDto>` |
| Behavior | Returns all plants whose `zonaId` matches, filtered by user's access |

- The service MUST verify the user has access to the Zona's parent Sala.
- For GROWER: only returns plants in that zone that belong to the user.
- For ADMIN/SUPER_ADMIN: returns all plants in that zone.

#### Scenario: GROWER gets plants in own zone

- GIVEN a GROWER user with 3 plants in Zona #1 (all owned by them)
- WHEN GET `/api/zonas/1/plantas`
- THEN HTTP 200 is returned
- AND the response contains 3 plants

#### Scenario: GROWER tries to access other's zone

- GIVEN a GROWER user who does NOT own Sala of Zona #1
- WHEN GET `/api/zonas/1/plantas`
- THEN HTTP 403 is returned

#### Scenario: Empty zone

- GIVEN a Zona with no plants
- WHEN GET `/api/zonas/{zonaId}/plantas`
- THEN HTTP 200 is returned with an empty array

### R-PLANTA-005: PUT /api/plantas/{id}/ubicacion (Location Rotation)

The system MUST expose:

`PUT /api/plantas/{id}/ubicacion`

| Aspect | Detail |
|--------|--------|
| Controller | PlantaController |
| Auth | `@PreAuthorize("hasAnyRole('GROWER', 'ADMIN', 'SUPER_ADMIN')")` |
| Request Body | `{ "zonaId": 1, "columnaEnZona": 3, "filaEnZona": 1 }` |
| Returns | Updated `PlantaDto` |
| Behavior | Updates the plant's grid position AND regenerates `ubicacion` string |

- MUST validate ownership of the plant (same rules as existing `checkOwnership`).
- MUST validate that the target cell is not occupied by another plant (occupied = existing plant with same `zonaId`, `columnaEnZona`, `filaEnZona`).
- MUST auto-generate the `ubicacion` string as `{abreviatura}-Z{zonaId}-C{columna}-F{fila}`.
- If `zonaId` is null in the request, MUST clear grid fields and set `ubicacion` to null (de-assign from grid).

#### Scenario: Move plant to free cell

- GIVEN a plant in Zona #1, cell (2,1)
- WHEN PUT `/api/plantas/1/ubicacion` with `{ zonaId: 1, columnaEnZona: 3, filaEnZona: 2 }`
- AND cell (3,2) is unoccupied
- THEN the plant's position is updated
- AND `ubicacion` is regenerated
- AND HTTP 200 is returned

#### Scenario: Move plant to occupied cell fails

- GIVEN another plant already in Zona #1 at cell (3,2)
- WHEN PUT `/api/plantas/1/ubicacion` with `{ zonaId: 1, columnaEnZona: 3, filaEnZona: 2 }`
- THEN HTTP 409 Conflict is returned
- AND a meaningful error message says "Cell already occupied"

#### Scenario: GROWER cannot move another's plant

- GIVEN a GROWER user who does NOT own Planta #5
- WHEN PUT `/api/plantas/5/ubicacion`
- THEN HTTP 403 is returned

#### Scenario: De-assign from grid

- GIVEN a plant currently assigned to Zona #1 at cell (2,1)
- WHEN PUT `/api/plantas/1/ubicacion` with `{ zonaId: null, columnaEnZona: null, filaEnZona: null }`
- THEN grid fields are set to null
- AND `ubicacion` is set to null
- AND HTTP 200 is returned

### R-PLANTA-006: PlantaRepository Grid Queries

The `PlantaRepository` MUST be extended with:

- `List<Planta> findByZonaId(Long zonaId)` — filtered list (service handles per-user filtering)
- `Optional<Planta> findByZonaIdAndColumnaEnZonaAndFilaEnZona(Long zonaId, Integer columna, Integer fila)` — to check occupied cells
