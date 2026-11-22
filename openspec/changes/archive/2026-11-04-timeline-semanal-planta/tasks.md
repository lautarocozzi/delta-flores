# Tasks: Timeline semanal de planta

Cuatro slices encadenados a `main`. Orden obligatorio: 1 → 2 → 3 → 4. Cada slice deja el repo compilando y es revertible solo. No hay backfill ni migración: la columna es nullable y el frontend cae a `fechaCreacion` (`SD-1`, `SD-2`).

| Slice | Entrega | Depende | Líneas |
|---|---|---|---|
| 1 | `fechaSiembra` backend + contrato Zod | — | 120-160 |
| 2 | Alta/edición en formularios | 1 | 40-55 |
| 3 | Cálculo semanal + etapas compartidas | 1 (tipos), 2 (datos) | 120-150 |
| 4 | Riel + lista agrupada | 3 | 140-180 |

Spec IDs usados: `SD-n` = requirement n de `plant-sowing-date` (1 persistencia/default, 2 exposición, 3 edición, 4 alta masiva, 5 validación, 6 wire, 7 Zod único). `WT-n` = requirement n de `plant-weekly-timeline` (1 numeración, 2 semana 0, 3 propagación, 4 riel, 5 click, 6 sin eventos, 7 creada hoy, 8 pre-siembra, 9 recálculo, 10 accesibilidad, 11 fuera de alcance).

## Slice 1 — Backend + Zod (PR 1, base `main`)

**Entrega**: `fecha_siembra` persiste, viaja y se valida. Puede desplegarse antes del slice 2: el formulario viejo sigue enviando `fechaCreacion`, que el backend ignora.

### Infraestructura

| ID | Estado | Tarea | Archivos | Hecho cuando | Spec | Líneas |
|---|---|---|---|---|---|---|
| 1.1 | [x] | Agregar `LocalDate fechaSiembra` (columna `fecha_siembra`, nullable) tras `fechaFin` y `@PrePersist applyDefaultFechaSiembra()` que asigna `LocalDate.now()` si es null | `backend/src/main/java/DeltaFlores/web/entities/Planta.java` | Entidad compila; INSERT sin valor guarda hoy; UPDATE con null no toca el valor | `SD-1`, `SD-4` | 10-14 |

### Implementación

| ID | Estado | Tarea | Archivos | Hecho cuando | Spec | Líneas |
|---|---|---|---|---|---|---|
| 1.2 | [x] | Agregar el campo al DTO con `@JsonProperty("fecha_siembra")`, `@JsonFormat`, `@DateTimeFormat`, `@PastOrPresent` y `@AssertTrue @JsonIgnore isFechaSiembraValida()` (≥ `1900-01-01`) | `backend/src/main/java/DeltaFlores/web/dto/PlantaDto.java` | Request/response usan `fecha_siembra`; fecha futura o previa a 1900 da 400 sin exponer campo extra | `SD-5`, `SD-6`, `SD-2` | 14-18 |
| 1.3 | [x] | Mapear en `plantaToPlantaDto` y setear en `plantaDtoToPlanta` solo si el DTO trae valor no nulo | `backend/src/main/java/DeltaFlores/web/utils/DtoMapper.java` | Round-trip conserva el valor; update sin campo conserva el existente | `SD-2`, `SD-3` | 4-6 |
| 1.4 | [x] | Eliminar `planta.setFechaCreacion(plantaDto.getFechaCreacion())` de la línea 170 | `backend/src/main/java/DeltaFlores/web/utils/DtoMapper.java` | `plantaDtoToPlanta` ya no escribe `fechaCreacion`; un update parcial no la pisa | `SD-3` | 1-2 |
| 1.5 | [x] | Exportar `fechaSiembraSchema` y `fechaSiembraResponseSchema`; agregar `fecha_siembra` a `PlantaDtoSchema` | `frontend/src/schemas/DTOSchemas.ts` | Una sola definición exportada; `PlantaDto` incluye el campo opcional | `SD-7`, `SD-6` | 8-10 |

### Testing

