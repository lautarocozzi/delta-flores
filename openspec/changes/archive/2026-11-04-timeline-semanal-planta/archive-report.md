# Archive Report — `timeline-semanal-planta`

**Change**: `timeline-semanal-planta`
**Archivado**: 2026-11-04
**Rama**: `feature/backend-frontend` (working tree sin commit)
**Veredicto de verificación**: **PASS WITH WARNINGS**
**Modo de artefactos**: `openspec`

---

## 1. Qué se entregó

Timeline semanal real para `/plant/:id`, anclado en la fecha de siembra de la planta.

**Backend**
- `Planta.fechaSiembra` (`LocalDate`, columna nullable `fecha_siembra`) con `@PrePersist` que aplica `LocalDate.now()` cuando el valor es null. `fechaCreacion` sigue `@CreationTimestamp` y `plantaDtoToPlanta` ya no la escribe (se eliminó la línea que la pisaba en updates parciales).
- `PlantaDto` expone `fecha_siembra` (`@JsonProperty`, `yyyy-MM-dd`, `@PastOrPresent`, `@AssertTrue @JsonIgnore` para `< 1900-01-01`).
- `DtoMapper` con mapeo bidireccional y semántica "solo si no-null" en update.
- `GlobalExceptionHandler` ahora devuelve `400` para `MethodArgumentNotValidException` y `ConstraintViolationException`; el catch-all `Exception` → `500` quedó intacto (fix batch del CRITICAL #1).
- Tests: `PlantaRepositoryTest` (8/8), `DtoMapperTest` (13/13), `PlantaControllerTest` nuevo (11/11).

**Frontend**
- `lib/etapas.ts` nuevo: `ETAPA_COLORS`, `ETAPA_LABELS`, `WEEK_ZERO_LABELS` (`GERMINACION`→"Semilla", `PLANTIN`→"Esqueje"), `getEtapaColor`, `getEtapaLabel`. Consumido por riel, `PlantProfile` y `PlantListView` (sin mapas locales duplicados).
- `timelineUtils.ts` reescrito puro: `TIMELINE_MAX_RAIL_WEEKS = 52`, `calculateCurrentWeek` 0-indexada y day-based (UTC por string), `buildWeeklyTimeline(planta, events)`. Se eliminaron `differenceInWeeks` y la etapa hardcodeada heredada.
- `WeeklyStageRail.tsx` nuevo: chips `S{n} · {etapa}`, máx. 52, atenuados sin eventos, click → scroll a la semana, `aria-label` con etapa.
- `PlantDetailPage.tsx`: riel entre `PlantProfile` y `EventFilters`, lista de eventos agrupada por semana (`section#week-group-n`), badge "Antes de la siembra", cálculo con **todos** los eventos (el filtro solo afecta el render).
- `NewPlantForm.tsx` deja de descartar la fecha (envía `fecha_siembra`, no `fechaCreacion`); `FormularioPlanta.tsx` permite crear/editar la fecha. Una sola definición Zod exportada.

**Fuera de alcance respetado**: sin endpoint backend de timeline, sin paridad en vistas públicas, sin diario de fotos/métricas, sin test runner de frontend.

---

## 2. Cadena de PRs (5 slices encadenados)

| PR | Entrega | Contenido | Líneas |
|---|---|---|---:|
| `1a` | Backend core + contrato Zod + handler 400 + tests repo/mapper | `Planta.java`, `PlantaDto.java`, `DtoMapper.java`, `GlobalExceptionHandler.java` (+36), `PlantaRepositoryTest`, `DtoMapperTest`, `DTOSchemas.ts` | ~215 |
| `1b` | Test HTTP del controller | `PlantaControllerTest.java` (nuevo) | 319 |
| `2` | Formularios de alta/edición | `NewPlantForm.tsx`, `FormularioPlanta.tsx` | 19 |
| `3` | Cálculo semanal + etapas compartidas | `etapas.ts`, `timelineUtils.ts`, `PlantListView.tsx`, `PlantProfile.tsx` | 339 |
| `4` | Riel + lista agrupada | `WeeklyStageRail.tsx`, `PlantDetailPage.tsx` | 148 |
| | | **Total** | **≈ 1040** |

- Ningún PR supera el presupuesto de 400 líneas (máximo: PR `3` con 339). **No requiere `size:exception`.**
- `1b` depende de `1a` (usa el contrato `fecha_siembra` y el `PlantaDto` del core); `2`, `3` y `4` van `stacked-to-main` en orden.
- **Corrección de bookkeeping aplicada al archivar**: la tabla original de `tasks.md` omitía `GlobalExceptionHandler` (+36) y mostraba `1a` con ~179. El archivo se corrigió a **~215** y se agregó una nota explicando la asignación, para que el presupuesto documentado no subestime el PR.

---

## 3. Resultado de verificación

**PASS WITH WARNINGS** (re-verificación post-fix; el FAIL original se conserva como historial en `verify-report.md`).

| Evidencia | Resultado |
|---|---|
| `PlantaControllerTest` | ✅ 11/11 (incluye `400` real para fecha futura y `< 1900-01-01`) |
| `PlantaRepositoryTest` | ✅ 8/8 |
| `DtoMapperTest` | ✅ 13/13 |
| `WebApplicationTests` | ✅ 1/1 |
| `ZonaControllerTest` | ⚠️ 2/11 (9 fallos preexistentes, fuera de alcance) |
| `npm run build` | ✅ EXIT 0 |
| `tsc --noEmit` | ⚠️ 55 errores, todos preexistentes en `EventCard.tsx` (sin cambios) |
| Golden cases (a–h) design §4 | ✅ 8/8 |
| Harness de escenarios vs spec enmendada | ✅ 20/20 |
| Matriz de specs | 44 PASS · 2 PARTIAL · 0 FAIL · 4 UNVERIFIED (50 escenarios) |

Los 3 CRITICAL del verify original quedaron cerrados: handler `400`, WT-6 alineado por enmienda de spec, y presupuesto de review en 5 PRs todos ≤ 400.

---

## 4. Enmienda de spec (WT-6) — provenance

Durante verify se enmendó el requisito **WT-6 "Planta sin eventos"** de `plant-weekly-timeline`. El escenario original exigía "planta sin eventos ⇒ solo semana 0", lo que contradecía la user story US-2 ("ver las semanas de vida de la planta") y la decisión del design §11 (`0..current`). El escenario corregido exige `0..current` con semanas vacías y etapa de fallback.

- **Tipo**: enmienda deliberada de la spec, no arreglo de código (la implementación ya renderizaba `0..current`).
- **Provenance preservada**: el bloque `> Nota de cambio de spec (verify)` se mantiene **verbatim** en la spec archivada del change y en la spec principal `openspec/specs/plant-weekly-timeline/spec.md`.
- **Coherencia**: WT-7 ("planta creada hoy ⇒ solo semana 0") sigue cumpliéndose porque `current = 0`.

---

## 5. Warnings y UNVERIFIED que quedan abiertos

| Ítem | Estado | Nota |
|---|---|---|
| `ZonaControllerTest` 9/11 fallos | ⚠️ WARNING preexistente | `ClassCastException` principal `User` vs `CustomUserDetails`; 2 tests pasaron de 500 a 400 por la validación (payload incompleto del fixture), sin regresión de producto. Fuera de alcance. |
| Fixture `users.email` NOT NULL | ⚠️ WARNING preexistente | `PlantaRepositoryTest`/`ZonaControllerTest` crean `User` sin `email`. Se compensó **solo** en el contenedor PostgreSQL desechable del verify; no se tocó código, tests ni `application.properties`. |
| `SD-1.1` (creación con fecha explícita) | ⚠️ PARTIAL | No se asserta `fechaCreacion` en el create. |
| `SD-2.2` (lectura de planta creada sin campo) | ⚠️ PARTIAL | El test asserta el POST pero no el `GET` de detalle. |
| `SD-4.1` alta masiva (`ZonaGridModal`) | ❔ UNVERIFIED | Sin test de integración del volcado; solo evidencia estática + `@PrePersist`. |
| `WT-5.1/5.2/5.3` click, semana vacía como destino, filtro activo | ❔ UNVERIFIED | Sin navegador/DOM; `scrollIntoView` no se ejecuta. Solo evidencia estática. |
| Contraste WCAG AA (WT-10 SHOULD) | ❔ UNVERIFIED | Sin medición visual/axe. La etiqueta textual sí está verificada por SSR (el color no es el único portador). |
| Multi-TZ / DST | ❔ UNVERIFIED | Diseño UTC-por-string determinista, no ejecutado con `TZ` alternativos. |
| `timelineUtils.ts` = 189 líneas | ⚠️ WARNING de scope creep | vs 45-55 pronosticadas; comportamiento idéntico a §4. Incluido en PR `3` (339). |
| Backfill `fecha_siembra` en producción | 🔲 Decisión pendiente | Filas previas quedan NULL y el frontend cae a `fechaCreacion`. `ALTER TABLE plantas DROP COLUMN IF EXISTS fecha_siembra;` es el rollback. |

---

## 6. Sync de specs a la fuente de verdad

| Capacidad | Acción | Detalle |
|---|---|---|
| `plant-sowing-date` | **Creada** | 7 requirements, 16 escenarios (idénticos a la delta) |
| `plant-weekly-timeline` | **Creada** | 11 requirements, 34 escenarios (idénticos a la delta, con la nota WT-6 preservada) |

`openspec/specs/` estaba vacío antes de este archive: no hubo merge sobre specs existentes ni conflictos.

### Chequeo de delta destructiva

**No destructivo.** Las dos deltas contenían únicamente `## ADDED Requirements`; no había secciones `MODIFIED` ni `REMOVED`. El sync no eliminó ningún requisito: se verificó que el cuerpo de requirements de cada spec principal es **idéntico** al de la delta archivada (7/16 y 11/34).

---

## 7. Contenido del archivo

- `proposal.md` ✅
- `exploration.md` ✅
- `specs/plant-sowing-date/spec.md` ✅
- `specs/plant-weekly-timeline/spec.md` ✅
- `design.md` ✅
- `tasks.md` ✅ (22/22 tareas `[x]`, con la corrección de la tabla de PRs)
- `verify-report.md` ✅
- `archive-report.md` ✅ (este archivo)
