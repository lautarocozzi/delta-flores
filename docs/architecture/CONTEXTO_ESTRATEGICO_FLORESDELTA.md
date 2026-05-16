# 🚀 CONTEXTO ESTRATÉGICO Y TÉCNICO: PROYECTO FLORESDELTA

**Objetivo:** Adaptar y optimizar el frontend (React/Vite) para alinearse perfectamente con el backend existente (Spring Boot/Java) y el "estilo de código" del frontend "molde" (Pegamys), siguiendo las directrices del socio y los hallazgos de auditoría técnica.

---

## 1. ESTADO ACTUAL Y PROGRESO (CHECKPOINT)

### ✅ Logros Alcanzados
*   **Conexión CRUD Básica:** Formularios de Plantas, Salas, Cepas conectados al backend.
*   **Bitácora por Planta (`PlantDetailPage`):** Visualización de eventos y creación, edición, eliminación de todos los tipos de eventos (Riego, Poda, Notas, Nutrientes, Fotos, Cambio de Etapa) funcional.
*   **Bitácora General (`MainLogPage`):** Visualización de todos los eventos del usuario con filtros avanzados y exportación a CSV.
*   **Estabilidad de Sesión:** Implementación de Auto-Logout robusto en el cliente ante errores 401.
*   **UX Mejorada:** Reemplazo de `alert()` por `toast()`, empty states en Dashboard, navegación rápida en menú.
*   **Infraestructura Backend:** Creación de DTOs, Entidades, Repositorios, Servicios y Controladores para `PhotoEvent` y `StageChangeEvent`.

### 🚨 Bloqueos Críticos Actuales
*   **Backend Compilación Fallida (DEL ENTORNO LOCAL):** El backend *interno* (`FLORES-DELTA-FRONTEND/BACKEND`) tiene errores de compilación (`cannot find symbol`, `reached end of file`) en `LogService.java`, `PlantEventRepository.java`, `PlantaRepository.java`, `PhotoEventService.java` debido a problemas con imports y sintaxis generados por IA. **PRIORIDAD MÁXIMA PARA ANTIGRAVITY: Corregir imports y sintaxis para lograr `mvn clean install` exitoso en este backend local.**
*   **Deuda Técnica de Rendimiento (Backend):** Problema N+1 detectado en la carga de eventos (`LogService`). Filtrado de datos realizándose ineficientemente en el cliente.

---

## 2. DIRECTRICES DEL SOCIO (HOJA DE RUTA DETALLADA)

Estas son las instrucciones literales y funcionales a ejecutar:

### Contexto de Repositorios y Estilo
1.  **Backend Maestro (`delta-flores/`):** Esta es la **última versión oficial y "pura" del backend del socio**. Úsala como **referencia absoluta** para la lógica de negocio ideal, DTOs y patrones.
2.  **Frontend Activo (`FLORES-DELTA-FRONTEND/`):** Este es nuestro **entorno de trabajo principal**. Aquí resides tú (Antigravity). Contiene el frontend y una versión **antigua y modificada** del backend (que debemos arreglar para compilar).
3.  **Molde de Código (`pegamys-web/`):** Este es otro frontend del socio. **NO copiar su estética.** Su propósito es ser un **modelo de estilo de código, arquitectura y patrones de diseño** para que el código que generemos en `FLORES-DELTA-FRONTEND/` sea idéntico en "identidad de código" al del socio.

### Navegación y Estructura
4.  **Landing Page:** Minimizar opciones (sacar blog/comunidad). **El primer link debe ir directo al Login.**
5.  **Menú Perfil:** Añadir opciones: `Log Out`, `Perfil`, `Favoritos` (plantas).
6.  **Limpieza de Menú:**
    *   Eliminar opción "Inventario".
    *   Renombrar "Riegos y nutrientes" a solo **"Nutrientes"**.
    *   Sacar "Nueva Genética" y "Nueva Sala" del menú rápido (`+`).

### Funcionalidades Específicas
7.  **Panel de Control (Nuevo):** Crear vista de administración (abajo del dashboard) para modificar Salas, Plantas, Usuarios, Genéticas, Nutrientes.
    *   **Permisos Salas:** Cualquier usuario crea sala. ADMIN/SUPERADMIN ven/editan TODAS. Grower solo las suyas.
