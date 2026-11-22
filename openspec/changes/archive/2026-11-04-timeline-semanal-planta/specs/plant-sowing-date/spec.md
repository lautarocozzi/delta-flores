# Delta for plant-sowing-date

## ADDED Requirements

### Requirement: Persistencia y default de `fechaSiembra` al crear

Al crear una planta, el sistema MUST persistir la fecha de siembra en una columna propia de la tabla `plantas`, independiente de `fechaCreacion`. Si el request omite `fecha_siembra` o lo envía `null`, el backend MUST asignar la fecha de registro del servidor (`LocalDate.now()`) al persistir. `fechaCreacion` MUST seguir gestionada por `@CreationTimestamp` y MUST NOT derivarse de la fecha de siembra.

#### Scenario: Creación con fecha de siembra explícita

- GIVEN un `POST /api/plantas` con `fecha_siembra: "2026-01-10"`
- WHEN el backend persiste la planta
- THEN `fechaSiembra` queda en `2026-01-10`
- AND `fechaCreacion` es la fecha del servidor, no `2026-01-10`

#### Scenario: Creación sin el campo

- GIVEN un `POST /api/plantas` sin `fecha_siembra`
- WHEN la planta se crea
- THEN responde `201` y `fechaSiembra` es la fecha de registro del servidor

#### Scenario: Campo enviado como `null`

- GIVEN un `POST /api/plantas` con `fecha_siembra: null`
- WHEN la planta se crea
- THEN se aplica el default de registro y la creación no falla

### Requirement: Exposición de `fechaSiembra` en el detalle

`GET /api/plantas/{id}` MUST incluir `fecha_siembra` en formato `yyyy-MM-dd`. La respuesta MUST NOT exponer `fechaSiembra` como `null` para plantas creadas por esta versión.

#### Scenario: Lectura de una planta con fecha de siembra

- GIVEN una planta con `fechaSiembra = 2026-01-10`
- WHEN se consulta `GET /api/plantas/{id}`
- THEN el body incluye `fecha_siembra: "2026-01-10"`

#### Scenario: Lectura de una planta creada sin el campo

- GIVEN una planta creada sin `fecha_siembra`
- WHEN se consulta el detalle
- THEN `fecha_siembra` devuelve la fecha de registro, nunca `null`

### Requirement: Edición sin mutar `fechaCreacion`

Al actualizar una planta, si el request incluye `fecha_siembra` no nula, el sistema MUST actualizarla. Si el campo se omite o llega `null`, el sistema MUST conservar el valor existente. En ningún caso la edición MUST modificar `fechaCreacion`.

#### Scenario: Edición de la fecha de siembra

- GIVEN una planta con `fechaCreacion = 2026-01-01` y `fechaSiembra = 2025-12-01`
- WHEN se actualiza con `fecha_siembra: "2025-11-15"`
- THEN `fechaSiembra` pasa a `2025-11-15`
- AND `fechaCreacion` sigue siendo `2026-01-01`

#### Scenario: Edición sin enviar el campo

- GIVEN una planta con `fechaSiembra = 2025-12-01`
- WHEN se actualiza sin `fecha_siembra`
- THEN `fechaSiembra` conserva `2025-12-01` y no se resetea a hoy

### Requirement: Alta masiva sin el campo

El alta masiva desde `ZonaGridModal` MUST seguir funcionando sin enviar `fecha_siembra`; cada planta creada MUST recibir el default de registro.

#### Scenario: Volcado de zona completa

- GIVEN un volcado de zona que crea N plantas sin `fecha_siembra`
- WHEN se ejecutan las N altas
- THEN todas responden exitosamente
- AND cada `fechaSiembra` es la fecha de registro del servidor

### Requirement: Validación de `fecha_siembra`

El sistema MUST rechazar con `400` una fecha futura y un formato distinto de ISO `yyyy-MM-dd`. SHOULD rechazar con `400` una fecha anterior a `1900-01-01`. Las fechas pasadas válidas MUST aceptarse.

#### Scenario: Fecha futura

- GIVEN un `POST /api/plantas` con `fecha_siembra` posterior a hoy
- WHEN se valida el request
- THEN responde `400` y no se persiste la planta

#### Scenario: Formato inválido

- GIVEN `fecha_siembra: "10/01/2026"`
- WHEN se valida el request
- THEN responde `400`

#### Scenario: Fecha absurdamente antigua

- GIVEN `fecha_siembra: "1800-01-01"`
- WHEN se valida con la configuración por defecto
- THEN responde `400`

#### Scenario: Fecha pasada válida

- GIVEN `fecha_siembra: "2025-06-01"`
- WHEN se crea la planta
- THEN responde `201` y persiste la fecha

### Requirement: Contrato de wire y naming

El contrato HTTP MUST usar la clave `fecha_siembra` (snake_case) para la fecha de siembra. El backend MUST aceptarla en ese nombre y MUST NOT interpretar `fechaCreacion` como fecha de siembra. El mecanismo de mapeo a `fechaSiembra` queda para el design. La respuesta SHOULD exponer la misma clave `fecha_siembra`.

> Contexto verificado: `NewPlantForm.tsx:202` envía hoy `fechaCreacion: data.fecha_siembra` y el backend la descarta porque `Planta.fechaCreacion` es `@CreationTimestamp`. Este change MUST mover ese valor a su propio campo.

#### Scenario: Request con la clave correcta

- GIVEN `POST /api/plantas` con `fecha_siembra: "2025-10-01"`
- WHEN el backend procesa el request
- THEN persiste `fechaSiembra = 2025-10-01`

#### Scenario: Cliente legado que envía `fechaCreacion`

- GIVEN `POST /api/plantas` con `fechaCreacion: "2025-01-01"` y sin `fecha_siembra`
- WHEN se crea la planta
- THEN `fechaSiembra` es la fecha de registro
- AND `2025-01-01` no se usa como fecha de siembra

### Requirement: Fuente única de la definición Zod

MUST existir una única definición exportada del campo `fecha_siembra` en los schemas Zod. `NewPlantForm` MUST consumir esa definición y MUST NOT mantener un schema local duplicado para el campo. La validación de request y de response MUST usar la misma definición.

#### Scenario: Formulario usa el schema compartido

- GIVEN la definición exportada del campo `fecha_siembra`
- WHEN `NewPlantForm` valida el formulario
- THEN usa esa definición, sin una copia local del campo

#### Scenario: Detección de duplicado

- GIVEN una segunda definición local de `fecha_siembra`
- WHEN se audita el código
- THEN la definición duplicada MUST eliminarse
