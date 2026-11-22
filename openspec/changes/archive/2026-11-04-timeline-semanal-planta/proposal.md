# Proposal: Timeline semanal de planta

## Intent

`/plant/:id` titula "Historia de Vida Semanal" pero lista eventos sin agrupar. Sin `fechaSiembra`, "Semana N" se ancla en la fecha de registro: **el número sería una mentira**. Este cambio persiste la siembra real, arregla la pérdida de datos de `NewPlantForm` y monta el acceso semanal con etapa derivada de `STAGE_CHANGE`.

## Scope

**In:** `Planta.fechaSiembra` (opcional, default fecha de registro vía `@PrePersist`), DTO/mapper/Zod/tests; alta y edición en `NewPlantForm` y `FormularioPlanta` (`ZonaGridModal` no la envía → default); cálculo día-based 0-indexado; riel de chips + lista agrupada; módulo compartido de colores/etiquetas.

**Out:** campo de tipo de propagación; diario de fotos/métricas; endpoint backend de timeline; paridad en vistas públicas; test runner de frontend.

## User Stories & Acceptance Criteria

**US-1** Corregir fecha de siembra al crear/editar.
1. `POST /api/plantas` con `fechaSiembra` la persiste y `GET` la devuelve.
2. Sin el campo, se guarda la fecha de registro.
3. Editarla no altera `fechaCreacion`.

**US-2** Ver semanas de vida.
4. Semana = `floor(diffDays(fechaSiembra, fechaEvento)/7)`, 0-indexada.
5. Riel de semana 0 a la actual (tope 52).
6. Semanas vacías visibles y atenuadas.

**US-3** Ver etapa vigente por semana.
7. Semana 0 = `etapaAnterior` del primer `STAGE_CHANGE` por `fecha` asc; fallback `Planta.etapa`.
8. `GERMINACION`→"Semilla", `PLANTIN`→"Esqueje" solo en semana 0.
9. Cada semana toma el último `STAGE_CHANGE` con `fecha <= fin de semana`, propagado.
10. Color según `ETAPA_COLORS`.

## Capabilities

**New:** `plant-sowing-date` (persistencia/default/edición de siembra); `plant-weekly-timeline` (semanas y etapa por semana).
**Modified:** None.

## Approach

**Backend.** `Planta.java`: `LocalDate fechaSiembra` + `@PrePersist` que aplica `LocalDate.now()` si es null (cubre las 3 altas sin tocarlas). `PlantaDto`: campo opcional. `DtoMapper`: mapeo bidireccional; en update setea solo si viene no-null. `PlantaService` sin cambios. **No hay migración versionada**: `ddl-auto=update` agrega la columna nullable al bootear.

**Cálculo — fuente única: util de frontend.** `timelineUtils.ts` se reescribe puro. Se **reutilizan y corrigen** `calculateCurrentWeek()` (0-indexada, día-based) y `groupEventsByWeek()` → `buildWeeklyTimeline()` con etapa desde eventos; **se elimina la etapa falsa de la línea 44** (`i < 4 ? 'Vegetación' : 'Floración'`). Justificación: un solo consumidor, `planta` y `events` ya se descargan (un endpoint duplicaría payload y exigiría dos rutas público/privado) y mantiene chico el slice backend. Riesgo: sin runner; se mitiga con funciones puras y casos dorados.

**UI.** `PlantDetailPage.tsx`: `<WeeklyStageRail>` entre `PlantProfile` y `EventFilters` (~117-119); la lista (~126-154) se agrupa por semana. Chip `S{n} · {etapa}` coloreado; click → scroll.

**Colores.** Nuevo `lib/etapas.ts` con `ETAPA_COLORS`/`ETAPA_LABELS`; `PlantListView` y `PlantProfile` importan de ahí.

**Antecedente.** `PlantTimeline.tsx`/`WeeklyEventLog.tsx` se borraron en `18ecac0` por código muerto: nunca se montaron ni derivaban etapa. Distinto ahora: integración real, etapa desde eventos, ancla `fechaSiembra`, colores compartidos.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `backend/src/main/java/DeltaFlores/web/entities/Planta.java` | Modified | campo + default |
| `backend/src/main/java/DeltaFlores/web/dto/PlantaDto.java` | Modified | campo opcional |
| `backend/src/main/java/DeltaFlores/web/utils/DtoMapper.java` | Modified | mapeo bidireccional |
| `backend/src/test/java/DeltaFlores/web/repository/PlantaRepositoryTest.java` | Modified | persistencia/default |
| `backend/src/test/java/DeltaFlores/web/utils/DtoMapperTest.java` | Modified | round-trip |
| `frontend/src/schemas/DTOSchemas.ts` | Modified | `fechaSiembra` opcional |
| `frontend/src/components/forms/NewPlantForm.tsx` | Modified | enviar `fechaSiembra` |
| `frontend/src/components/forms/FormularioPlanta.tsx` | Modified | campo create/edit |
| `frontend/src/utils/timelineUtils.ts` | Rewritten | cálculo puro |
| `frontend/src/lib/etapas.ts` | New | colores/etiquetas |
| `frontend/src/components/plants/WeeklyStageRail.tsx` | New | riel de chips |
| `frontend/src/pages/PlantDetailPage.tsx` | Modified | montar riel + agrupar |
| `frontend/src/components/plants/PlantListView.tsx` | Modified | importar colores |
| `frontend/src/components/plants/PlantProfile.tsx` | Modified | importar etiquetas |

