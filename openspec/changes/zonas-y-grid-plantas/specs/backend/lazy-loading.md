# Backend: LAZY Loading Migration — Cepa and Sala in Planta

## Purpose

Migrate `Cepa` and `Sala` relationships in `Planta` from `FetchType.EAGER` to `FetchType.LAZY`, and add `@EntityGraph` / `JOIN FETCH` queries where eager loading is actually needed to avoid `LazyInitializationException`.

## Requirements

### R-LAZY-001: Change Plenta's Cepa and Sala to LAZY

The `Planta` entity currently has:

```java
@ManyToOne(fetch = FetchType.EAGER)  // line 36
@JoinColumn(name = "cepa_id", nullable = false)
private Cepa cepa;

@ManyToOne(fetch = FetchType.EAGER)  // line 45
@JoinColumn(name = "sala_id", nullable = false)
private Sala sala;
```

Both MUST be changed to `FetchType.LAZY`:

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "cepa_id", nullable = false)
private Cepa cepa;

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "sala_id", nullable = false)
private Sala sala;
```

#### Scenario: Load Planta without Sala/Cepa access

- GIVEN a query that fetches Plantas (e.g., `findAll()`) with no `JOIN FETCH`
- WHEN the query executes
- THEN only the `planta` table is queried
- AND Sala and Cepa are loaded lazily on access

### R-LAZY-002: Add @EntityGraph or JOIN FETCH for Read Endpoints

The `PlantaRepository` MUST be extended with explicit fetch queries for endpoints that need Sala and Cepa data:

```java
@Query("SELECT p FROM Planta p JOIN FETCH p.sala JOIN FETCH p.cepa")
List<Planta> findAllWithSalaAndCepa();

@Query("SELECT p FROM Planta p JOIN FETCH p.sala JOIN FETCH p.cepa WHERE p.id = :id")
Optional<Planta> findByIdWithSalaAndCepa(@Param("id") Long id);

@Query("SELECT p FROM Planta p JOIN FETCH p.sala JOIN FETCH p.cepa WHERE p.user.id = :userId")
List<Planta> findByUserIdWithSalaAndCepa(@Param("userId") Long userId);

@Query("SELECT p FROM Planta p JOIN FETCH p.sala JOIN FETCH p.cepa WHERE p.sala.id = :salaId")
List<Planta> findBySalaIdWithSalaAndCepa(@Param("salaId") Long salaId);

@Query("SELECT p FROM Planta p JOIN FETCH p.sala JOIN FETCH p.cepa WHERE p.zonaId = :zonaId")
List<Planta> findByZonaIdWithSalaAndCepa(@Param("zonaId") Long zonaId);
```

#### Scenario: GET all plantas with Sala and Cepa

- GIVEN the `getAllPlantas()` service method
- WHEN `findAllWithSalaAndCepa()` is used
- THEN a single SQL query fetches plantas + sala + cepa via JOINs
- AND no N+1 queries occur

### R-LAZY-003: Update Service Methods to Use Fetch Queries

The `PlantaService` MUST be updated to use the explicit fetch queries in all methods that return `PlantaDto` (which includes nested `sala` and `cepaDto`):

| Current Method | New Query |
|---------------|-----------|
| `getAllPlantas()` → `plantaRepository.findAll()` | `findAllWithSalaAndCepa()` |
| `getPlantaById()` → `findByIdWithEvents()` | Keep `findByIdWithEvents` but add JOIN FETCH for sala and cepa |
| `plantasPorSala()` → `findBySalaId()` | `findBySalaIdWithSalaAndCepa()` |
| `getPlantasByUserId()` → `findByUserId()` | `findByUserIdWithSalaAndCepa()` |

- The `findByIdWithEvents()` method MUST also be updated to fetch Sala and Cepa eagerly:
  ```java
  @Query("SELECT p FROM Planta p LEFT JOIN FETCH p.events JOIN FETCH p.sala JOIN FETCH p.cepa WHERE p.id = :id")
  ```

#### Scenario: Planta detail with events, sala, and cepa

- GIVEN a plant detail view that needs events, sala, and cepa
- WHEN `findByIdWithEvents()` is updated with JOIN FETCH for sala and cepa
- THEN a single query fetches all data
- AND no LAZY loading exception occurs when building `PlantaDto`

### R-LAZY-004: Verify DtoMapper Does Not Cause LazyExceptions

The `DtoMapper.plantaToPlantaDto()` accesses:

```java
planta.getUser().getId()       // LAZY — but only id, Hibernate can proxy
planta.getSala().getId()       // needs fetch
planta.getSala().getNombre()   // needs fetch
planta.getCepa().getId()       // needs fetch
planta.getCepa().getGeneticaParental()  // needs fetch
planta.getEvents()             // needs fetch
```

All service methods that call `plantaToPlantaDto()` MUST use fetch queries that ensure these relationships are loaded within the transaction.

#### Scenario: LazyInitializationException prevented

- GIVEN a service method annotated with `@Transactional(readOnly = true)`
- WHEN it uses a fetch query that loads all needed relationships
- THEN `plantaToPlantaDto()` accesses all fields within the open transaction
- AND no `LazyInitializationException` is thrown

### R-LAZY-005: Integration Test Coverage

After LAZY migration, integration tests MUST verify:

1. All existing endpoints return the same data as before (no regression).
2. No `LazyInitializationException` occurs for any endpoint.
3. Query count is N+1-free for list endpoints (at most 1 query per list call).
