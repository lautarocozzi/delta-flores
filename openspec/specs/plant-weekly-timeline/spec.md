# plant-weekly-timeline

## Purpose

Cálculo y renderizado del timeline semanal de una planta: numeración de semanas 0-indexada y day-based anclada en la fecha de siembra, etapa efectiva por semana derivada de los eventos `STAGE_CHANGE`, riel de chips clicable y lista de eventos agrupada por semana.

Origen: change `timeline-semanal-planta` (archivado el 2026-11-04). Todos los requisitos de esta capacidad fueron agregados por ese change.

## Requirements

### Requirement: Numeración de semanas 0-indexada y day-based

El sistema MUST calcular la semana de un evento como `floor(diffDays(fechaSiembra, fechaEvento) / 7)`, con semanas 0-indexadas y días normalizados a medianoche. `differenceInWeeks` MUST NOT usarse. La semana N MUST abarcar los offsets de día `[7N, 7N+6]` desde `fechaSiembra`.

#### Scenario: Evento el día de siembra

- GIVEN `fechaSiembra = 2026-01-01` y un evento el `2026-01-01`
- WHEN se calcula la semana
- THEN el evento pertenece a la semana `0`

#### Scenario: Borde de semana

- GIVEN un evento en `fechaSiembra + 6 días`
- WHEN se calcula la semana
- THEN pertenece a la semana `0`
- AND un evento en `fechaSiembra + 7 días` pertenece a la semana `1`

#### Scenario: Semanas posteriores

- GIVEN un evento en `fechaSiembra + 13 días`
- WHEN se calcula
- THEN pertenece a la semana `1`
- AND `+14 días` pertenece a la semana `2`

#### Scenario: Prohibición de `differenceInWeeks`

- GIVEN el módulo de cálculo de semanas
- WHEN se revisa su implementación
- THEN no usa `differenceInWeeks`

### Requirement: Etapa de la semana 0

La etapa de la semana 0 MUST ser `etapaAnterior` del primer `STAGE_CHANGE` ordenado por `fecha` ascendente. Si no existen `STAGE_CHANGE`, MUST usar `Planta.etapa` como fallback. Solo en la semana 0, `GERMINACION` MUST etiquetarse "Semilla" y `PLANTIN` MUST etiquetarse "Esqueje".

#### Scenario: Primer cambio desde germinación

- GIVEN un primer `STAGE_CHANGE` con `etapaAnterior = GERMINACION`
- WHEN se deriva la etapa de la semana 0
- THEN la etiqueta es "Semilla"

#### Scenario: Primer cambio desde plantín

- GIVEN un primer `STAGE_CHANGE` con `etapaAnterior = PLANTIN`
- WHEN se deriva la etapa de la semana 0
- THEN la etiqueta es "Esqueje"

#### Scenario: Sin cambios de etapa

- GIVEN una planta sin `STAGE_CHANGE` y `Planta.etapa = VEGETACION`
- WHEN se deriva la semana 0
- THEN la etiqueta es "Vegetación"

#### Scenario: Orden por fecha, no por inserción

- GIVEN dos `STAGE_CHANGE` donde el de menor `fecha` se insertó después
- WHEN se deriva la semana 0
- THEN se usa `etapaAnterior` del de menor `fecha`

### Requirement: Etapa efectiva por semana con propagación

Para cada semana N, el sistema MUST tomar la `nuevaEtapa` del último `STAGE_CHANGE` con `fecha <= fin de semana N`, donde fin de semana N = `fechaSiembra + 7N + 6 días` inclusive. Si no existe ninguno, MUST usar la etapa de la semana 0. La etapa MUST propagarse hacia adelante a través de semanas vacías.

#### Scenario: Cambio en la semana 2

- GIVEN un `STAGE_CHANGE` a `FLORACION` en la semana 2
- WHEN se calculan las semanas 0 a 4
- THEN las semanas 0 y 1 mantienen la etapa previa
- AND las semanas 2, 3 y 4 muestran `FLORACION`

#### Scenario: Dos cambios en la misma semana

- GIVEN dos `STAGE_CHANGE` dentro de la semana 3
- WHEN se calcula esa semana
- THEN prevalece el de `fecha` mayor

