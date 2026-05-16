# Testing: Integration Tests

## Purpose

Add integration tests covering the new Zona CRUD, plant location rotation, admin bypass for CepaService, and the LAZY loading migration to verify no regressions and no N+1 queries.

## Requirements

### R-TEST-001: Zona CRUD Integration Tests

MUST cover:

| Test | Scenario |
|------|----------|
| Create Zona | GROWER creates Zona in own Sala → 201 |
| Create Zona forbidden | GROWER creates Zona in other's Sala → 403 |
| Get Zonas by Sala | Returns all Zonas for a given Sala |
| Get Zonas by Sala empty | Returns `[]` for Sala with no Zonas |
| Get Zona by ID | Returns single Zona |
| Get Zona by ID not found | 404 |
| Update Zona | GROWER updates own Zona |
| Delete Zona | GROWER deletes own Zona → 204 |
| Delete Zona cascade | Deleting Sala cascades to Zonas |
| Admin bypass | ADMIN creates/reads/updates/deletes Zona in any Sala |

### R-TEST-002: Plant Location Rotation Tests

MUST cover:

| Test | Scenario |
|------|----------|
| Update ubicacion | Move plant to free cell → 200 + updated planta |
| Cell already occupied | Move to occupied cell → 409 |
| De-assign from grid | Set zonaId to null → 200, ubicacion = null |
| Unauthorized move | GROWER moves another's plant → 403 |
| Get Plantas by Zona | Returns plants in that zone |
| Get Plantas by Zona empty | Returns `[]` for Zona with no plants |

### R-TEST-003: Admin Bypass for CepaService

MUST cover:

| Test | Scenario |
|------|----------|
| Admin sees all cepas | ADMIN calls GET /api/cepas → sees cepas from ALL users |
| Grower sees only own | GROWER calls GET /api/cepas → sees only own cepas |
| SUPER_ADMIN sees all | SUPER_ADMIN calls GET /api/cepas → sees ALL cepas |

### R-TEST-004: LAZY Loading Regression Tests

MUST verify:

| Test | Scenario |
|------|----------|
| GET /api/plantas | All plantas include sala and cepa data (no LazyInitException) |
| GET /api/plantas/{id} | Single planta includes events, sala, cepa |
| GET /api/plantas/sala/{salaId} | Plantas by sala include sala and cepa |
| GET /api/zonas/{zonaId}/plantas | Plantas by zona include sala and cepa |
| N+1 prevention | GET /api/plantas executes at most 1 query (verified via SQL logging or query count assertion) |

### R-TEST-005: Cepa abreviatura Tests

| Test | Scenario |
|------|----------|
| Create with abreviatura | New Cepa with abreviatura → 201 |
| Create without abreviatura | Missing abreviatura → validation error |
| Update with abreviatura | Update existing Cepa's abreviatura → 200 |
| Cepa list includes abreviatura | GET /api/cepas returns abreviatura field |
| Ubicacion format | Plant in zone generates correct ubicacion string using abreviatura |

### R-TEST-006: Test Configuration

- Tests MUST use `@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)` or `@DataJpaTest` + `@WebMvcTest` as appropriate.
- MUST use a test database (H2 in-memory or test PostgreSQL container).
- Auth: MUST use `@WithMockUser` or a test security utility to simulate different roles.
- Setup: MUST create test fixtures for User, Sala, Zona, Cepa, and Planta.

#### Scenario: Test creates full fixture chain

- GIVEN a test setup that creates: User → Sala → Zona → Cepa → Planta
- WHEN the Planta is created with `zonaId = zona.getId()`
- THEN all entities exist and are linked
- AND the test can verify grid fields and ubicacion format