| ID | Estado | Tarea | Archivos | Hecho cuando | Spec | Líneas |
|---|---|---|---|---|---|---|
| 1.6 | [x] | Tests de repositorio: valor explícito persiste; null aplica hoy; `flush`+`clear`+`find` | `backend/src/test/java/DeltaFlores/web/repository/PlantaRepositoryTest.java` | 2-3 tests verdes con PostgreSQL | `SD-1` | 20-26 |
| 1.7 | [x] | Tests de mapper: round-trip, update con `fecha_siembra` null conserva, y update sin `fechaCreacion` la conserva | `backend/src/test/java/DeltaFlores/web/utils/DtoMapperTest.java` | `@Nested` verde; prueba explícita de `fechaCreacion` intacta tras update | `SD-3`, `SD-2` | 24-30 |
| 1.8 | [x] | Crear `PlantaControllerTest` (patrón `ZonaControllerTest`): clave `fecha_siembra` en request y response, campo omitido ⇒ default, fecha futura y formato inválido ⇒ 400, PUT sin campo conserva, alta sin campo (ruta `ZonaGridModal`) responde 201 | `backend/src/test/java/DeltaFlores/web/controller/PlantaControllerTest.java` (nuevo) | Tests verdes si hay PostgreSQL; **CI-gated y NO bloqueante** si el entorno no lo provee | `SD-6`, `SD-5`, `SD-1`, `SD-4` | 45-55 |

**Verificación**: `cd backend && mvn -Dtest=PlantaRepositoryTest,DtoMapperTest test`; `PlantaControllerTest` opcional; `cd frontend && npm run build`.

## Slice 2 — Formularios (PR 2, base `main` tras PR 1)

**Entrega**: el alta deja de descartar la fecha y la edición permite corregirla. ~40-55 líneas: el input y el default ya existen.

### Infraestructura

Sin tareas. Reutiliza `fechaSiembraSchema` del slice 1.

### Implementación

| ID | Estado | Tarea | Archivos | Hecho cuando | Spec | Líneas |
|---|---|---|---|---|---|---|
| 2.1 | [x] | Importar `fechaSiembraSchema` y borrar la definición local de la línea 39; enviar `fecha_siembra: data.fecha_siembra` en el payload (línea 202) en lugar de `fechaCreacion` | `frontend/src/components/forms/NewPlantForm.tsx` | El POST lleva `fecha_siembra`; no queda schema local duplicado; default (86) e input (361) intactos | `SD-7`, `SD-6` | 8-12 |
| 2.2 | [x] | Agregar `fechaSiembra: fechaSiembraSchema.optional()` al schema, default `initialData?.fecha_siembra || ''`, payload `fecha_siembra: data.fechaSiembra || null` e input date junto a `fechaFin` (225-231) | `frontend/src/components/forms/FormularioPlanta.tsx` | Crear y editar precargan y envían la fecha; vacío envía null y el backend conserva | `SD-3`, `SD-7` | 28-38 |

### Testing

| ID | Estado | Tarea | Archivos | Hecho cuando | Spec | Líneas |
|---|---|---|---|---|---|---|
| 2.3 | [x] | Verificación manual (no hay runner): crear con fecha, editar la fecha, guardar sin tocarla, y alta desde `ZonaGridModal` sin campo | Dev server + DevTools Network | Payload y response muestran `fecha_siembra`; edición sin campo conserva el valor; alta masiva recibe hoy; `npm run build` verde | `SD-1`, `SD-3`, `SD-4`, `SD-7` | 0 |

## Slice 3 — Cálculo semanal + etapas (PR 3, base `main` tras PR 2)

**Entrega**: util puro y paleta compartida listos, sin consumidores nuevos. Revierte sin tocar la UI.

### Infraestructura

| ID | Estado | Tarea | Archivos | Hecho cuando | Spec | Líneas |
|---|---|---|---|---|---|---|
| 3.1 | [x] | Crear `lib/etapas.ts`: `ETAPA_COLORS` (`as const`), `Etapa`, `ETAPA_LABELS`, `WEEK_ZERO_LABELS` (`GERMINACION`→"Semilla", `PLANTIN`→"Esqueje"), `getEtapaColor`, `getEtapaLabel` | `frontend/src/lib/etapas.ts` (nuevo) | Exporta la API del design; TypeScript compila; un solo origen de colores/etiquetas | `WT-4`, `WT-2`, `WT-10` | 35-45 |

### Implementación

