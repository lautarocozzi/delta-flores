# CHECKPOINT DE TESTING MANUAL - Flores Delta MVP
**Fecha**: 22 de Diciembre de 2025, 15:25
**Estado del Sistema**: Backend iniciando, Frontend activo

---

## 🎯 Objetivos del Checkpoint

Validar que todas las funcionalidades críticas del MVP funcionan correctamente antes de considerar el proyecto listo para entrega.

---

## ✅ Pre-requisitos (Verificar antes de empezar)

- [ ] Docker Desktop corriendo
- [ ] Contenedor PostgreSQL UP (comando: `docker ps`)
- [ ] Backend Spring Boot corriendo (puerto 8080)
- [ ] Frontend Vite corriendo (puerto 8081)
- [ ] Puedes acceder a http://localhost:8081

---

## 📋 PLAN DE TESTING

### FASE 1: Autenticación y Seguridad (CRÍTICO)

#### Test 1.1: Login Exitoso
**Pasos**:
1. Ir a http://localhost:8081
2. Debería redirigir automáticamente a `/login`
3. Ingresar credenciales válidas
4. Click en "Ingresar"

**Resultado Esperado**: 
- ✅ Redirección a `/dashboard`
- ✅ Aparece toast "¡Bienvenido!"
- ✅ Sidebar muestra nombre de usuario

**Si falla**: Verificar logs del backend para ver error 401 o 500.

---

#### Test 1.2: Login con Credenciales Inválidas
**Pasos**:
1. Intentar login con password incorrecta

**Resultado Esperado**:
- ✅ Toast de error "Error en el inicio de sesión"
- ✅ Usuario permanece en `/login`

---

#### Test 1.3: Logout
**Pasos**:
1. Desde el dashboard, abrir sidebar
2. Click en "Cerrar Sesión"

**Resultado Esperado**:
- ✅ Redirección a `/login`
- ✅ Intentar acceder a `/dashboard` debe redirigir a login

---

### FASE 2: Panel de Control (Entidades Maestras)

#### Test 2.1: Crear Nueva Sala
**Pasos**:
1. Ir a Panel de Control (sidebar o `/configuracion`)
2. Tab "Mis Espacios"
3. Click "+ Nueva Sala"
4. Llenar nombre (ej: "Sala Test A")
5. Guardar

**Resultado Esperado**:
- ✅ Toast "Sala creada"
- ✅ Sala aparece en la lista
- ✅ Sala aparece en el carrusel del Dashboard

---

#### Test 2.2: Crear Nueva Genética
**Pasos**:
1. Panel de Control → Tab "Catálogo de Genéticas"
2. Click "+ Nueva Genética"
3. Llenar datos:
   - Nombre: "Northern Lights Test"
   - Genética Parental: "Indica"
   - Banco: "Sensi Seeds"
4. Guardar

**Resultado Esperado**:
- ✅ Toast "Genética registrada"
- ✅ Aparece en lista de genéticas

---

#### Test 2.3: Crear Nutriente en Catálogo
**Pasos**:
1. Panel de Control → Tab "Productos" (antes "Inventario")
2. Click "+ Nuevo Producto"
3. Nombre: "Top Veg Test"
4. Descripción: "Fertilizante vegetativo"
5. Guardar

**Resultado Esperado**:
- ✅ Toast "Producto Registrado"
- ✅ Aparece en catálogo
- ✅ Título dice "Catálogo de Nutrientes" (NO "Inventario")

---

### FASE 3: Gestión de Plantas (CORE)

#### Test 3.1: Crear Planta desde Menú Rápido
**Pasos**:
1. Dashboard → Click botón "+" flotante (abajo derecha)
2. Seleccionar "Nueva Planta"
3. Llenar formulario:
   - Nombre: "PLT-TEST-001"
   - Sala: Seleccionar "Sala Test A"
   - Genética: Seleccionar "Northern Lights Test"
   - Etapa: PLANTIN
4. Guardar

**Resultado Esperado**:
- ✅ Toast "Planta creada"
- ✅ Planta aparece en Dashboard
- ✅ Aparece en el carrusel de "Sala Test A"
- ✅ **ORDENAMIENTO**: Si hay varias plantas, verificar que estén alfabéticamente ordenadas

---

#### Test 3.2: Ver Detalle de Planta (Bitácora)
**Pasos**:
1. Click en la tarjeta de "PLT-TEST-001"
2. Debería abrir `/plant/{id}`

**Resultado Esperado**:
- ✅ Encabezado muestra nombre de planta y genética
- ✅ Sección "Historia de Vida Semanal" visible
- ✅ Botón "+ Registrar Evento" visible
- ✅ Si no hay eventos: mensaje "Sin historia aún"

---

### FASE 4: Eventos y Bitácora Visual (GROWDIARIES)

#### Test 4.1: Registrar Riego
**Pasos**:
1. Desde detalle de planta, click "+ Registrar Evento"
2. Seleccionar tipo "Riego"
3. Llenar datos:
   - pH: 6.5
   - EC: 1.2
   - Temp: 22
4. Guardar

**Resultado Esperado**:
- ✅ Toast "Evento registrado"
- ✅ Evento aparece en timeline
- ✅ Icono de gota azul
- ✅ Agrupado en "Semana 1" (o la semana correspondiente)

