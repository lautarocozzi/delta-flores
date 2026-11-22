# Timeline semanal de planta — Exploración

> **Estado**: investigación cerrada. **Bloqueante**: falta decidir el *ancla de la semana 0* (ver [](#7-ancla-de-la-semana-0--el-bloqueante-real)).
> **Veredicto corto**: el modelo de datos actual **no tiene fecha de siembra persistida**. La UI pide una, el backend la descarta. Hay que arreglar eso antes de poder dibujar un timeline con número de semana fiable.

---

## 1. Contexto y pedido del usuario

**User story**: *Como usuario quiero entrar al detalle de la planta y ver un acceso rápido semanal a sus eventos, viendo en qué etapa está en cada semana.*

| # | Criterio de aceptación (del pedido) | Estado |
|---|---|---|
| 1 | Acceso rápido semanal en `/plant/:id` | Nuevo |
| 2 | Mostrar el número de semana de vida de la planta | Nuevo |
| 3 | Mostrar en qué etapa está en cada semana, vía eventos `STAGE_CHANGE` | Parcial — los eventos existen, el agrupado no |
| 4 | Un color distinto por etapa | Existe un mapa de colores, pero en otra pantalla |
| 5 | La semana 0 puede ser germinación (semilla) o plantín (esqueje) | **Bloqueante** — no hay dato que lo distinga |
| 6 | Modelado sobre GrowDiaries como referencia | Verificado (sección 3) |

---

## 2. Resumen ejecutivo — lo que hay que saber antes de decidir nada

Cuatro hechos verificados en el código que cambian la forma de encarar esto:

1. **Ya existe lógica de semanas, pero está muerta.** `frontend/src/utils/timelineUtils.ts` ya tiene `calculateCurrentWeek()` y `groupEventsByWeek()`. No tiene consumidores. Un intento anterior (`PlantTimeline.tsx`, `WeeklyEventLog.tsx`) se borró en `18ecac0` por el audit de código muerto porque nunca se montó en ninguna página. **La razón por la que este feature "no existe" es que nunca se integró, no que no se haya empezado.**

2. **No hay mapa de color de etapas pendiente de crear.** Ya existe en `PlantListView.tsx` (`ETAPA_COLORS`) y las etiquetas en `PlantProfile.tsx` (`ETAPA_LABELS`). Reutilizar, no reinventar — y conviene extraerlos a un módulo compartido.

3. **La fecha de siembra se pide y se tira.** `NewPlantForm.tsx:202` envía `fechaCreacion: data.fecha_siembra` con un campo obligatorio "Fecha de siembra". Pero `Planta.fechaCreacion` está anotada `@CreationTimestamp`, y el Javadoc de Hibernate dice literalmente *"A field annotated @CreationTimestamp **may not be directly set by the application program**"*. El insert la sobreescribe con la fecha del día. **Es pérdida de datos silenciosa ya en producción.**

4. **No existe campo de tipo de propagación.** No hay `semilla`/`clone`/`esqueje` en `Planta`, ni en `PlantaDto`, ni en el schema Zod. La semana 0 no se puede desambiguar.

---

## 3. Referencia visual — GrowDiaries

URL: `https://growdiaries.com/diaries/307921-grow-journal-by-nofeckingclue79` · **Fetch realizado y verificado ✅**

**Cómo es realmente la página** (descripción verificada, no de memoria):

- Es una **lista vertical cronológica de entradas semanales**, no un riel horizontal de chips.
- Cada entrada se titula `Week N. <Etapa>`: *"Week 1. Vegetation"*, *"Week 2. Vegetation"*, … *"Week 5. Flowering"*, … *"Week 13. Harvest"*.
- Cada entrada lleva: hasta 5 fotos, una grilla de métricas (altura, schedule de luz, temperatura del aire, pH, olor, PPM/TDS, humedad, temperatura de solución y sustrato, temperatura nocturna, volumen de riego, distancia de lámpara, CO₂, maceta), lista de nutrientes y las notas del groweista.
- Semana de cosecha visualmente especial: título *"Happy Harvest Day!"*, resumen de 85 días, rating de la cepa, efectos, sabor.
- Etiquetas de **"Used techniques"** por semana (p. ej. *Strategical leaf tucking* en semana 3, *Defoliation* en 9, 11 y 12).

### La divergencia que hay que decidir

El usuario pidió "acceso rápido", pero GrowDiaries es un diario largo. No son lo mismo:

| Opción | Descripción | A favor | En contra |
|---|---|---|---|
| **A. Riel horizontal de chips** | Una tira `S0 S1 S2 S3 …` coloreada por etapa; click filtra los eventos de esa semana | Escaneo visual inmediato, cumple "acceso rápido", cabe junto a `PlantProfile` | No escala en móvil, no muestra contenido sin click |
| **B. Lista vertical por semana** (como GrowDiaries) | Secciones `Semana 5 · Floración` con sus eventos adentro | Es literalmente la referencia; ya existió en el repo (`PlantTimeline.tsx`); escala mejor y es móvil-friendly | Es "bitácora", no "acceso rápido"; duplica el `EventCard` que ya renderiza la página |

> **Recomendación**: **A + B combinadas** — riel horizontal de chips como *índice* clickeable arriba, que hace scroll/filtrado hacia la lista vertical agrupada por semana que ya existe abajo. Se satisface "acceso rápido" y se respeta la referencia sin reemplazar la bitácora actual.

---

## 4. Estado actual: modelo de datos (backend)

Rutas bajo `backend/src/main/java/DeltaFlores/web/`.

### Entidades

| Entity | Archivo | Datos relevantes |
|---|---|---|
| `Planta` | `entities/Planta.java` | `id`, `user`, `nombre`, `isPublic`, `cepa`, `etapa` (STRING), `sala`, `zona`, `columnaEnZona`, `filaEnZona`, `fechaCreacion` (LocalDate, `@CreationTimestamp`), `produccion`, `fechaFin`, `ubicacion`, `imagenUrl`, `events` (M2M `plants_has_events`) |
| `NuevaEtapa` | `entities/NuevaEtapa.java` | Enum: `GERMINACION`, `PLANTIN`, `VEGETACION`, `FLORACION`, `COSECHADA` |
| `PlantEvent` | `entities/PlantEvent.java` | Abstracta, `SINGLE_TABLE`, discriminador `event_type`. Campos: `id`, `plantas` (M2M), `fecha` (LocalDate, `@CreationTimestamp`) |
| `StageChangeEvent` | `entities/StageChangeEvent.java` | `@DiscriminatorValue("STAGE_CHANGE")`. Campos: `nuevaEtapa`, `etapaAnterior` |

> ⚠️ **Corrección al research previo**: los paths reales son
> `web/utils/DtoMapper.java` (no `web/dto/DtoMapper.java`) y
> `web/service/events/StageChangeEventService.java` (no `web/service/`).

### DTOs

| DTO | Archivo | Campos |
|---|---|---|
| `PlantEventDto` (abstract) | `dto/PlantEventDto.java` | `id`, `fecha`, `plantaIds`, `eventType` |
| `StageChangeEventDto` | `dto/StageChangeEventDto.java` | + `nuevaEtapa`, `etapaAnterior` |
| `PlantaDto` | `dto/PlantaDto.java` | `etapa`, `fechaCreacion`, `fechaFin`, `sala` (nested), `cepaDto` (nested), `eventIds`, `produccion` |

Mapper polimórfico en `utils/DtoMapper.java`: `plantEventToPlantEventDto()` despacha por `instanceof` y setea `eventType` como string (`"STAGE_CHANGE"`, etc.).

### Endpoints

| Método | Ruta | Autorización | Archivo |
|---|---|---|---|
| GET | `/api/plantas/{plantaId}/events` | `GROWER` o `ADMIN` + chequeo de ownership | `controller/PlantEventController.java:24` |
| GET | `/api/plantas/{plantaId}/events/public` | Pública, exige `planta.isPublic` | `controller/PlantEventController.java:44` |
| GET | `/api/plantas/{id}` | `GROWER`/`ADMIN`/`SUPER_ADMIN` | `controller/PlantaController.java:72` |

Ambos eventos ordenan ascendente por fecha vía `PlantEventRepository.findByPlantasIdOrderByFechaAsc`.

### Reglas de negocio de cambio de etapa (`service/events/StageChangeEventService.java`)

| Operación | Comportamiento |
|---|---|
| `createStageChangeEvent` | Toma `etapaAnterior` de **`plantas.get(0).getEtapa()`** (representativa en cambios masivos), actualiza `Planta.etapa = nuevaEtapa` en todas |
| `updateStageChangeEvent` | Reemplaza `fecha` y `nuevaEtapa`; **no** recalcula `etapaAnterior` |
| `deleteStageChangeEvent` | Revierte: toma el último evento restante por `findTopByPlantas_IdOrderByFechaDescIdDesc`; si no hay historial, **fuerza `GERMINACION`** |

> Nota para el cálculo: el orden real de las transiciones **no** está garantizado por el enum (`COSECHADA` no está al final de forma significativa) y los eventos pueden editarse o borrarse. El timeline tiene que derivarse de los eventos, nunca asumir la progresión del enum.

---

## 5. Estado actual: frontend `/plant/:id`

Ruta declarada en `frontend/src/app/routes.tsx:35`, **dentro de `ProtectedRoute`** (requiere login).

### Página — `pages/PlantDetailPage.tsx`

| Elemento | Detalle |
|---|---|
| Queries | `['planta', id]` → `getPlantaById`; `['plantEvents', id]` → `getPlantEvents` |
| Estado local | `selectedEventType`, `isDeletePlantOpen` |
| Filtro | `filteredEvents` (useMemo) + `eventCounts` |
| Layout | `<PlantProfile/>` → `<EventFilters/>` → lista de `<EventCard/>` |

> Ya existe un encabezado **"Historia de Vida Semanal"** (línea 127) sobre la lista vertical actual, pero **no hay nada semanal debajo**: es la lista de eventos sin agrupar. El nombre promete lo que la pantalla todavía no cumple.

### Componentes relacionados

| Componente | Archivo | Rol |
|---|---|---|
| `PlantProfile` | `components/plants/PlantProfile.tsx` | Etapa actual (`ETAPA_LABELS`), "Tiempo Activa" vía `differenceInDays(new Date(), planta.fechaCreacion)`, sala, ubicación, genética, foto, toggle de visibilidad |
| `EventFilters` | `components/plants/EventFilters.tsx` | Select + badges de acceso rápido por tipo, con contadores |
| `EventCard` | `components/plants/EventCard.tsx` | Icono/color por `eventType`, fecha `dd MMM yyyy, HH:mm`; `STAGE_CHANGE` renderiza `nuevaEtapa` |
| `PlantListView` | `components/plants/PlantListView.tsx` | **Contiene `ETAPA_COLORS`** — el mapa de color por etapa que ya existe |
| `WeeklyCalendarStrip` | `components/dashboard/WeeklyCalendarStrip.tsx` | Calendario semanal "estilo GWJ" (Lun–Dom + expand a mes), usado en `Dashboard.tsx`. Precedente visual de "strip" en el repo |

### Punto de inserción natural

Entre `PlantProfile` y `EventFilters` (líneas 117–119 de `PlantDetailPage.tsx`). El riel de chips entra ahí; la agrupación por semana reemplaza el `<div>` de la lista (líneas 126–154).

### Tipos

- `PlantaDto` **no es una interface**: se re-exporta desde los schemas Zod en `schemas/DTOSchemas.ts` vía `interfaces/Planta.ts`. `fechaCreacion: z.string()` (ISO `yyyy-MM-dd`), `etapa: z.enum([...])`.
- `BackendEvent` sí es interface propia (`interfaces/Eventos.ts`), con `nuevaEtapa?: string`.

---

## 6. Cálculo de semanas: dónde hacerlo

| | **Opción A — 100% frontend** | **Opción B — endpoint backend que devuelve el modelo de semanas** |
|---|---|---|
| **Cómo** | Reusar/extender `timelineUtils.groupEventsByWeek()` con `planta.fechaCreacion` + eventos `STAGE_CHANGE` ya cargados | Nuevo `GET /api/plantas/{id}/timeline` que devuelve `[{ semana, etapa, desde, hasta, eventos }]` |
| **Acoplamiento** | Cero cambios en backend | Regla de negocio de timeline vive en el dominio |
| **Testabilidad** | ❌ El frontend **no tiene test runner** (`package.json` no declara `vitest`/`jest`) → lógica de fechas sin pruebas | ✅ JUnit 5 + MockMvc + AssertJ ya disponibles |
| **Reuso** | Solo en `/plant/:id` | Reusable en `SalaDetailPage`, `Dashboard`, `MainLogPage`, cards públicas |
| **Payload** | Ninguno (ya se traen `planta` + `events`) | Endpoint nuevo; riesgo de duplicar datos ya descargados |
| **Paridad público/privado** | Trivial: el mismo componente, misma query | Hay que exponer **dos** endpoints (hoy ya existen dos: `/events` y `/events/public`) y mantenerlos alineados |

**Tradeoff de fondo**: la opción A es más rápida y no toca el backend, pero mete lógica de negocio de cultivation en un repo sin tests. La opción B cuesta un endpoint más y tests, pero es la única que deja la regla "qué etapa está en la semana N" verificada y reutilizable.

> **Recomendación**: **A ahora, con la función pura aislada y testeable, B solo si aparece un segundo consumidor.**
> El frontend no tiene runner de tests, así que la mitigación es tratar `timelineUtils.ts` como módulo puro con funciones deterministas y Easy de testear *cuando* se instale el runner. Si el timeline termina apareciendo en 2+ pantallas (el Dashboard es un candidato obvio, ya tiene `WeeklyCalendarStrip`), entonces **B gana** y conviene saltar directo ahí.
>
> Esto depende de la decisión de la sección siguiente: **si hay que agregar `fechaSiembra` a la tabla `plantas`, ya se está tocando el esquema — y en ese caso B cuesta marginalmente más caro.**

---

## 7. Ancla de la semana 0 — el bloqueante real

### El problema, con evidencia

`Planta.fechaCreacion` **no es una fecha de siembra**. Cadena verificada:

```
NewPlantForm.tsx:202   payload.fechaCreacion = data.fecha_siembra   ← obligatorio, "Fecha de siembra"
  → apiService.createPlanta  →  POST /api/plantas
  → PlantaService.createPlanta:168   DtoMapper.plantaDtoToPlanta(new Planta(), plantaDto, ...)
  → DtoMapper.java:170              planta.setFechaCreacion(plantaDto.getFechaCreacion())
  → Planta.java:62                  @CreationTimestamp   ← Hibernate sobreescribe en el INSERT
  → Hibernate 6.6 Javadoc:  "A field annotated @CreationTimestamp may not be
                              directly set by the application program"
```

**Consecuencia**: la fecha de siembra que el grower escribe se pierde. Todas las plantas "nacen" hoy.

### Y hay una inconsistencia de creación Multiple

Tres caminos de alta, con semántica distinta de `fechaCreacion`:

| Camino | Archivo | ¿Envía `fechaCreacion`? | Fecha que queda en BD |
|---|---|---|---|
| Formulario de registro de evento | `components/forms/NewPlantForm.tsx:202` | ✅ Sí (obligatorio) | Fecha del insert (valor perdido) |
| Formulario de planta | `components/forms/FormularioPlanta.tsx:71-78` | ❌ No | Fecha del insert |
| Alta masiva por grilla de zona | `components/sala/ZonaGridModal.tsx:141, 175, 231` | ❌ No | Fecha del insert |

Además, **el formulario de edición** (`FormularioPlanta.tsx`) solo expone `fechaFin` — una vez creada la planta, **no se puede corregir la fecha de inicio desde la UI**.

### El caso "semilla vs plantín"

No hay ningún campo de tipo de propagación. Búsqueda de `propagacion|semilla|esqueje|fechaSiembra|fechaGerminacion` en `backend/src` y `frontend/src`: **cero coincidencias** (solo menciones en textos de marketing, `FeaturesSection.tsx:9`).

La única pista disponible es `Planta.etapa` en el momento del alta (todos los formularios lo piden) y el `nuevaEtapa` del primer `STAGE_CHANGE`.

### Opciones para el ancla

| # | Opción | Cómo | Costo | Calidad del dato |
|---|---|---|---|---|
| **1** | **Derivar del primer `STAGE_CHANGE`** | Semana 0 = semana de la fecha del primer evento `STAGE_CHANGE`; su `nuevaEtapa` es la etapa | Bajo | ⚠️ Si no hay eventos, no hay timeline. El primer cambio suele venir *después* de la germinación → las semanas iniciales se pierden |
| **2** | **`fechaCreacion` tal cual** | Anclar en la fecha del registro en BD | Muy bajo | ⚠️ Es "semanas desde que la registraste", no "semanas de vida". Falso pero nunca falla |
| **3** | **Agregar `fechaSiembra` a `Planta`** | Nueva columna `LocalDate` editable + fecha obligatoria en los 3 formularios de alta + editable post-creación | Medio-alto (migración + 4 pantallas) | ✅ Único que da la verdad de campo |
| **4** | **Fallback en cascada** | `fechaSiembra` ?? `fechaCreacion`; y si no hay eventos, mostrar timeline vacío con CTA | Bajo | ✅ Degrada con honestidad |

> **Recomendación: opción 3 + 4.** Agregar `fechaSiembra` real es la corrección de fondo — **arregla también el bug de pérdida de datos que ya existe hoy**, no solo esta feature. Y con el fallback en cascada, las ~plantas ya creadas (con `fechaCreacion` = hoy) siguen mostrando un timeline razonable en vez de romperse.
>
> Si el usuario quiere el feature **sin tocar el esquema**, el mínimo honesto es **opción 4 sin la columna**: anclar en `fechaCreacion`, etiquetar el bloque como *"Semanas desde el registro"* (no "de vida") y no prometer la semana 0 de germinación/plantín.

---

## 8. Decisiones abiertas para el usuario

Ordenadas por dependencia. Las marcadas 🔴 bloquean la spec.

| # | Pregunta | Opciones | Recomendación |
|---|---|---|---|
| 🔴 1 | **¿Ancla de la semana 0?** | (a) Agregar `fechaSiembra` a `Planta` · (b) Usar `fechaCreacion` y etiquetar "desde el registro" · (c) Derivar del primer `STAGE_CHANGE` | **(a)** — además arregla la pérdida de datos actual. Si se quiere evitar migrar, (b) como mínimo |
| 🔴 2 | **¿Se agrega el campo de propagación (semilla/clon/plantín)?** | (a) Sí, campo nuevo · (b) No; inferir de `etapa` inicial · (c) No; mostrar la semana 0 sin etiqueta de origen | **(b)** con fallback: usar `Planta.etapa` del alta como etiqueta de la semana 0. Agregar el campo es alcance extra para un beneficio chico |
| 3 | **¿Cómo se determina la etapa de cada semana?** | (a) Último `STAGE_CHANGE` con fecha ≤ fin de semana, propagate hacia adelante · (b) Etapa *al inicio* de la semana · (c) Etapa *al final* de la semana | **(a)** — es la lectura mental correcta ("en qué etapa estaba durante esa semana") y es robusta a semanas sin eventos |
| 4 | **Mapa de colores por etapa** | (a) Reusar `ETAPA_COLORS` de `PlantListView` y extraerlo a un módulo compartido · (b) Paleta nueva | **(a)** — consistencia gratis; hoy el color ya significa algo en el producto |
| 5 | **Rango de semanas** | (a) 0 → semana actual · (b) 0 → última semana con eventos · (c) 0 → semana de cosecha (`etapa === COSECHADA`) | **(a)** con tope máximo (p. ej. 52) para que una planta olvidada no genere 300 chips |
| 6 | **Interacción** | (a) Click en chip = scroll a esa semana · (b) Click = filtra la lista · (c) Sin interacción, solo información | **(a)**, que es literalmente "acceso rápido". Reutiliza el `selectedEventType`/scroll existente sin agregar un filtro nuevo |
| 7 | **Semanas sin eventos** | (a) Chip con color atenuado / sin borde · (b) Ocultas (rail compactado) | **(a)** — el patrón de GrowDiaries es una entrada por semana, aunque esté vacía; además revela "estuvo quieta 3 semanas", que es información real |
| 8 | **Semana de cosecha** | (a) Estilo especial como en GrowDiaries · (b) Solo el color `COSECHADA` | **(a)** — el finish merece cierre visual; es el momento que el grower quiere encontrar |
| 9 | **¿Dónde se calcula?** | (a) Frontend · (b) Endpoint backend | **(a)** por ahora, **(b)** si aparece un segundo consumidor |
| 10 | **¿Acceso público?** | (a) Solo `/plant/:id` (autenticado, como hoy) · (b) También en vistas públicas (`SalaDetailPage`) | **(a)** — `/plant/:id` está dentro de `ProtectedRoute`; extender a público es otro cambio |

---

## 9. Pronóstico de tamaño y riesgos

### Archivos tocados — escenario mínimo (frontend, sin migración)

| Archivo | Cambio | Líneas ~ |
|---|---|---|
| `frontend/src/utils/timelineUtils.ts` | Reescribir: etapa por semana, colores, semana 0 | 80–120 |
| `frontend/src/components/plants/WeeklyStageRail.tsx` | Nuevo: riel de chips | 90–130 |
| `frontend/src/pages/PlantDetailPage.tsx` | Montar el riel + agrupar la lista | 30–60 |
| `frontend/src/lib/etapas.ts` (nuevo) | Extraer `ETAPA_COLORS` / `ETAPA_LABELS` | 20–30 |
| `frontend/src/components/plants/PlantListView.tsx` | Importar el módulo extraído | 5 |
| **Total** | | **~230–345** |

### Escenario con `fechaSiembra` (opción 3 del ancla)

| Archivo | Cambio | Líneas ~ |
|---|---|---|
| `backend/.../entities/Planta.java` | + `fechaSiembra` | 3 |
| `backend/.../dto/PlantaDto.java` | + `fechaSiembra` (zod también) | 6 |
| `backend/.../utils/DtoMapper.java` | mapear en ambos sentidos | 4 |
| `frontend/src/schemas/DTOSchemas.ts` | + `fechaSiembra` | 2 |
| `NewPlantForm` / `FormularioPlanta` / `ZonaGridModal` | 3 formularios de alta + 1 de edición | 60–90 |
| Tests backend | `PlantaRepositoryTest` / nuevo test de servicio | 40–60 |
| **Total** | | **+115–165** |

**Presupuesto de revisión: 400 líneas** (del preflight). El escenario mínimo entra justo. El escenario completo **lo excede** → conviene **PR encadenado**: PR 1 = backend + persistencia de `fechaSiembra`; PR 2 = timeline en frontend.

### Riesgos técnicos

| # | Riesgo | Severidad | Mitigación |
|---|---|---|---|
| 1 | **Frontera de semana mal calculada.** `differenceInWeeks` de `date-fns` cuenta *semanas calendario* contra la fecha de origen; un evento del domingo puede caer en la semana 4 vs 5 según la hora. | 🔴 Alta | Regla explícita y testeada: `floor(diffDays / 7)` sobre fechas normalizadas a medianoche. Nada de `differenceInWeeks` a ciegas |
| 2 | **El código muerto existente tiene una etapa falsa**: `timelineUtils.ts:44` asigna `stage: i < 4 ? 'Vegetación' : 'Floración'` — inventada, no derivada de eventos. | 🔴 Alta | Escribirla de cero. Si se reusa el archivo, **borrar esa línea**: hoy muestran datos falsos |
| 3 | **Etapas que retroceden por borrado de eventos.** `deleteStageChangeEvent` revierte a `GERMINACION` si no queda historial, y `updateStageChangeEvent` no recalcula `etapaAnterior`. | 🟡 Media | El timeline se recalcula siempre desde los eventos actuales, nunca desde estado cacheado |
| 4 | **Volcado de zona crea plantas "de hoy".** 3 rutas de `ZonaGridModal` sin fecha → si se usa `fechaCreacion` como ancla, todas muestra "Semana 1" para plantas yaーニング weeks | 🟡 Media | Es el argumento central a favor de `fechaSiembra` (opción 3) |
| 5 | **Frontera de tiempo en `fecha` + `HH:mm`.** `PlantEvent.fecha` es `LocalDate` (sin hora) pero `EventCard` formatea `HH:mm` → siempre muestra `00:00` | 🟢 Baja | No bloquear: usar `fecha` como fecha pura |
| 6 | **Sin test runner en frontend.** La lógica de semanas no se puede verificar automáticamente. | 🟡 Media | Aislar en funciones puras. Si se toca el esquema (opción 3), los tests backend cubren la regla y el frontend queda como presentación |
| 7 | **Rendimiento con plantas viejas.** Un neglect de 2 años = ~104 semanas de chips | 🟢 Baja | Tope de rango (decisión 5) |

---

## 10. Correcciones al research previo

| Afirmación previa | Realidad verificada |
|---|---|
| `web/dto/DtoMapper.java` | ❌ Es `web/**utils**/DtoMapper.java` |
| `web/service/StageChangeEventService.java` | ❌ Es `web/service/**events**/StageChangeEventService.java` |
| `web/dto/PlantaDto` como DTO simple | ⚠️ El DTO Java es simple, pero el **frontend** no usa una interface: `PlantaDto` se re-exporta de `@/schemas/DTOSchemas` (Zod) |
| "GREENFIELD: no hay cómputo de semanas" | ❌ **Falso.** `frontend/src/utils/timelineUtils.ts` ya tiene `calculateCurrentWeek()` y `groupEventsByWeek()` — sin consumidores |
| "no hay mapa de color por etapa hardcodeado" | ❌ **Falso.** `ETAPA_COLORS` existe en `components/plants/PlantListView.tsx:11-17`; `ETAPA_LABELS` en `PlantProfile.tsx:19-25` |
| "no hay componente timeline/strip" | ⚠️ **Parcial.** No hay componente *montado*, pero existió: `PlantTimeline.tsx` y `WeeklyEventLog.tsx` se borraron en `18ecac0` como código muerto. `WeeklyCalendarStrip.tsx` sigue vivo en `Dashboard.tsx` |
| "punto de inserción natural entre `PlantProfile` y `EventFilters`" | ✅ Correcto, y más preciso: entre las líneas 117–119 de `PlantDetailPage.tsx`. La página ya tiene el título "Historia de Vida Semanal" (línea 127) sin nada semanal debajo |
| "`fechaCreacion` es `@CreationTimestamp`, no fecha de siembra" | ✅ Correcto — **y más grave de lo reportado**: el frontend *pide* una fecha de siembra obligatoria y Hibernate la descarta. Es pérdida de datos en curso, y solo 1 de los 4 caminos de alta la envía |
| Referencia GrowDiaries | ✅ Verificada. Es lista vertical, no rail horizontal — el matiz vertical-vs-horizontal queda incorporado a la decisión 3 |

---

## 11. Conclusión y siguiente paso

**La feature no es greenfield y el bloqueo no es técnico de UI — es de datos.** Hay dos hallazgos que cambian el plan:

1. La lógica de semanas ya existe (muerta) y hay un mapa de colores listo para reusar. El trabajo real es **integrar y corregir**, no construir.
2. La fecha de siembra **se pide al usuario y se descarta**. Arreglar eso no es un extra: es el requisito para que "Semana N" signifique algo, y ya es un bug.

**Qué pedirle al usuario, en este orden:**

1. ¿Agregamos `fechaSiembra` a `Planta` (y arreglar la pérdida de datos), o se entrega el timeline anclado en `fechaCreacion` etiquetado como "semanas desde el registro"? — **decide el resto del alcance y del tamaño del PR**
2. ¿Riel horizontal de chips, lista vertical tipo GrowDiaries, o índice + lista? (sección 3)
3. ¿La etapa de cada semana se toma del último `STAGE_CHANGE` dentro o hasta el final de la semana? (decisión 3)

**Verificación pendiente antes de la propuesta** (5 minutos, pero bloqueante):

> Crear una planta vía `NewPlantForm` con `fecha_siembra` = hoy − 30 días y leer el `GET /api/plantas/{id}` devuelto.
> Si `fechaCreacion` vuelve como hoy → confirma el descarte y valida la opción 3.
> Si vuelve con la fecha de siembra → el Javadoc no aplica como esperamos y hay que revisitar el análisis.

---

**Next**: `sdd-propose` — una vez resueltas las decisiones 🔴 1 y 2.
**Bloqueado hasta**: respuesta del usuario a las preguntas 🔴.