| ID | Estado | Tarea | Archivos | Hecho cuando | Spec | Líneas |
|---|---|---|---|---|---|---|
| 3.2 | [x] | Reescribir tipos y helpers: `TIMELINE_MAX_RAIL_WEEKS = 52`, `TimelineWeek` ampliado, `toUtcDay`/`diffDays` por string, `calculateCurrentWeek` 0-indexada; borrar `differenceInWeeks` y la línea 44 | `frontend/src/utils/timelineUtils.ts` | Sin `differenceInWeeks`; semanas calculadas por días UTC; rango `startDate..endDate` inclusivo | `WT-1` | 45-55 |
| 3.3 | [x] | Implementar `buildWeeklyTimeline(planta, events)`: `anchor = fecha_siembra ?? fechaCreacion`, `0..max(current, eventos)`, `STAGE_CHANGE` ordenados por `(fecha, id)`, `base = changes[0]?.etapaAnterior ?? planta.etapa`, propagación con clamp, `hasPreSowingEvents`; sin truncar a 52 | `frontend/src/utils/timelineUtils.ts` | Semana 0 siempre `base`; cambios se propagan; eventos previos caen en 0; plantas de 60 semanas devuelven 0..60 | `WT-1`, `WT-2`, `WT-3`, `WT-7`, `WT-8`, `WT-9` | 45-55 |
| 3.4 | [x] | Importar `getEtapaColor` y borrar el mapa local (11-17) | `frontend/src/components/plants/PlantListView.tsx` | Usa el módulo compartido; sin `ETAPA_COLORS` local | `WT-4` | 5-8 |
| 3.5 | [x] | Importar `getEtapaLabel` y borrar el mapa local (19-25) | `frontend/src/components/plants/PlantProfile.tsx` | Usa el módulo compartido; sin `ETAPA_LABELS` local | `WT-2`, `WT-4` | 5-8 |

### Testing

| ID | Estado | Tarea | Archivos | Hecho cuando | Spec | Líneas |
|---|---|---|---|---|---|---|
| 3.6 | [x] | Validar los 8 casos dorados del design §4 con `console.table` temporal en dev: sin eventos hoy, sin eventos hace 20 días, evento día 0, bordes +6/+7, cambio +14, evento previo, planta de 60 semanas, dos cambios en semana 3 | `frontend/src/utils/timelineUtils.ts` (temporal, no se commitea) | Los 8 resultados coinciden con la tabla; `console.table` eliminado | `WT-1`, `WT-2`, `WT-3`, `WT-6`, `WT-7`, `WT-8` | 0 |
| 3.7 | [x] | Auditoría estática: `rg "differenceInWeeks\|Vegetación' : 'Floración"` y schemas locales duplicados | `frontend/src` | Sin coincidencias; `npm run build` verde | `WT-1`, `SD-7` | 0 |

## Slice 4 — Riel + lista agrupada (PR 4, base `main` tras PR 3)

**Entrega**: `/plant/:id` con índice semanal clicable y bitácora agrupada. Revertir devuelve la lista plana.

### Infraestructura

| ID | Estado | Tarea | Archivos | Hecho cuando | Spec | Líneas |
|---|---|---|---|---|---|---|
| 4.1 | [x] | Crear `WeeklyStageRail`: `weeks`, `activeWeek`, `onWeekClick`; `nav aria-label`, botones `S{n} · {label}`, `aria-current`, color por etapa, atenuado si no hay eventos, máx. 52 chips con `slice(0, TIMELINE_MAX_RAIL_WEEKS)` | `frontend/src/components/plants/WeeklyStageRail.tsx` (nuevo) | Renderiza ≤52 chips, texto de etapa siempre visible y click emite el número de semana | `WT-4`, `WT-5`, `WT-10` | 60-70 |

### Implementación

| ID | Estado | Tarea | Archivos | Hecho cuando | Spec | Líneas |
|---|---|---|---|---|---|---|
| 4.2 | [x] | En la página: `activeWeek`, `useMemo` de `buildWeeklyTimeline(planta, events)` con **todos** los eventos, montar el riel entre `PlantProfile` y `EventFilters`, y `scrollIntoView` a `#week-group-{n}` sin tocar el filtro | `frontend/src/pages/PlantDetailPage.tsx` | Click scrollea al grupo; cambiar filtro no recalcula etapas ni resetea el filtro | `WT-3`, `WT-5`, `WT-9` | 35-45 |
| 4.3 | [x] | Reemplazar la lista plana (129-153) por `section id="week-group-{n}"` con header `Semana {n} · {label}`, rango `{startLabel} – {endLabel}`, badge "Antes de la siembra", `EventCard`, "Sin eventos" si el filtro vacía la semana; conservar banner 126-128 | `frontend/src/pages/PlantDetailPage.tsx` | Semanas vacías existen como destino; eventos >51 visibles en la lista; filtro solo afecta el render | `WT-4`, `WT-5`, `WT-6`, `WT-8`, `WT-11` | 45-60 |

