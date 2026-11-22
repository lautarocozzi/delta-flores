# Verify Report — `timeline-semanal-planta`

**Change**: `timeline-semanal-planta`
**Fecha**: 2026-11-04
**Rama**: `feature/backend-frontend` (working tree sucio, sin commit)
**Modo**: Standard (Strict TDD **no** activo — no se evalúa cumplimiento TDD)
**Artefactos leídos**: `proposal` (implícito en design/tasks), `specs/plant-sowing-date`, `specs/plant-weekly-timeline`, `design.md`, `tasks.md`, `apply-progress` (Engram #694), código y tests aplicados.

## Veredicto (re-verificación post-fix)

> **PASS WITH WARNINGS**

Los 3 CRITICAL del verify original quedaron resueltos: el handler ahora devuelve `400` para validación (`PlantaControllerTest` 11/11 verde), la spec WT-6 fue enmendada de forma legítima y el escenario pasa contra la spec enmendada, y el presupuesto de review quedó en 5 PRs con máximo 339 líneas. Quedan warnings preexistentes/fuera de alcance (9 fallos de `ZonaControllerTest`, workaround de fixture, ítems sin navegador) y 4 escenarios UNVERIFIED. Detalle completo en [Re-verificación (post-fix)](#re-verificación-post-fix).

---

## Veredicto original (pre-fix, se conserva como historial)

> **FAIL**

Hay un requisito **MUST** de la spec roto a nivel HTTP (fecha futura ⇒ `500` en vez de `400`) y un escenario **MUST** del timeline incumplido (planta sin eventos ⇒ solo semana 0). Además hay 2 tests nuevos en rojo (`PlantaControllerTest`), por lo que el gate de tests no pasa. La lógica pura del timeline, el mapeo/round-trip, la persistencia (con una salvedad de fixture) y el build de frontend están correctos.

---

## 1. Compilación, build y ejecución de tests

### 1.1 Backend — tests de mapper (sin DB)

```bash
cd backend && ./mvnw -Dtest='DtoMapperTest$*' test
```

**Resultado**: ✅ `Tests run: 13, Failures: 0, Errors: 0, Skipped: 0` — BUILD SUCCESS.
Incluye `generarUbicacion()` (9) y `fechaSiembra mapping` (4). El round-trip, la preservación con `null` y la **no destrucción de `fechaCreacion`** en update parcial están en verde.

### 1.2 PostgreSQL

- El datasource por defecto apunta a `localhost:5432`; ese puerto estaba **cerrado** y no había servicios del `docker compose` del proyecto levantados.
- Había un contenedor ajeno (`pop-reviews-db`, postgres:15-alpine) en `5433`, que NO se usó (credenciales/DB de otro proyecto).
- Se levantó un contenedor **temporal y aislado** (`flores-verify-pg`, `postgres:15-alpine`, puerto host `55432`, volumen efímero) y se apuntó Spring vía variables de entorno. **No se modificó `application.properties`**, no se tocaron volúmenes existentes del proyecto y el contenedor se eliminó al terminar (`docker stop`, `--rm`).

```bash
docker run --rm -d --name flores-verify-pg \
  -e POSTGRES_DB=flores_delta_db -e POSTGRES_USER=flores_user \
  -e POSTGRES_PASSWORD=verifypass -p 55432:5432 postgres:15-alpine

cd backend && DB_HOST=localhost DB_PORT=55432 DB_NAME=flores_delta_db \
  DB_USERNAME=flores_user DB_PASSWORD=verifypass ./mvnw test
```

### 1.3 Backend — suite completa (primer intento, esquema prístino)

**Resultado**: ❌ `Tests run: 44, Failures: 2, Errors: 19, Skipped: 0`.
- 2 fallos en `PlantaControllerTest` (en alcance).
- 19 errores en `setUp` de `PlantaRepositoryTest` y `ZonaControllerTest` porque el fixture inserta un `User` sin `email` y la columna `users.email` es `NOT NULL` en una DB recién creada. **Defecto preexistente de fixtures**, no causado por este change (esos archivos no se modificaron en su `setUp`).

### 1.4 Backend — desbloqueo no invasivo y suite completa final

Para poder verificar igualmente la persistencia se relajó **solo en el contenedor desechable** la restricción `users.email` (sin tocar código, tests ni `application.properties`), imitando el esquema histórico del entorno del dev:

```sql
ALTER TABLE users ALTER COLUMN email DROP NOT NULL; -- solo en la DB temporal
```

`./mvnw test` completo:

**Resultado**: ❌ `Tests run: 44, Failures: 11, Errors: 0, Skipped: 0` — BUILD FAILURE.

| Clase | Tests | Fallos | Nota |
|---|---:|---:|---|
| `PlantaControllerTest` | 11 | **2** | **En alcance** (fecha futura / <1900 ⇒ 500) |
| `ZonaControllerTest` | 11 | 9 | **Preexistente / fuera de alcance** (500 por `ClassCastException` de principal) |
| `PlantaRepositoryTest` | 8 | 0 | Incluye los 2 nuevos tests de `fechaSiembra` ✅ |
| `DtoMapperTest` | 13 | 0 | — |
| `WebApplicationTests` | 1 | 0 | contexto OK |

`PlantaControllerTest` aislado:

```bash
cd backend && DB_HOST=localhost DB_PORT=55432 ... ./mvnw -Dtest=PlantaControllerTest test
```

**Resultado**: ❌ `Tests run: 11, Failures: 2`. Fallan:
- `testFutureFechaSiembraReturns400` — expected `400`, actual `500`.
- `testTooOldFechaSiembraReturns400` — expected `400`, actual `500`.

**Causa raíz**: `GlobalExceptionHandler` tiene un `@ExceptionHandler(Exception.class)` catch-all (línea 60) que se traga `MethodArgumentNotValidException` y responde `500`. El handler específico de `HttpMessageNotReadableException` (línea 45) sí responde `400`, por eso “formato inválido” pasa y “fecha futura / <1900” falla. Es un defecto preexistente del handler, pero impide cumplir el requisito **MUST** `SD-5`.

### 1.5 Frontend — build y typecheck

```bash
cd frontend && npm run build
# EXIT 0 — ✓ built in 11.39s, 4025 modules

cd frontend && npx tsc --noEmit -p tsconfig.app.json
# EXIT 2
```

- Errores totales: **55**.
- Errores fuera de `src/components/bitacora/EventCard.tsx`: **0**.
- `EventCard.tsx` **no fue modificado** (`git status` limpio para ese archivo). Baseline confirmado.

---

## 2. Matriz de cumplimiento de specs

Leyenda: ✅ PASS (test/ejecución verde) · ⚠️ PARTIAL (test cubre solo parte) · ❌ FAIL · ❔ UNVERIFIED (no ejecutable en este entorno).

### 2.1 `plant-sowing-date` — 7 requirements / 16 escenarios

| Req | Escenario | Evidencia | Resultado |
|---|---|---|---|
| SD-1 Persistencia/default | Creación con fecha explícita | `PlantaControllerTest.testCreateWithExplicitFechaSiembra` (201 + `fecha_siembra=2025-06-01`); `PlantaRepositoryTest.testExplicitFechaSiembraPersists` verifica persistencia real. **No se asserta `fechaCreacion` en create.** | ⚠️ PARTIAL |
| SD-1 | Creación sin el campo | `PlantaControllerTest.testCreateWithoutFechaSiembra` (201 + hoy) | ✅ PASS |
| SD-1 | Campo `null` | `PlantaControllerTest.testCreateWithNullFechaSiembra` (201 + hoy) | ✅ PASS |
| SD-2 Exposición en detalle | Lectura con fecha de siembra | `testCreateWithExplicitFechaSiembra` hace `GET /api/plantas/{id}` y asserta `$.fecha_siembra` | ✅ PASS |
| SD-2 | Lectura de planta creada sin el campo | El test solo asserta la respuesta del POST, **no el `GET` de detalle** | ⚠️ PARTIAL |
| SD-3 Edición sin mutar `fechaCreacion` | Edición de la fecha | `testUpdateChangesFechaSiembraAndKeepsFechaCreacion` (asserta `fecha_siembra` y `fechaCreacion`) | ✅ PASS |
| SD-3 | Edición sin enviar el campo | `testUpdateWithoutFechaSiembraPreservesValue` y `testUpdateWithNullFechaSiembraPreservesValue` | ✅ PASS |
| SD-4 Alta masiva | Volcado de zona completa | Sin test HTTP/integración. Estático: `ZonaGridModal` no envía `fecha_siembra` y usa `apiService.createPlanta` (1 por celda); `@PrePersist` cubre el default. | ❔ UNVERIFIED |
| SD-5 Validación | Fecha futura | `testFutureFechaSiembraReturns400` → **expected 400, actual 500** | ❌ FAIL |
| SD-5 | Formato inválido | `testInvalidFechaSiembraFormatReturns400` (400 vía `HttpMessageNotReadable`) | ✅ PASS |
| SD-5 | Fecha absurdamente antigua | `testTooOldFechaSiembraReturns400` → **expected 400, actual 500** (es SHOULD) | ❌ FAIL |
| SD-5 | Fecha pasada válida | `testValidPastFechaSiembraAccepted` (201 + persiste) | ✅ PASS |
| SD-6 Wire/naming | Request con la clave correcta | `testCreateWithExplicitFechaSiembra` (`fecha_siembra` en request y response) | ✅ PASS |
| SD-6 | Cliente legado con `fechaCreacion` | `testLegacyFechaCreacionIsNotUsedAsFechaSiembra` (usa hoy, ignora 2025-01-01) | ✅ PASS |
| SD-7 Zod único | Formulario usa schema compartido | `NewPlantForm.tsx:27,40` importa y usa `fechaSiembraSchema`; grep: no hay definición local | ✅ PASS (estático ejecutado) |
| SD-7 | Detección de duplicado | Grep de `fechaSiembraSchema`/`fecha_siembra: z.`: una sola definición exportada en `DTOSchemas.ts:10`; `FormularioPlanta` deriva con `.or(z.literal(''))` sin redefinir | ✅ PASS (estático ejecutado) |

**Subtotal SD**: 11 PASS · 2 PARTIAL · 2 FAIL · 1 UNVERIFIED.

### 2.2 `plant-weekly-timeline` — 11 requirements / 34 escenarios

| Req | Escenario | Evidencia | Resultado |
|---|---|---|---|
| WT-1 Numeración day-based | Evento el día de siembra | Harness extendido `WT1 day of sowing -> week 0` | ✅ PASS |
| WT-1 | Borde semana `+6`/`+7` | Harness `WT1 +6 -> w0 / +7 -> w1` | ✅ PASS |
| WT-1 | Semanas posteriores `+13`/`+14` | Harness `WT1 +13 -> w1 / +14 -> w2` | ✅ PASS |
| WT-1 | Prohibición `differenceInWeeks` | `grep -rn differenceInWeeks frontend/src` ⇒ NONE; cálculo por `Date.UTC` + string (`timelineUtils.ts:44-59`) | ✅ PASS (estático ejecutado) |
| WT-2 Etapa semana 0 | Primer cambio desde `GERMINACION` | Golden (e): semana 0 = `GERMINACION` / “Semilla” | ✅ PASS |
| WT-2 | Primer cambio desde `PLANTIN` | Harness `WT2 week0 PLANTIN -> Esqueje` | ✅ PASS |
| WT-2 | Sin cambios de etapa | Golden (a)/(c): “Vegetación” | ✅ PASS |
| WT-2 | Orden por fecha, no inserción | Harness `WT2 order by fecha not insertion` (el change de menor fecha se insertó después y define `base`) | ✅ PASS |
| WT-3 Propagación | Cambio en semana 2 | Harness `WT3 change in w2 propagates 2..4` | ✅ PASS |
| WT-3 | Dos cambios en la misma semana | Golden (h): gana mayor fecha; desempate por `id` | ✅ PASS |
| WT-3 | Semana vacía intermedia | Harness `WT3 empty intermediate w2/w3 inherit w1` | ✅ PASS |
| WT-3 | Cambio en el último día de la semana | Harness `WT3 change on last day of w1 applies to w1` | ✅ PASS |
| WT-4 Riel | Semana con eventos | SSR de `WeeklyStageRail`: chip normal, texto `S0 · Vegetación` | ✅ PASS |
| WT-4 | Semana sin eventos | SSR: clase `opacity-50` en semanas vacías (2 de 3) | ✅ PASS |
| WT-4 | Tope de 52 semanas | SSR: 61 semanas ⇒ 52 `<button>`; `buildWeeklyTimeline` devuelve 0..60; la página mapea **todas** las semanas sin slice (`PlantDetailPage.tsx:172`) | ✅ PASS (rail ejecutado; lista verificada estáticamente) |
| WT-4 | Consistencia de color | Riel usa `getEtapaColor`; `PlantListView` importa el mismo módulo (`etapas.ts`) | ✅ PASS (estático) |
| WT-5 Interacción | Click navega a la semana | Sin navegador/DOM. Estático: `handleWeekClick` hace `scrollIntoView(#week-group-n)` (`PlantDetailPage.tsx:105-110`) | ❔ UNVERIFIED |
| WT-5 | Semana vacía como destino | Sin navegador. Estático: toda semana (incluida vacía) renderiza `<section id="week-group-n">` | ❔ UNVERIFIED |
| WT-5 | Filtro activo | Sin navegador. Estático: el filtro no cambia (`setActiveWeek` no toca `selectedEventType`) y el grupo existe con “Sin eventos” | ❔ UNVERIFIED |
| WT-6 Planta sin eventos | Planta sin ningún evento ⇒ solo semana 0 | Harness: planta sin eventos de 20 días ⇒ **3 semanas (0,1,2)**, no 1 | ❌ FAIL |
| WT-6 | Eventos no-`STAGE_CHANGE` | Harness: semanas hasta la actual, todas heredan `VEGETACION` | ✅ PASS |
| WT-7 Creada hoy | Siembra hoy sin eventos | Harness: solo semana 0 | ✅ PASS |
| WT-7 | Siembra hoy con eventos | Harness: todos en semana 0, sin semanas negativas/posteriores | ✅ PASS |
| WT-8 Pre-siembra | Evento previo a la siembra | Golden (f): semana 0, `hasPreSowingEvents=true`, no se pierde | ✅ PASS |
| WT-8 | Varios eventos previos | Harness `WT8 multiple pre-sowing events kept in week0` | ✅ PASS |
| WT-8 | Sin semanas negativas | Harness: `minWeek=0` | ✅ PASS |
| WT-9 Recálculo | Borrado de un cambio intermedio | Harness: recalcular sin el evento devuelve la etapa anterior | ✅ PASS |
| WT-9 | Borrado de todo el historial | Harness: fallback a `planta.etapa` (`GERMINACION` / “Semilla”) | ✅ PASS |
| WT-9 | Sin etapa obsoleta | Harness: tras borrar, no queda `FLORACION` | ✅ PASS |
| WT-10 Accesibilidad | Lectura sin color | SSR: texto `S0 · Vegetación` + `aria-label="Semana 0, etapa Vegetación"` | ✅ PASS |
| WT-10 | Daltonismo | SSR: la etiqueta textual distingue etapas (no depende del color) | ✅ PASS |
| WT-11 Fuera de alcance | Sin endpoint de timeline | `grep timeline/weekly/semanas backend/src/main/java` ⇒ NONE | ✅ PASS (estático ejecutado) |
| WT-11 | Vista pública sin cambios | `WeeklyStageRail` solo se importa en `PlantDetailPage.tsx`; no existe página pública de planta | ✅ PASS (estático ejecutado) |
| WT-11 | Sin diario de fotos | Nuevos componentes: `WeeklyStageRail.tsx` y `etapas.ts`; no hay diario/métricas | ✅ PASS (estático ejecutado) |

**Subtotal WT**: 30 PASS · 0 PARTIAL · 1 FAIL · 3 UNVERIFIED.

### 2.3 Totales

| Estado | Escenarios |
|---|---:|
| ✅ PASS | **41** |
| ⚠️ PARTIAL | **2** |
| ❌ FAIL | **3** |
| ❔ UNVERIFIED | **4** |
| **Total** | **50** (16 + 34) |

---

## 3. Golden cases del design §4 (a–h)

Ejecutados contra el **código real** `frontend/src/utils/timelineUtils.ts` con `sucrase` (ya instalado) y hook de resolución `@/` (`/tmp/opencode/timeline-harness.cjs`). Anclas relativas al “hoy” local real.

| Caso | Esperado | Actual | Resultado |
|---|---|---|---|
| (a) Sin eventos, siembra hoy | 1 semana (0), `VEGETACION`, “Vegetación” | idéntico | ✅ PASS |
| (b) Sin eventos, siembra hace 20 días | semanas 0..2, todas `VEGETACION`, vacías | idéntico | ✅ PASS |
| (c) `STAGE_CHANGE` el día de siembra | 1 semana (0), etapa sigue `base` (`VEGETACION`) | idéntico | ✅ PASS |
| (d) Evento en `sow+6` / `sow+7` | semana 0 / semana 1 | idéntico | ✅ PASS |
| (e) `STAGE_CHANGE` en `sow+14` | 0-1 `base`; semana 2 `FLORACION` | semana 0 `GERMINACION`/“Semilla”, 1 `GERMINACION`, 2 `FLORACION` | ✅ PASS |
| (f) Evento 10 días antes | semana 0, `hasPreSowingEvents=true`, no se descarta | idéntico | ✅ PASS |
| (g) Planta de 60 semanas | cálculo 0..60; riel 52 | 61 entradas, `currentWeek=60`, rail 52 | ✅ PASS |
| (h) Dos `STAGE_CHANGE` en semana 3 | gana mayor `fecha`; desempate `id` | semana 3 `COSECHADA` | ✅ PASS |

**Golden summary: 8/8 PASS.**

### 3.1 Harness extendido de escenarios (evidencia adicional)

`/tmp/opencode/spec-harness.cjs` (código real + SSR del riel con `react-dom/server`): **19/20 PASS**. El único FAIL es el escenario literal **WT-6 “planta sin eventos ⇒ solo semana 0”** (actual: 3 semanas).

---

## 4. Coherencia con el design

| Decisión | ¿Cumplida? | Evidencia |
|---|---|---|
| `fecha_siembra` vía `@JsonProperty` | ✅ | `PlantaDto.java:51`; test HTTP key snake_case en request y response |
| `@AssertTrue @JsonIgnore isFechaSiembraValida()` sin leak | ✅ estático | `PlantaDto.java:57-61`; no hay test que asserta ausencia del campo |
| `@PrePersist` no pisa fecha explícita | ✅ | `Planta.java:91-96` solo asigna si `null`; `testExplicitFechaSiembraPersists` |
| `fechaCreacion` sigue `@CreationTimestamp` | ✅ | `Planta.java:62-65` |
| Eliminar `setFechaCreacion` del update path | ✅ | `grep setFechaCreacion`: solo queda `DtoMapper.java:128` (sentido entidad→DTO). `plantaDtoToPlanta` (164-191) no lo escribe; `testUpdateDoesNotWipeFechaCreacion` verde |
| Aritmética day-based UTC, sin `differenceInWeeks` | ✅ | `timelineUtils.ts:44-59`; grep NONE |
| Anchor `fecha_siembra ?? fechaCreacion` | ✅ | `timelineUtils.ts:115` |
| Timeline con **todos** los eventos | ✅ | `PlantDetailPage.tsx:68-71` (`buildWeeklyTimeline(planta, events)`) |
| Tope 52 solo en el riel | ✅ | Único `slice(0, TIMELINE_MAX_RAIL_WEEKS)` en `WeeklyStageRail.tsx:19`; página mapea todas |
| Lista agrupada conserva semanas >51 | ✅ | `weeks.map` sin slice (`PlantDetailPage.tsx:172`) |
| Etapas compartidas (riel, perfil, lista) | ✅ | `etapas.ts` + imports en `PlantListView`/`PlantProfile`/`WeeklyStageRail` |
| Sin endpoint backend de timeline | ✅ | grep NONE |
| Lista agrupada inline | ✅ | `PlantDetailPage.tsx:171-213` |

**Desviaciones del design documentadas por apply (no rompen spec salvo WT-6)**:
1. `FormularioPlanta` usa `fechaSiembraSchema.or(z.literal('')).optional()` en vez de `.optional()` (necesario porque `''` no pasa `.min(1)`).
2. `timelineUtils.ts` mide 189 líneas vs 45-55 estimadas (helpers + comentarios; comportamiento igual a §4).
3. `BackendEvent` no declara `etapaAnterior`; se accede por cast local (`timelineUtils.ts:95-100`).
4. Filtro por semana inline en `PlantDetailPage` (mismo comportamiento).
5. `WT-6` “sin eventos ⇒ solo semana 0”: el design §11 lo dejó como open question y eligió `0..current`. **La spec literal no se cumple.**

---

## 5. Hallazgos

### CRITICAL

1. **Fecha futura devuelve 500 en vez de 400 (SD-5 MUST).**
   - Evidencia: `PlantaControllerTest.testFutureFechaSiembraReturns400` → `Status expected:<400> but was:<500>`.
   - Causa: `GlobalExceptionHandler.java:60-67` intercepta `Exception` (incluye `MethodArgumentNotValidException`) y responde 500. El handler específico de `HttpMessageNotReadableException` (línea 45) explica por qué “formato inválido” sí da 400.
   - Impacto: incumple un MUST de la spec y deja el test rojo. Afecta también a `<1900-01-01` (SHOULD).
2. **`PlantaControllerTest` en rojo (gate de tests).** 2/11 fallos. La tarea 1.8 está marcada `[x]` con criterio “tests verdes si hay PostgreSQL”; se proveyó PostgreSQL y no están verdes.
3. **WT-6 “planta sin eventos ⇒ solo semana 0” incumplido.**
   - Evidencia: harness extendido → planta sin eventos de 20 días devuelve semanas `[0,1,2]`.
   - La spec usa MUST; el design §11 reconoce la ambigüedad y decide `0..current`. Requiere resolver spec vs design antes de archivar (o agregar el guard de una línea).

### WARNING

1. **Suite backend no es hermética ni verde en DB prístina.** `PlantaRepositoryTest.setUp` y `ZonaControllerTest.setUp` fallan porque el fixture crea `User` sin `email` y la columna es `NOT NULL`. Es preexistente (no se tocó el `setUp`), pero impide correr los tests nuevos sin un workaround.
2. **`ZonaControllerTest` sigue en rojo (9/11) incluso tras desbloquear el fixture**, con 500 por `ClassCastException` de principal de seguridad. Preexistente y fuera de alcance; se reporta para no atribuirlo a este change.
3. **SD-4 (alta masiva) UNVERIFIED.** No hay test de integración del volcado de zona; solo evidencia estática de `ZonaGridModal` + `@PrePersist`.
4. **WT-5 (click/scroll/filtro) UNVERIFIED.** Sin navegador ni runner de componentes; solo evidencia estática de `handleWeekClick` y de que cada semana renderiza su `section`.
5. **SD-1.1 y SD-2.2 PARTIAL.** No se asserta `fechaCreacion` en el create ni se hace `GET` de detalle para la planta creada sin campo.
6. **Presupuesto de review excedido** (~1004 líneas cambiadas vs 400; ver §7). No hay `size:exception` registrado.
7. **Contraste WCAG AA (WT-10 SHOULD) no medido.** El texto de etapa sí está siempre presente (SSR), así que el requisito de no depender del color se cumple; el contraste no se verifica.
8. **`timelineUtils.ts` 189 líneas** vs forecast 45-55 (scope creep), aunque el comportamiento coincide con §4.

### SUGGESTION

1. Agregar `@ExceptionHandler(MethodArgumentNotValidException.class)` (y `ConstraintViolationException`) en `GlobalExceptionHandler` devolviendo `400` con detalle de campos. Resuelve los 2 fallos de `PlantaControllerTest`.
2. Agregar aserción de que la respuesta no contiene `fechaSiembraValida` (prueba explícita del `@JsonIgnore`).
3. Agregar test de `GET` de detalle para la planta creada sin `fecha_siembra` (cierra SD-2.2 a PASS).
4. Agregar test de alta masiva (o al menos de `PlantaService.createPlanta` en lote) para SD-4.
5. Resolver la ambigüedad WT-6: o se corrige la spec a `0..current`, o se agrega el guard “sin eventos ⇒ solo semana 0”. Documentar la decisión.
6. Adoptar Vitest para las funciones puras (el design ya lo difiere) y así reemplazar el harness temporal por tests versionados.
7. Recortar/partir `PlantaControllerTest` (319 líneas) y reducir comentarios redundantes en `timelineUtils.ts` si se busca bajar el presupuesto.

---

## 6. Lo que NO se pudo verificar (y por qué)

| Ítem | Motivo |
|---|---|
| WT-5.1/5.2/5.3 (click, semana vacía como destino, filtro activo) | Sin navegador/DOM ni runner de componentes; `scrollIntoView` real no se ejecuta. Solo evidencia estática. |
| SD-4.1 (volcado completo de zona vía `ZonaGridModal`) | Sin test HTTP/integración del flujo masivo; solo lectura de código. |
| WT-10 contraste WCAG AA | No hay medición visual/axe. |
| Comportamiento en husos horarios distintos / DST | El harness usa “hoy” local; no se ejecutó con `TZ` alternativos. El código usa UTC por string, lo que lo hace determinista por diseño, pero no se probó multi-TZ. |
| `GET` de detalle para planta creada sin campo | El test existente no lo cubre; no se agregó test (prohibido modificar código/tests en verify). |
| Vista pública de planta | No existe una página pública dedicada; se verificó que el riel solo se importa en `PlantDetailPage`. |
| Flujo real de edición con DevTools | Sin servidor en vivo; solo build + estático. |

**Nota PostgreSQL**: la DB se proveyó mediante un contenedor temporal aislado. Los tests de persistencia nuevos (`PlantaRepositoryTest`) pasaron 8/8 una vez compensado el fixture preexistente (`users.email`), por lo que SD-1 queda verificado a nivel de persistencia.

---

## 7. Auditoría del presupuesto de review

Líneas cambiadas = `git diff --numstat` (add+del tracked) + líneas completas de archivos nuevos sin trackear.

| Slice | Archivos | Líneas cambiadas |
|---|---|---:|
| **Slice 1** | `PlantaDto` 15 · `Planta` 12 · `DtoMapper` 5 · `PlantaRepositoryTest` 46 · `DtoMapperTest` 92 · `DTOSchemas` 9 · **`PlantaControllerTest` 319** | **498** |
| Slice 2 | `NewPlantForm` 5 · `FormularioPlanta` 14 | **19** |
| **Slice 3** | `etapas.ts` 56 · `timelineUtils` 261 · `PlantListView` 11 · `PlantProfile` 11 | **339** |
| Slice 4 | `WeeklyStageRail` 50 · `PlantDetailPage` 98 | **148** |
| **Total** | | **≈ 1004** |

- Presupuesto por defecto: **400 líneas**. Exceso: **~2.5×**.
- **Slice 1 excede 400 por sí solo (498)**, y el 64% es el `PlantaControllerTest` (319 líneas frente a las 45-55 pronosticadas).
- Slice 3 también supera el forecast (339 vs 120-150), pero queda por debajo de 400.
- El forecast de `tasks.md`/design estimaba 420-545 totales; el real es ~1004.

### Recomendación concreta

1. **Extraer `PlantaControllerTest` a su propio PR/slice encadenado** (~319 líneas, <400). Esto baja Slice 1 a ~179 líneas y deja todos los slices ≤ 339. Es la opción de menor riesgo y no sacrifica cobertura.
2. **No hace falta `size:exception` global** si se adopta la extracción anterior y se mantiene la cadena de 5 PRs (1 core, 1 controller test, 2 forms, 3 timeline, 4 UI).
3. Si se decide mantener un único PR o no extraer el test, **documentar `size:exception`** (~1004 líneas) y justificar el 2.5×.
4. **Bloquear el merge** hasta corregir los 2 tests en rojo (handler 400) y resolver WT-6.

---

## 8. Conclusión

La implementación está mayormente alineada con el design y con la spec: persistencia y default de `fechaSiembra`, wire `fecha_siembra`, no destrucción de `fechaCreacion`, cálculo semanal day-based, propagación de etapas, clamp de pre-siembra, tope de 52 solo en el riel y accesibilidad textual están correctos y ejecutados (golden 8/8, extendido 19/20, mapper 13/13, repo 8/8, build 0, tsc 55/55 solo en EventCard).

Pero **no puede considerarse PASS**: hay un MUST de validación HTTP incumplido (500 en vez de 400), un escenario MUST del timeline incumplido (WT-6) y tests nuevos en rojo. **Veredicto: FAIL.**

---

## Re-verificación (post-fix)

**Fecha**: 2026-11-04
**Rama**: `feature/backend-frontend` (working tree sucio, sin commit)
**Modo**: Standard (Strict TDD no activo)
**Base**: se re-ejecutó todo lo que estaba en rojo o era dudoso; esta sección **no reescribe** el historial anterior.

### R1. Entorno PostgreSQL aislado

Se levantó un contenedor desechable distinto al del verify anterior:

```bash
docker run --rm -d --name flores-verify-pg-55434 \
  -e POSTGRES_DB=flores_delta_db -e POSTGRES_USER=flores_user \
  -e POSTGRES_PASSWORD=verifypass -p 55434:5432 postgres:15-alpine
```

- **No se modificó `application.properties`**; Spring se apuntó por variables de entorno (`DB_HOST`, `DB_PORT=55434`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`).
- Se creó el esquema con `WebApplicationTests` y **solo dentro de esa DB temporal** se aplicó:
  ```sql
  ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
  ```
  Esto es un **workaround de entorno para un defecto preexistente de los fixtures** (`PlantaRepositoryTest` y `ZonaControllerTest` crean `User` sin `email`). No es un cambio de código, test ni configuración del proyecto.
- Al terminar: contenedor detenido/eliminado (`--rm`), puerto `55434` libre, sin tocar `pop-reviews-db`, `flores-delta-db` ni `flores-delta-minio`.

### R2. Backend — suite completa re-ejecutada

```bash
cd backend && DB_HOST=localhost DB_PORT=55434 DB_NAME=flores_delta_db \
  DB_USERNAME=flores_user DB_PASSWORD=verifypass ./mvnw test
```

**Resultado global**: `Tests run: 44, Failures: 9, Errors: 0, Skipped: 0` → EXIT 1. **Los 9 fallos son exclusivamente de `ZonaControllerTest` (preexistentes, fuera de alcance).**

| Clase | Tests | Pass | Fail | Resultado |
|---|---:|---:|---:|---|
| `PlantaControllerTest` | 11 | **11** | **0** | ✅ **11/11 verde** (8 POST + 3 PUT) |
| `PlantaRepositoryTest` | 8 | **8** | 0 | ✅ 8/8 |
| `DtoMapperTest` | 13 | **13** | 0 | ✅ 13/13 (4 `fechaSiembra` + 9 `generarUbicacion`) |
| `WebApplicationTests` | 1 | **1** | 0 | ✅ 1/1 (contexto OK) |
| `ZonaControllerTest` | 11 | 2 | **9** | ⚠️ 9 fallos preexistentes, **mismo número que antes** |
| **Total** | **44** | **35** | **9** | Suite roja solo por `ZonaControllerTest` |

`PlantaControllerTest` aislado, para evidencia limpia:

```bash
cd backend && DB_HOST=localhost DB_PORT=55434 ... ./mvnw -Dtest=PlantaControllerTest test
```

**Resultado**: ✅ `Tests run: 11, Failures: 0, Errors: 0, Skipped: 0` — **BUILD SUCCESS**. Incluye explícitamente:
- `testFutureFechaSiembraReturns400` → **PASS** (400 y no persiste; `plantaRepository.findByNombre(...)` vacío).
- `testTooOldFechaSiembraReturns400` → **PASS** (400 para `1800-01-01`).

**Fallos de `ZonaControllerTest` (todos fuera de alcance, preexistentes):**

| Test | Esperado | Obtenido | Causa |
|---|---:|---:|---|
| `testGetZonasBySala` | 200 | 500 | `ClassCastException` principal `User` ≠ `CustomUserDetails` |
| `testGetZonasBySalaEmpty` | 200 | 500 | idem |
| `testCreateZona` | 201 | 500 | idem |
| `testCreateZonaForbiddenForGrower` | 403 | **400** | validación del DTO incompleto (ver R3) |
| `testUpdateZona` | 200 | 500 | `ClassCastException` |
| `testUpdateZonaNotFound` | 404 | **400** | validación del DTO incompleto (ver R3) |
| `testDeleteZonaNullifiesPlantReferences` | 204 | 500 | `ClassCastException` |
| `testGetPlantasByZona` | 200 | 500 | `ClassCastException` |
| `testPlantasIncludeUbicacionAndCepa` | 200 | 500 | `ClassCastException` |

### R3. Chequeo adversarial del fix del handler

**Diff**: `GlobalExceptionHandler.java` es **puramente aditivo** (+36 líneas). Se agregaron `@ExceptionHandler(MethodArgumentNotValidException.class)` y `@ExceptionHandler(ConstraintViolationException.class)` devolviendo `400`; el `@ExceptionHandler(Exception.class)` catch-all **sigue intacto** y devuelve `500`.

**Forma real del body 400** (tomada del log de ejecución):
```json
{"timestamp":"2026-11-04T22:06:46","message":"Validación de solicitud inválida","details":{"fechaSiembra":"La fecha de siembra no puede ser futura"}}
```
Para `1800-01-01` la clave es `fechaSiembraValida` con `"La fecha de siembra no puede ser anterior a 1900-01-01"`. El formato inválido sigue pasando por `HttpMessageNotReadableException` con `{"message":"Cuerpo de solicitud inválido","details":"..."}`.

**¿El catch-all sigue manejando errores inesperados?** Sí. Spring resuelve el handler más específico por jerarquía de excepción; el genérico permanece y no se tocó. Evidencia de ejecución: las rutas de `ZonaControllerTest` que terminan en `ClassCastException` siguen devolviendo `500`, no `400`. No se convirtió “todo error” en 400.

**Juicio sobre los 2 tests Zona que pasaron de 500 a 400:**
- `testCreateZonaForbiddenForGrower` (espera 403) y `testUpdateZonaNotFound` (espera 404) envían DTOs incompletos. Antes, la `ClassCastException`/catch-all los tapaba con 500; ahora la validación se resuelve antes y devuelve 400.
- **No es una regresión de comportamiento del producto**: un payload inválido devolviendo 400 es semánticamente correcto. Lo que revela es un **defecto preexistente de fixture** en `ZonaControllerTest` (DTOs incompletos + principal `User` en vez de `CustomUserDetails`), no un cambio inducido por este feature.
- El test sigue fallando (no alcanza a probar 403/404) y el conteo total permanece en **9**, sin fallos nuevos. Se clasifica como **WARNING de test preexistente**, no como regresión.

### R4. Juicio sobre la enmienda de la spec WT-6

La spec enmendada exige: planta sin eventos ⇒ semanas `0..current`, todas con `hasEvents = false` y etapa de fallback `Planta.etapa`. Incluye un bloque `> Nota de cambio de spec (verify)` que documenta el cambio.

**Veredicto: enmienda legítima, no spec-washing.**
- **US-2 del proposal** pide “Riel de semana 0 a la actual (tope 52)” y “Semanas vacías visibles y atenuadas”; no pide ocultar la edad de la planta.
- El **golden case (b)** del design §4 (“sin eventos, siembra hace 20 días”) ya esperaba semanas `0..2` y pasaba; el escenario literal original (“solo semana 0”) contradecía el propio design y la user story.
- **WT-7** (“planta creada hoy ⇒ solo semana 0”) sigue siendo coherente: si `current = 0`, `0..current` es exactamente `[0]`.
- El **código no se cambió** para este punto: la implementación ya renderizaba `0..current`; se corrigió la spec, no se acomodó un test.
- Salvedad de proceso: una enmienda de spec durante verify debe quedar explícita en el PR/archivo; el bloque de nota cumple eso.

### R5. Frontend

```bash
cd frontend && npm run build
# EXIT 0 — ✓ built in 14.76s, 4025 modules (warning de chunk >500 kB, preexistente)

cd frontend && npx tsc --noEmit -p tsconfig.app.json
# EXIT 2
```

- Errores totales: **55**.
- Errores fuera de `src/components/bitacora/EventCard.tsx`: **0**.
- `EventCard.tsx` **sin cambios** (`git diff` vacío); baseline preexistente confirmado.

### R6. Golden cases (a–h) y WT-6 contra el código real

Ejecutado con `sucrase` sobre `frontend/src/utils/timelineUtils.ts` real (harness en `/tmp/opencode`).

- **Golden cases (a–h)**: ✅ **8/8 PASS**.
- **Harness de escenarios con la spec original**: `19/20`; el único FAIL es el check que codificaba el texto viejo de WT-6 (“solo semana 0”). Es esperado y no cuenta contra la implementación.
- **Harness adaptado a la spec enmendada**: ✅ **20/20 PASS**. El check WT-6 ahora verifica:
  - planta de 20 días sin eventos ⇒ `[0,1,2]`;
  - las 3 semanas con `hasEvents = false`;
  - todas con etapa fallback `PLANTIN`;
  - semana 0 “Esqueje”, semanas 1–2 “Plantín”.
- WT-7 (siembra hoy sin eventos ⇒ solo semana 0) sigue en verde, lo que confirma que la enmienda no contradice el caso “creada hoy”.

### R7. Presupuesto de review (5 PRs)

Líneas cambiadas = `git diff --numstat` (add+del tracked) + líneas completas de archivos nuevos sin trackear.

| PR | Contenido | Líneas |
|---|---|---:|
| `1a` | Core backend + Zod + handler 400 + tests repo/mapper (`PlantaDto` 15, `Planta` 12, `GlobalExceptionHandler` **36**, `DtoMapper` 5, `PlantaRepositoryTest` 46, `DtoMapperTest` 92, `DTOSchemas` 9) | **215** |
| `1b` | `PlantaControllerTest.java` (nuevo) | **319** |
| `2` | `NewPlantForm` 5 + `FormularioPlanta` 14 | **19** |
| `3` | `etapas.ts` 56 + `timelineUtils` 261 + `PlantListView` 11 + `PlantProfile` 11 | **339** |
| `4` | `WeeklyStageRail` 50 + `PlantDetailPage` 98 | **148** |
| **Total** | | **≈ 1040** |

- **Confirmado**: ningún PR supera 400; el máximo es el PR 3 con **339**. No se requiere `size:exception`.
- **Gap de documentación (WARNING)**: la tabla “Cadena final de PRs” de `tasks.md` lista `1a` con ~179 líneas y **no menciona `GlobalExceptionHandler` (+36)** agregado en el fix batch. Debe asignarse explícitamente a `1a` (queda 215) o a `1b` (queda 355); en ambos casos sigue ≤400. Tal como está, el conteo documentado subestima el PR `1a`.

### R8. Regression sweep

`git diff --stat`: **13 archivos tracked, 504 inserciones, 111 eliminaciones**. Untracked: `PlantaControllerTest.java` (319), `WeeklyStageRail.tsx` (50), `etapas.ts` (56) y `openspec/changes/timeline-semanal-planta/` (artefactos del change).

Archivos sensibles verificados explícitamente:

| Archivo | Estado |
|---|---|
| `frontend/src/components/bitacora/EventCard.tsx` | **sin cambios** (git diff vacío) |
| `backend/src/main/resources/application.properties` | **sin cambios** |
| `frontend/src/components/zones/ZonaGridModal.tsx` | **sin cambios** |
| Cualquier archivo fuera del alcance del change | **ninguno** |

El único archivo modificado no listado en el verify original es `GlobalExceptionHandler.java`, que es parte esperada del fix batch (CRITICAL #1).

### R9. Estado actualizado de la matriz (sin reescribir la original)

| Estado | Antes | Después |
|---|---:|---:|
| ✅ PASS | 41 | **44** |
| ⚠️ PARTIAL | 2 | **2** (`SD-1.1`, `SD-2.2`) |
| ❌ FAIL | 3 | **0** |
| ❔ UNVERIFIED | 4 | **4** (`SD-4.1`, `WT-5.1`, `WT-5.2`, `WT-5.3`) |
| **Total** | **50** | **50** |

Cambios concretos: `SD-5` fecha futura → **PASS**; `SD-5` fecha <1900 → **PASS**; `WT-6` planta sin eventos → **PASS contra la spec enmendada**.

### R10. Lo que sigue UNVERIFIED (y por qué)

| Ítem | Motivo |
|---|---|
| `SD-4.1` alta masiva desde `ZonaGridModal` | Sin test de integración del volcado; solo evidencia estática (`ZonaGridModal` no envía `fecha_siembra` + `@PrePersist`). |
| `WT-5.1` click navega a la semana | Sin navegador/DOM real; `scrollIntoView` no se ejecuta. Solo evidencia estática. |
| `WT-5.2` semana vacía como destino | Sin navegador. |
| `WT-5.3` filtro activo | Sin navegador. |
| Contraste WCAG AA (WT-10 SHOULD) | Sin medición visual/axe; la etiqueta textual sí está verificada por SSR. |
| Multi-TZ / DST | No se ejecutó con `TZ` alternativos; el diseño UTC-por-string es determinista pero no se probó. |
| Flujo real de edición con DevTools | Sin servidor en vivo; solo build + estático. |
| Vista pública de planta | No existe página pública dedicada; se verificó que el riel solo se importa en `PlantDetailPage`. |

### R11. Conclusión de la re-verificación

Los tres CRITICAL del informe original están cerrados con evidencia de ejecución: `PlantaControllerTest` **11/11 verde**, `400` real para fecha futura y `<1900`, WT-6 **PASS contra la spec enmendada**, y cadena de 5 PRs **todos ≤400** (máximo 339). El build de frontend es EXIT 0 y `tsc` mantiene exactamente 55 errores preexistentes, todos en `EventCard.tsx` (sin cambios).

**Veredicto de re-verificación: PASS WITH WARNINGS.** Los warnings restantes son preexistentes/fuera de alcance (9 fallos de `ZonaControllerTest`, fixture `users.email`), 2 escenarios PARTIAL y 4 UNVERIFIED por falta de navegador/integración. No hay FAIL dentro del alcance del change.