#### Scenario: Semana vacía intermedia

- GIVEN cambios en semana 1 y semana 4, sin eventos en 2 y 3
- WHEN se renderizan las semanas
- THEN las semanas 2 y 3 heredan la etapa de la semana 1

#### Scenario: Cambio en el último día de la semana

- GIVEN un `STAGE_CHANGE` en `fechaSiembra + 7N + 6`
- WHEN se calcula la semana N
- THEN el cambio aplica a la semana N

### Requirement: Renderizado del riel de semanas

Cada chip MUST mostrar el número de semana y la etiqueta de etapa con el formato `S{n} · {etapa}`. Cada `NuevaEtapa` MUST tener un color distinto provisto por un módulo compartido de colores y etiquetas. Las semanas sin eventos MUST renderizarse atenuadas pero presentes. El riel MUST renderizar como máximo 52 chips, cubriendo `0..min(semanaActual, 51)`.

#### Scenario: Semana con eventos

- GIVEN una semana con eventos
- WHEN se renderiza el riel
- THEN su chip se muestra en estilo normal con `S{n} · {etapa}`

#### Scenario: Semana sin eventos

- GIVEN una semana intermedia sin eventos
- WHEN se renderiza el riel
- THEN el chip existe y se muestra atenuado

#### Scenario: Tope de 52 semanas

- GIVEN una planta en la semana 60
- WHEN se renderiza el riel
- THEN se muestran 52 chips (semanas 0 a 51)
- AND los eventos posteriores a la semana 51 siguen visibles en la lista agrupada

#### Scenario: Consistencia de color

- GIVEN dos plantas en la misma etapa
- WHEN se renderizan sus chips
- THEN ambos usan el mismo color del módulo compartido

### Requirement: Interacción del chip

Un click en un chip MUST hacer scroll al grupo de esa semana en la lista agrupada de eventos. El click MUST NOT alterar el filtro de tipo de evento activo. Si el filtro activo deja la semana sin eventos visibles, el grupo de esa semana MUST seguir existiendo como destino del scroll.

#### Scenario: Click navega a la semana

- GIVEN el chip de la semana 3
- WHEN el usuario hace click
- THEN la vista hace scroll al grupo "Semana 3"

#### Scenario: Semana vacía como destino

- GIVEN una semana sin eventos
- WHEN el usuario hace click en su chip
- THEN el scroll llega al grupo vacío de esa semana

#### Scenario: Filtro activo

- GIVEN un filtro de tipo que oculta todos los eventos de la semana 5
- WHEN el usuario hace click en el chip de la semana 5
- THEN el grupo de la semana 5 existe y recibe el scroll
- AND el filtro seleccionado no cambia

### Requirement: Planta sin eventos

Una planta sin eventos MUST renderizar las semanas `0..current`, donde `current = floor(diffDays(hoy, anchor) / 7)` y `anchor = fecha_siembra ?? fechaCreacion`. Cada semana MUST marcarse como vacía (`hasEvents = false`) y MUST usar la etapa de fallback derivada de `Planta.etapa` (la etiqueta especial de semana 0 aplica cuando corresponda).

#### Scenario: Planta sin ningún evento

- GIVEN una planta sin eventos, con `anchor = fecha_siembra ?? fechaCreacion` y `current = floor(diffDays(hoy, anchor) / 7)`
- WHEN se renderiza el timeline
- THEN se renderizan las semanas `0..current`
- AND cada semana tiene `hasEvents = false`
- AND cada semana usa la etapa de fallback derivada de `Planta.etapa`

#### Scenario: Eventos no-STAGE_CHANGE

- GIVEN una planta con eventos de riego pero sin `STAGE_CHANGE`
- WHEN se renderiza el timeline
- THEN se muestran las semanas hasta la actual
- AND todas heredan la etapa derivada de `Planta.etapa`