8.  **Nutrientes Masivos:**
    *   Se agregan desde el Panel de Control.
    *   Al añadir evento de nutriente: Opción de seleccionar **Sala** -> **Checkbox "Seleccionar Todas"** (o selección múltiple de plantas).
9.  **Nota Multimedia:** El ítem "Nota" debe incluir Audio/Voz, Texto e Imagen en el mismo evento.
10. **Métricas (BI):** Vista semanal, KPIs centrados en entidades del backend, proyección en gráficos.
11. **Ordenamiento:** Las plantas dentro de las salas deben mostrarse en **orden alfabético**.

### UX/UI
12. **Bitácora Visual:** Aplicar estilo "Growdiaries" a la bitácora de planta (línea de tiempo, colores por etapa).
13. **Dashboard:** Implementar **Carrusel** para las tarjetas de plantas.
14. **Responsive:** Prioridad total al diseño móvil/adaptable.

---

## 3. AUDITORÍA TÉCNICA (HALLAZGOS A RESOLVER)

1.  **Eficiencia Backend (N+1):** `LogService` carga eventos de forma ineficiente. **Solución:** Implementar `JOIN FETCH` en `PlantEventRepository` (`findAllByPlantsInWithDetails`).
2.  **Filtrado en Cliente:** `MainLogPage` filtra en memoria. **Solución:** Mover lógica al backend recibiendo parámetros en `LogController`.
3.  **Seguridad:** `ddl-auto=update` debe pasar a `validate`. Secretos en `application.properties` deben usar variables de entorno.
4.  **Calidad:** Implementar tests de integración (Backend) y unitarios (Frontend).
5.  **Frontend Performance:** Aplicar `staleTime` en React Query (ya iniciado).

---

## 4. PLAN DE ACCIÓN PARA GOOGLE ANTIGRAVITY

**Fase 1: Estabilización (Backend First - Prioridad Absoluta)**
1.  **FIX COMPILACIÓN DEL BACKEND INTERNO (`FLORES-DELTA-FRONTEND/BACKEND`):** Reparar `LogService.java`, `PlantEventRepository.java`, `PlantaRepository.java`, `PhotoEventService.java`. Lograr un `mvn clean install` exitoso. Este es el punto de bloqueo actual.
2.  **FIX N+1 EN BACKEND INTERNO:** Una vez compilado, implementar la consulta optimizada en el repositorio de eventos.

**Fase 2: Análisis y Adaptación al "Molde" Frontend (Estilo de Código)**
1.  **Análisis de `pegamys-web`:** Analizar el código fuente del frontend de referencia (`pegamys-web`) para identificar patrones de arquitectura, estilos de codificación, nomenclatura y estructura.
2.  **Adaptación de `FLORES-DELTA-FRONTEND`:** Refactorizar nuestro frontend actual (`FLORES-DELTA-FRONTEND/src`) para coincidir con los patrones identificados en `pegamys-web`, asegurando que siga consumiendo correctamente nuestro backend local. Esto incluye la reorganización de carpetas hacia la estructura `feature-based` propuesta.

### FASE 3: Implementación de Mejoras Críticas (Backend & Frontend)
1.  **Resolver Filtrado Backend:** Implementar `findAllByPlantsInWithDetails` optimizado y pasar filtros desde el controlador al repositorio.
2.  **Panel de Control y Gestión de Maestros:** Crear las vistas para administrar Salas y Cepas fuera del menú rápido.
3.  **Nutrientes Masivos:** Refactorizar `NutrientsForm` para selección múltiple de plantas por Sala.
4.  **Bitácora Visual (Growdiaries):** Diseñar e implementar la línea de tiempo interactiva en `PlantDetailPage`.
5.  **Tests:** Iniciar suite de tests de integración para servicios críticos del backend.

### FASE 4: BI y Multimedia
1.  **Métricas:** Desarrollar endpoints de agregación de datos y vistas de gráficos.
2.  **Notas de Audio:** Investigar e implementar captura de audio en el navegador y almacenamiento en el backend.

---

**Instrucción para Antigravity:**
Utiliza este documento como la fuente de verdad del estado actual, los problemas técnicos identificados y la hoja de ruta funcional definida por el socio. **Tu primera y más crítica tarea es resolver la compilación del backend dentro de `FLORES-DELTA-FRONTEND/BACKEND`**.