---

#### Test 4.2: Registrar Nota Multimedia (Audio + Texto + Foto)
**Pasos**:
1. "+ Registrar Evento" → "Nota"
2. Escribir texto: "Planta se ve saludable"
3. Click "Grabar Audio" → Hablar 3 segundos → "Detener"
4. Adjuntar una imagen desde tu PC
5. Guardar

**Resultado Esperado**:
- ✅ Toast "Nota guardada"
- ✅ Nota aparece en timeline con:
  - Icono de nota
  - Texto visible
  - Reproductor de audio visible
  - Imagen (thumbnail 24x24px)

---

#### Test 4.3: Verificar Timeline Visual (Growdiaries)
**Pasos**:
1. Registrar al menos 3 eventos diferentes (riego, poda, nota)
2. Observar la bitácora

**Resultado Esperado**:
- ✅ Eventos agrupados por semana
- ✅ Línea de tiempo vertical con badges de etapa
- ✅ Cada evento tiene icono de color distintivo
- ✅ Opciones de Editar/Eliminar visibles al hover

---

### FASE 5: Funcionalidades Avanzadas

#### Test 5.1: Nutrientes Masivos
**Pasos**:
1. Crear al menos 3 plantas en "Sala Test A"
2. Ir a Panel de Control → Tab "Riego Masivo"
3. Filtrar por "Sala Test A"
4. Seleccionar nutriente "Top Veg Test"
5. Marcar 2 plantas con checkbox
6. Click "Aplicar Nutrientes"

**Resultado Esperado**:
- ✅ Toast "Se aplicó el nutriente a 2 plantas"
- ✅ Al ver bitácora de cada planta, aparece el evento de nutriente

---

#### Test 5.2: Favoritos
**Pasos**:
1. Desde tarjeta de planta, click en icono de corazón
2. Ir a Sidebar → "Favoritos"

**Resultado Esperado**:
- ✅ Planta marcada aparece en página de Favoritos
- ✅ Plantas ordenadas alfabéticamente

---

#### Test 5.3: Exportar Bitácora (CSV)
**Pasos**:
1. Ir a "Bitácoras" (sidebar)
2. Aplicar filtro de fecha
3. Click "Exportar CSV"

**Resultado Esperado**:
- ✅ Se descarga archivo CSV
- ✅ Contiene eventos filtrados

---

### FASE 6: UX/UI y Navegación

#### Test 6.1: Carruseles
**Pasos**:
1. Dashboard con al menos 4 salas creadas
2. Verificar flechas de navegación en carrusel de salas

**Resultado Esperado**:
- ✅ Flechas < > visibles
- ✅ Carrusel se desliza suavemente
- ✅ Mismo comportamiento en carrusel de plantas

---

#### Test 6.2: Menú de Acciones Rápidas
**Pasos**:
1. Click en botón "+" flotante

**Resultado Esperado**:
- ✅ Opciones visibles:
  - Nueva Planta
  - Registrar Riego
  - Registrar Poda
  - Añadir Nutrientes
  - Tomar Foto
  - Nueva Nota
- ✅ **NO debe aparecer**: "Nueva Sala" ni "Nueva Genética"

---

#### Test 6.3: Responsive Mobile
**Pasos**:
1. Reducir ventana del browser a ~375px de ancho
2. Navegar por Dashboard

**Resultado Esperado**:
- ✅ Sidebar se colapsa a menú hamburguesa
- ✅ Carruseles ajustan a 1 item por vista
- ✅ Formularios se reorganizan en columna

---

## 🐛 REGISTRO DE BUGS ENCONTRADOS

**Usar esta sección para documentar cualquier problema durante el testing:**

### Bug #1: [Título]
- **Severidad**: Alta/Media/Baja
- **Pasos para reproducir**: 
- **Comportamiento esperado**:
- **Comportamiento actual**:
- **Screenshot/Log**: 

---

## 📊 RESUMEN DE RESULTADOS

| Fase | Tests Ejecutados | Pasados | Fallados | % Éxito |
|------|------------------|---------|----------|---------|
| Fase 1: Autenticación | 3 | - | - | - |
| Fase 2: Panel Control | 3 | - | - | - |
| Fase 3: Plantas | 2 | - | - | - |
| Fase 4: Bitácora | 3 | - | - | - |
| Fase 5: Avanzadas | 3 | - | - | - |
| Fase 6: UX/UI | 3 | - | - | - |
| **TOTAL** | **17** | **-** | **-** | **-%** |

---

## ✅ CRITERIOS DE ACEPTACIÓN GLOBAL

Para considerar el MVP listo:
- [ ] **100% de Fase 1 pasada** (Autenticación es CRÍTICA)
- [ ] **Al menos 90% de Fases 2-4 pasadas** (Funcionalidad CORE)
- [ ] **Al menos 70% de Fases 5-6 pasadas** (Features avanzadas)
- [ ] **Bugs críticos = 0**
- [ ] **URLs hardcodeadas corregidas** (ejecutar `fix-planttimeline-url.ps1`)

---

**Instrucciones**: Ejecuta cada test en orden. Marca ✅ o ❌ según resultado. Si encuentras bugs, documéntalos inmediatamente en la sección de registro.