> **Nota de cambio de spec (verify)**: el escenario original decía “planta sin eventos ⇒ solo semana 0”, lo que contradecía la historia de usuario (“ver las semanas de vida de la planta”) y la decisión del design §11 (`0..current`). Una planta sembrada hace 20 días tiene 3 semanas de vida; mostrar solo la semana 0 oculta su edad. El escenario se corrigió durante verify para alinear spec y diseño. Es una **enmienda deliberada de la spec**, no un arreglo del código: la implementación ya renderiza `0..current` y permanece sin cambios.

### Requirement: Planta creada hoy

Si `fechaSiembra` es hoy, el timeline MUST renderizar únicamente la semana 0.

#### Scenario: Siembra hoy sin eventos

- GIVEN `fechaSiembra = hoy` y sin eventos
- WHEN se renderiza el timeline
- THEN solo existe el chip de la semana 0

#### Scenario: Siembra hoy con eventos

- GIVEN `fechaSiembra = hoy` y eventos fechados hoy
- WHEN se renderiza el timeline
- THEN todos los eventos caen en la semana 0
- AND no se renderizan semanas negativas ni posteriores

### Requirement: Eventos anteriores a `fechaSiembra`

Los eventos con `fecha < fechaSiembra` (semana calculada negativa) MUST asignarse a la semana 0 y MUST NOT descartarse silenciosamente. La UI SHOULD indicar que el evento precede a la fecha de siembra.

#### Scenario: Evento previo a la siembra

- GIVEN un evento 10 días antes de `fechaSiembra`
- WHEN se agrupa el timeline
- THEN el evento aparece en la semana 0
- AND no se pierde

#### Scenario: Varios eventos previos

- GIVEN tres eventos anteriores a `fechaSiembra`
- WHEN se agrupa
- THEN los tres aparecen en la semana 0

#### Scenario: Sin semanas negativas

- GIVEN eventos anteriores a `fechaSiembra`
- WHEN se renderiza el riel
- THEN no existe ningún chip con número negativo

### Requirement: Recalculo ante borrado de eventos

El timeline MUST recalcularse desde los eventos actuales en cada render y MUST NOT usar una etapa cacheada. Tras borrar un `STAGE_CHANGE` —incluido el caso en que `Planta.etapa` revierte a `GERMINACION` sin historial— las semanas MUST reflejar los eventos restantes y las reglas de fallback.

#### Scenario: Borrado de un cambio intermedio

- GIVEN semanas que mostraban `FLORACION` por un `STAGE_CHANGE` borrado
- WHEN se recalcula el timeline
- THEN esas semanas vuelven a la etapa del cambio anterior restante

#### Scenario: Borrado de todo el historial de etapas

- GIVEN una planta cuyo último `STAGE_CHANGE` se borra y `Planta.etapa` queda en `GERMINACION`
- WHEN se recalcula
- THEN las semanas usan la etapa de fallback derivada de `GERMINACION`

#### Scenario: Sin etapa obsoleta

- GIVEN un evento de etapa eliminado
- WHEN se renderiza el timeline
- THEN no se muestra la etapa del evento eliminado

### Requirement: Accesibilidad del riel

Cada chip MUST incluir la etiqueta de etapa como texto; el color MUST NOT ser el único portador de significado. El contraste SHOULD cumplir WCAG AA.

#### Scenario: Lectura sin color

- GIVEN una vista en escala de grises
- WHEN el usuario lee un chip
- THEN puede distinguir la etapa por su etiqueta textual

#### Scenario: Daltonismo

- GIVEN una simulación de daltonismo
- WHEN se comparan chips de etapas distintas
- THEN las etiquetas siguen diferenciándolas

### Requirement: Fuera de alcance

Este change MUST NOT agregar paridad en vistas públicas, diario de fotos o métricas, ni un endpoint backend de timeline. Estas capacidades MUST NOT introducirse en esta iteración.

#### Scenario: Sin endpoint de timeline

- GIVEN el change aplicado
- WHEN se inspeccionan las rutas del backend
- THEN no existe un endpoint de timeline

#### Scenario: Vista pública sin cambios

- GIVEN una vista pública de planta
- WHEN se abre
- THEN no se agregó el riel semanal

#### Scenario: Sin diario de fotos

- GIVEN el alcance del change
- WHEN se revisan los componentes nuevos
- THEN no incluyen diario de fotos ni métricas
