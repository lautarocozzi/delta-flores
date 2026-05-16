# 🏁 PRD CHECKPOINT: Criterios de Éxito - Proyecto FloresDelta

**Versión:** 1.0
**Estado:** En Progreso
**Propósito:** Definir los criterios claros e innegociables que determinarán el éxito del MVP y la calidad del producto final. Este documento se utilizará para validar cada entrega.

---

## 1. CRITERIOS DE ÉXITO TÉCNICO (INFRAESTRUCTURA)

### ✅ Backend (Spring Boot)
- [x] **Compilación:** El proyecto compila con `mvn clean install` sin errores.
- [x] **Tests:** Existen tests de integración para `LogService` y `PlantEventService` que pasan exitosamente.
- [ ] **Seguridad Prod:** `ddl-auto` está configurado en `validate` o `none` para producción. Secretos usan variables de entorno.
- [x] **Eficiencia:** La carga de la Bitácora General (`getAllEvents`) se realiza en **una sola consulta SQL** (sin problema N+1).

### ✅ Frontend (React/Vite)
- [x] **Build:** El proyecto compila con `npm run build` sin errores ni advertencias críticas.
- [ ] **Performance:** Las consultas de datos estáticos (Salas, Cepas, Nutrientes) tienen `staleTime` configurado para evitar recargas innecesarias.
- [x] **Arquitectura:** La estructura de carpetas sigue el modelo `feature-based` (propuesto en la fase de adaptación).

---

## 2. CRITERIOS DE ÉXITO FUNCIONAL (USER EXPERIENCE)

### 👤 Gestión de Usuario
- [ ] **Login/Registro:** Flujo fluido, manejo de errores de credenciales, redirección correcta.
- [ ] **Sesión:** Auto-logout robusto ante expiración de token (401). El usuario nunca ve una pantalla rota por falta de sesión.

### 🌱 Gestión de Cultivos (Core)
- [ ] **CRUD Completo:** Creación, Edición y Eliminación de Salas, Cepas y Plantas.
- [ ] **Validaciones:** Formularios validan datos obligatorios y formatos (ej. pH numérico) antes de enviar.
- [ ] **Feedback:** Todas las acciones de creación/edición muestran notificaciones `toast` de éxito o error claras.

### 📝 Bitácora (El Corazón del Producto)
- [ ] **Bitácora General:** Muestra todos los eventos. Filtros por Sala, Planta, Tipo y Fecha funcionan correctamente en el backend.
- [ ] **Bitácora por Planta:** Muestra el historial cronológico. Permite registrar nuevos eventos con la planta pre-seleccionada.
- [ ] **Edición:** Se pueden editar y eliminar eventos existentes desde la interfaz.
- [ ] **Tipos de Eventos:** Soportados: Riego, Poda, Nota (con archivos), Nutriente, Foto, Cambio de Etapa.

---

## 3. CRITERIOS DE ÉXITO ESTRATÉGICO (VISIÓN DEL SOCIO)

### 🛠️ Herramientas y Navegación
- [ ] **Menú Optimizado:** Sin "Inventario". "Nutrientes" renombrado. Acceso rápido a Plantas por Sala.
- [x] **Panel de Control:** Existe una vista dedicada para la gestión de maestros (Salas, Cepas, Nutrientes).
- [ ] **Nutrición Masiva:** Funcionalidad para aplicar un nutriente a múltiples plantas (o toda una sala) en una sola acción.

### 📊 Valor Agregado
- [ ] **Visualización Growdiaries:** La bitácora de planta tiene una representación visual de línea de tiempo/etapas.
- [ ] **Métricas:** Dashboard muestra gráficos de proyección o resumen semanal basados en datos reales.
- [ ] **Exportación:** El usuario puede descargar sus datos (Bitácora General) en formato CSV/Excel.

---

## 4. DEFINITION OF DONE (DoD) PARA EL MVP

El MVP se considerará completo cuando:
1.  Todos los items de la sección **1. CRITERIOS DE ÉXITO TÉCNICO** estén marcados.
2.  El flujo crítico de usuario (Registro -> Crear Sala -> Crear Planta -> Registrar Riego -> Ver en Bitácora) se pueda realizar sin errores en un dispositivo móvil y escritorio.
3.  El código fuente del backend y frontend esté sincronizado en el repositorio remoto.