### Testing

| ID | Estado | Tarea | Archivos | Hecho cuando | Spec | Líneas |
|---|---|---|---|---|---|---|
| 4.4 | [x] | Verificación manual: semana 0 con `GERMINACION`/`PLANTIN`/sin cambios, click a semana vacía, filtro activo, planta de 60 semanas, siembra hoy, evento previo, borrar un `STAGE_CHANGE` y recargar | Dev server + datos sembrados | Todos los escenarios del design se observan; chips distinguibles sin color; `npm run build` verde | `WT-2`, `WT-4`-`WT-10` | 0 |

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | S1 120-160 · S2 40-55 · S3 120-150 · S4 140-180 · **total 420-545** |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 backend+Zod → PR 2 forms → PR 3 cálculo+etapas → PR 4 UI |
| Delivery strategy | ask-always |
| Chain strategy | stacked-to-main |

```text
Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium
```

| Unit | Goal | Likely PR | Base / notes |
|---|---|---|---|
| 1 | Backend `fecha_siembra` + Zod | PR 1 | `main`; shippable solo; `PlantaControllerTest` CI-gated no bloqueante |
| 2 | Formularios de alta/edición | PR 2 | `main` tras PR 1; 40-55 líneas |
| 3 | Cálculo + etapas compartidas | PR 3 | `main` tras PR 2; sin consumidores nuevos |
| 4 | Riel + lista agrupada | PR 4 | `main` tras PR 3; revertir restaura la lista plana |

El total supera el presupuesto de 400 líneas, así que un PR único no es viable; cada slice queda en ≤180 líneas y es revertible por separado. El riesgo es Medio y no Alto porque ningún slice se acerca al límite, pero las estimaciones son aproximadas y la verificación manual del frontend (sin runner) puede agregar churn. `PlantaControllerTest` se mantiene opcional para no bloquear apply si CI no tiene PostgreSQL; no hay backfill ni migración de datos.

## Cadena final de PRs (enmienda de verify)

La auditoría de review (§7 del `verify-report.md`) mostró que el Slice 1 real es de **498 líneas** (534 contando el `GlobalExceptionHandler` de +36 agregado en el fix batch), de las cuales **319 son `PlantaControllerTest`**. Para que cada PR quede por debajo del presupuesto de 400 líneas, el Slice 1 se parte en dos PRs encadenados. La cadena final queda en **5 PRs**:

| PR | Entrega | Contenido | Líneas aprox. |
|---|---|---|---:|
| `1a` | Backend core + contrato Zod + handler 400 + tests de repo/mapper | `Planta.java`, `PlantaDto.java`, `DtoMapper.java`, `GlobalExceptionHandler.java`, `PlantaRepositoryTest`, `DtoMapperTest`, `DTOSchemas.ts` | ~215 |
| `1b` | Test HTTP del controller | `PlantaControllerTest.java` (nuevo) | ~319 |
| `2` | Formularios de alta/edición | `NewPlantForm.tsx`, `FormularioPlanta.tsx` | ~19 |
| `3` | Cálculo semanal + etapas compartidas | `etapas.ts`, `timelineUtils.ts`, `PlantListView.tsx`, `PlantProfile.tsx` | ~339 |
| `4` | Riel + lista agrupada | `WeeklyStageRail.tsx`, `PlantDetailPage.tsx` | ~148 |
| **Total** | | | **≈ 1040** |

- `PlantaControllerTest` se entrega en el PR **`1b`**, **después** de `1a`. `1b` depende de `1a` (usa el contrato `fecha_siembra` y el `PlantaDto` del core).
- **Corrección de bookkeeping (archive)**: `GlobalExceptionHandler.java` (+36 líneas, handler `400` para `MethodArgumentNotValidException`/`ConstraintViolationException`) forma parte del fix batch del CRITICAL #1 y se asigna al PR **`1a`**. Con eso `1a` pasa de ~179 a **~215** líneas. La tabla anterior omitía el archivo y subestimaba el PR.
- Con esta partición ningún PR supera las 400 líneas (máximo: PR `3` con ~339), por lo que **no se requiere `size:exception`**.
- Los slices 2, 3 y 4 conservan su numeración original (PR 2, 3 y 4), apuntando a `main` tras el PR anterior (`stacked-to-main`).
