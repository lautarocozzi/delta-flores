# Instrucciones de Arranque - Flores Delta MVP
**Generado**: 22 de Diciembre de 2025, 15:18
**Estado**: Listo para Testing

---

## ⚠️ IMPORTANTE: Pasos Previos Completados

✅ **Variables de Entorno**: Se creó `.env` con configuración de API
✅ **Build del Frontend**: Compilación exitosa (20.16s)
✅ **Configuración de API**: Nuevo módulo `src/config/api.config.ts` centraliza URLs

---

## 🚀 Procedimiento de Arranque

### Paso 1: Iniciar Docker Desktop
1. Abre **Docker Desktop** manualmente
2. Espera a que el icono indique que está corriendo (puede tardar 1-2 minutos)

### Paso 2: Iniciar Base de Datos PostgreSQL
Abre una terminal PowerShell y ejecuta:

```powershell
docker ps -a --filter "name=floresdelta-db"
```

#### Si el contenedor NO existe:
```powershell
docker run --name floresdelta-db -e POSTGRES_PASSWORD=password -e POSTGRES_USER=postgres -e POSTGRES_DB=floresdelta -p 5432:5432 -d postgres:15
```

#### Si el contenedor existe pero está detenido:
```powershell
docker start floresdelta-db
```

#### Verificar que está corriendo:
```powershell
docker ps
```
Debe aparecer `floresdelta-db` con status `Up`.

---

### Paso 3: Configurar Variables de Entorno del Backend

El backend necesita estas variables de entorno. Créalas en tu sistema o úsalas inline:

```powershell
$env:DB_PASSWORD="password"
$env:JWT_SECRET="tu-secreto-jwt-super-seguro-cambialo-en-produccion"
$env:MINIO_ACCESS_KEY="minioadmin"
$env:MINIO_SECRET_KEY="minioadmin"
```

---

### Paso 4: Iniciar Backend (Spring Boot)

**Opción A - Terminal Dedicada:**
```powershell
cd "C:\Users\gabyb\Desktop\FLORES DELTA\FLORES DELTA MVP\delta-flores\web"
.\mvnw.cmd spring-boot:run
```

**Opción B - Proceso en Background:**
```powershell
cd "C:\Users\gabyb\Desktop\FLORES DELTA\FLORES DELTA MVP\delta-flores\web"
Start-Process powershell -ArgumentList "-NoProfile -Command "".\mvnw.cmd spring-boot:run"""
```

**Espera**: El backend tarda ~30-60 segundos en iniciar completamente. Verás logs indicando "Started WebApplication".

---

### Paso 5: Frontend (Ya está corriendo)

El frontend ya debería estar activo desde `npm run dev`. Verifica en tu terminal existente.

Si no está corriendo:
```powershell
cd "C:\Users\gabyb\Desktop\FLORES DELTA\FLORES DELTA MVP\FLORES-DELTA-FRONTEND"
npm run dev
```

---

## 🔍 Verificación del Sistema

### URLs de Acceso:
- **Frontend**: http://localhost:8081
- **Backend API**: http://localhost:8080/api
- **Backend Swagger**: http://localhost:8080/swagger-ui.html

### Checklist de Salud:
- [ ] Docker Desktop corriendo
- [ ] Contenedor `floresdelta-db` con status `Up`
- [ ] Backend responde en http://localhost:8080/swagger-ui.html
- [ ] Frontend carga en http://localhost:8081
- [ ] Puedo hacer login en la aplicación

---

## 🐛 Troubleshooting

### Error: "Connection refused" al hacer login
- Verifica que el backend esté completamente iniciado (revisa los logs)
- Verifica CORS en `WebSecurityConfig.java` (debe incluir `http://localhost:8081`)

### Error: "Could not connect to database"
- Verifica que Docker Desktop esté corriendo
- Ejecuta `docker logs floresdelta-db` para ver errores

### Error: Build falla en frontend
- Ejecuta `npm install` nuevamente
- Verifica que el archivo `.env` exista en la raíz del frontend

---

## 📊 Estado de Pendientes Técnicos

### ⚠️ Conocidos (No bloqueantes para testing):
1. **PlantTimeline.tsx**: Todavía tiene URL hardcodeada en línea 60 (archivo bloqueado, requiere edición manual)
2. **TypeScript**: 17 archivos con uso de `any` (calidad de código, no funcional)

### ✅ Resueltos:
1. Variables de entorno creadas
2. Configuración centralizada de API
3. Build exitoso

---

**Siguiente Paso**: Una vez que todos los servicios estén corriendo, procede al testing manual según los checkpoints definidos en `REPORTE_AVANCES_SESION.md`.
