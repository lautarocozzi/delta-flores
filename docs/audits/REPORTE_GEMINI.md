# REPORTE DE AUDITORÍA: GEMINI PRO
**Fecha:** 17 de Diciembre, 2025
**Destinatario:** Lead Developer / Project Manager
**Asunto:** Auditoría Técnica Destructiva - Flores Delta

---

## 1. Resumen Ejecutivo
**Estado de Salud General: 5/10**
La aplicación es funcional pero frágil. Presenta una arquitectura monolítica disfrazada de componentes, con graves riesgos de seguridad en el manejo de autenticación y una deuda técnica que explotará en cuanto se intente escalar más allá de un MVP. El "molde" heredado está actuando como un lastre, imponiendo patrones de 2018 (Context API manual, localStorage) en una aplicación de 2025.

---

## 2. Hallazgos Críticos (Riesgo Alto/Inmediato)
### Seguridad
*   **Gestión Insegura de Token (AuthContext.tsx):** Los tokens JWT y, peor aún, el objeto `user` completo (incluyendo Roles) se almacenan en `localStorage` en texto plano. Un ataque XSS simple podría exfiltrar la sesión completa o modificar el rol percibido por el frontend (aunque el backend valide, la UI es engañable).
*   **Secretos Hardcodeados (Backend):** El archivo `application.properties` contiene credenciales en texto plano (`postgres/password`, `minioadmin`), lo cual es inaceptable incluso en desarrollo/local por el riesgo de commits accidentales.

### Estabilidad
*   **Confianza Ciega en API (api.ts):** El frontend realiza "blind casting" (`return response.data;`). No existe validación en tiempo de ejecución (Zod/Yup). Si el backend cambia un nombre de campo de `nombre` a `title`, toda la aplicación crashea con pantallas blancas (`undefined is not an object`), como ya se experimentó con el error 500 de usuarios.

---

## 3. Análisis de Arquitectura
**Patrón Detectado:** "Monolito Distribuido".
*   **Backend for Frontend (BFF) inexistente:** El frontend consume entidades de base de datos crudas (DTOs que son casi espejos de las tablas).
*   **God Components (Anti-patrón):**
    *   `Index.tsx` (~550 líneas): Es un monstruo que define componentes UI (`HeroSection`, `Footer`), datos estáticos (`funcionalidades`) y lógica de routing en el mismo archivo. Viola el principio de Responsabilidad Única (SRP).
    *   `Dashboard.tsx` (~312 líneas): Contiene lógica de negocio compleja (`useMemo` para filtrado/agrupación) que debería estar en un custom hook (`usePlantFilter`) o en el backend.
*   **Acoplamiento `api.ts`:** Un solo archivo de ~170 líneas maneja TODOS los dominios (Auth, Plantas, Salas, Eventos). Cualquier cambio en una entidad obliga a tocar este archivo central, creando conflictos de merge constantes en equipos grandes.

---

## 4. Lista de "Refactorización Obligatoria" (Tech Debt)
Las siguientes acciones no son opcionales para pasar a Producción:

1.  **[SEGURIDAD]** Migrar almacenamiento de JWT a `HttpOnly Cookies` (requiere ajuste en Backend) o implementar rotación de tokens en memoria. Eliminar `localStorage` para datos sensibles.
2.  **[ARQUITECTURA]** Atomizar `Index.tsx`: Mover `Header`, `Footer`, `Sidebar` a `src/layouts/`. Mover secciones (`Hero`, `Features`) a `src/components/landing/`.
3.  **[ROBUSTEZ]** Implementar validación con **Zod** en `api.ts`. Si el backend responde mal, el frontend debe fallar controladamente (Toast Error), no crashear.
4.  **[LIMPIEZA]** Refactorizar `Dashboard.tsx`: Extraer la lógica de filtrado (`useMemo`) a `src/hooks/useDashboardLogic.ts`.

---

## 5. Veredicto del Arquitecto
El código demuestra pragmatismo inicial pero falta de visión a largo plazo. Se ha priorizado la velocidad ("que funcione") sobre la solidez ("que no se rompa"). El uso del "molde" original ha introducido anti-patrones (reducers manuales en Context, lógica inline) que ensucian la modernidad de React 18+ y Vite.

**Recomendación:** Detener el desarrollo de nuevas "features" (Favoritos, etc.) y dedicar un Sprint completo (1-2 semanas) exclusivamente a la estabilización de la arquitectura (Refactorización de `Index`/`Dashboard` y Capa de API segura) antes de que la deuda técnica se vuelva impagable.
