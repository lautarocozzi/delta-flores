# ⚛️ Frontend - Flores Delta MVP

Sistema de gestión de cultivos de cannabis - React TypeScript + Vite

---

## 🚀 Setup

### Prerequisites

- **Node.js 18+** o superior
- **npm 9+** o **pnpm** / **yarn**
- Backend corriendo en `http://localhost:8080`

### Installation

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Build para producción
npm run build

# Preview build de producción
npm run preview
```

El frontend arrancará en: `http://localhost:8081`

---

## ⚙️ Environment Variables

Crea un archivo `.env` basado en `.env.example`:

```bash
# Copiar template
cp .env.example .env

# Editar con tus valores
nano .env
```

**Variables principales:**

- `VITE_API_URL` - URL del backend (ej: `http://localhost:8080`)
- `VITE_API_BASE_URL` - Base path API (ej: `http://localhost:8080/api`)

**Opcional:**
- `VITE_ANALYTICS_ID` - Google Analytics ID (producción)

Ver `.env.example` para documentación completa.

---

## 📁 Estructura del Proyecto

```
FLORES-DELTA-FRONTEND/
├── src/
│   ├── Components/
│   │   ├── dashboard/      # Componentes del dashboard
│   │   ├── forms/          # Formularios reutilizables
│   │   ├── ui/             # Shadcn/ui components
│   │   └── skeletons/      # Loading states
│   ├── Pages/              # Páginas principales
│   ├── Context/            # React Context (Auth, Theme)
│   ├── hooks/              # Custom hooks
│   ├── services/           # API services
│   ├── schemas/            # Zod validation schemas
│   ├── interfaces/         # TypeScript interfaces
│   ├── Utils/              # Utilidades
│   └── App.tsx             # Entry point
├── public/
├── .env.example
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md               # Este archivo
```

---

## 🎨 Stack Tecnológico

**Core:**
- React 18
- TypeScript 5
- Vite 5

**UI:**
- Tailwind CSS 3
- Shadcn/ui
- Lucide React Icons

**State Management:**
- TanStack Query (React Query)
- React Context

**Forms & Validation:**
- React Hook Form
- Zod

**Routing:**
- React Router v6

---

## 🔐 Seguridad

- **JWT:** Almacenado en cookies HttpOnly (NO accessible desde JavaScript)
- **CSRF:** Cookies SameSite=Strict
- **Validación:** Zod schemas en runtime para datos API
- **TypeScript:** Type-safety completo (0 `any`)

---

## 🧪 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia dev server (port 8081)

# Build
npm run build            # Build producción
npm run preview          # Preview build localmente

# Code Quality
npm run lint             # ESLint check
npm run type-check       # TypeScript check
```

---

## 📚 Convenciones de Código

**Componentes:**
- PascalCase para nombres (ej: `PlantCard.tsx`)
- Props tipadas con TypeScript
- Usar shadcn/ui cuando sea posible

**Hooks:**
- Prefijo `use` (ej: `useFavorites.ts`)
- Lógica de negocio extraída de componentes

**API Calls:**
- **SIEMPRE** usar `useQuery` para GET
- **SIEMPRE** usar `useMutation` para POST/PUT/DELETE
- **NUNCA** `useEffect` para fetching de datos

**Validación:**
- Schemas Zod en `src/schemas/DTOSchemas.ts`
- Runtime validation en API responses

---

## 🐳 Docker

```bash
# Build imagen
docker build -t flores-delta-frontend .

# Run con compose (desde raíz del proyecto)
cd ..
docker-compose up frontend
```

Ver `README-DOCKER.md` en raíz para deployment completo.

---

## 🛠️ Troubleshooting

**Error: VITE_API_URL not defined**
```bash
# Crear .env con variable correcta
echo "VITE_API_URL=http://localhost:8080" > .env
```

**Error: Module not found**
```bash
# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm install
```

**Error: Connection refused :8080**
- Verificar que backend esté corriendo
- Confirmar `VITE_API_URL` en `.env`

**Build falla con errores TypeScript**
```bash
# Verificar tipos
npm run type-check

# Verificar linting
npm run lint
```

---

## 🎯 Filosofía de Desarrollo

**Backend-First:**
- Frontend es reflejo del backend
- DTOs espejo exacto (camelCase)
- NO inventar campos

**React Query:**
- Estado del servidor manejado por TanStack Query
- Cache automático, refetch inteligente
- `invalidateQueries` después de mutations

**Componentes:**
- 1 responsabilidad por componente
- Reutilizables con props `mode` cuando aplique
- Loading states con Skeletons (NO spinners genéricos)

---

## 👥 Autor

Proyecto desarrollado por el equipo Flores Delta

**Arquitectura:**
- React Query para data fetching
- TypeScript strict mode
- Zod runtime validation
- Shadcn/ui design system