## Chained PR Plan

| Slice | Contenido | Líneas | Depende | Rollback |
|---|---|---|---|---|
| 1 | Backend `fechaSiembra` + Zod | 110-140 | — | Revertir; columna nullable inofensiva o `ALTER TABLE plantas DROP COLUMN fecha_siembra` |
| 2 | `NewPlantForm` + `FormularioPlanta` | 70-100 | 1 | Revertir; default sigue vigente |
| 3 | `timelineUtils` + `lib/etapas.ts` + imports | 120-160 | 2 runtime | Revertir; aún sin consumidores nuevos |
| 4 | `WeeklyStageRail` + `PlantDetailPage` | 140-180 | 3 | Revertir; vuelve la lista plana |

Cada slice es autónomo y verificable. `delivery_strategy=ask-always`: apply confirma el encadenado antes de empezar.

## Rollback Plan

1. Revertir slice 4: `/plant/:id` vuelve a lista plana.
2. Revertir slices 3-2: cálculo y forms quedan inertes.
3. Revertir slice 1: se deja de leer `fechaSiembra`. `ddl-auto=update` **no borra columnas**; el rollback de esquema es manual con `ALTER TABLE plantas DROP COLUMN fecha_siembra;`.
4. Sin migración destructiva ni backfill obligatorio.

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Frontera de semana mal calculada | High | `floor(diffDays/7)` sobre fechas normalizadas; prohibido `differenceInWeeks` |
| Etapa falsa heredada | High | Borrar línea 44; derivar solo de eventos |
| Etapas retroceden al borrar `STAGE_CHANGE` | Med | Recalcular desde eventos; documentar supuesto semana 0 |
| `ddl-auto=update` sin versión | Med | Columna nullable; rollback manual; validar en staging |
| Altas masivas sin fecha | Med | Campo opcional + `@PrePersist` |
| Sin test runner frontend | Med | Funciones puras; migrar a backend con 2º consumidor |
| Exceso de chips en plantas viejas | Low | Tope 52 |
| `fecha` sin hora muestra `00:00` | Low | Usar fecha pura |

## Open Questions

Ninguna bloqueante (las decisiones del usuario resolvieron los bloqueos).

| # | Pregunta | Tipo | Recomendación |
|---|---|---|---|
| 1 | ¿Riel, lista o ambos? | No bloqueante | Ambos: riel índice + lista agrupada |
| 2 | ¿Tope 52 o 104? | No bloqueante | 52 configurable |
| 3 | ¿Agregar Vitest? | No bloqueante | Diferir |
| 4 | ¿Paridad pública? | No bloqueante | Fuera de alcance |
| 5 | ¿Siembra obligatoria al editar? | No bloqueante | Opcional en API, precargada en UI |

## Alternatives Considered

- **Anclar en `fechaCreacion`** — rechazada: mide registro, no vida; contradice la story.
- **Campo nuevo de propagación** — rechazada: derivable del primer `STAGE_CHANGE` o `Planta.etapa`.
- **Endpoint backend de timeline** — rechazada por ahora: un consumidor, duplica payload, dos rutas; reconsiderar con el segundo.
- **Solo lista vertical** — rechazada: no cumple "acceso rápido".
- **Solo riel** — rechazada: pierde la referencia y el detalle.

## Success Criteria

- [ ] `fechaSiembra` persiste, se devuelve y es editable; sin valor cae al registro.
- [ ] `NewPlantForm` deja de descartar la fecha.
- [ ] Semana 0 se etiqueta Semilla/Esqueje con fallback a `Planta.etapa`.
- [ ] Cada semana muestra etapa y color consistentes.
- [ ] `differenceInWeeks` y la etapa hardcodeada ya no existen.
- [ ] Tests backend y `npm run build` pasan; cada slice < 400 líneas.
