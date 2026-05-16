# 🐳 Docker Deployment - Flores Delta

## Quick Start

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+

### 1. Configure Environment

```bash
# Copiar template de variables
cp .env.example .env

# Editar credenciales (IMPORTANTE)
nano .env
```

### 2. Start Services

```bash
# Build y arrancar todos los servicios
docker-compose up -d

# Ver estado de servicios
docker-compose ps

# Logs en tiempo real
docker-compose logs -f
```

### 3. Access Application

- **Frontend:** http://localhost
- **Backend API:** http://localhost:8080
- **MinIO Console:** http://localhost:9001

### 4. Stop Services

```bash
# Detener servicios
docker-compose down

# Detener y eliminar volúmenes (⚠️ BORRA DB)
docker-compose down -v
```

## Services Overview

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 80 | React SPA (Nginx) |
| Backend | 8080 | Spring Boot API |
| PostgreSQL | 5432 | Database |
| MinIO | 9000, 9001 | Object Storage |

## Healthchecks

Todos los servicios tienen healthchecks configurados:

```bash
# Backend
curl http://localhost:8080/actuator/health

# Frontend
curl http://localhost/health

# PostgreSQL
docker-compose exec postgres pg_isready
```

## Production Deployment

### ⚠️ Security Checklist

- [ ] Cambiar `DB_PASSWORD`
- [ ] Generar `JWT_SECRET` único (64 chars hex)
- [ ] Cambiar `MINIO_ACCESS_KEY` y `MINIO_SECRET_KEY`
- [ ] Configurar HTTPS (Nginx reverse proxy)
- [ ] Configurar backups de PostgreSQL
- [ ] Habilitar logs persistentes

### Generate Secure Secrets

```bash
# JWT Secret (64 bytes hex)
openssl rand -hex 64

# DB Password (32 chars alphanumeric)
openssl rand -base64 32

# MinIO Keys
openssl rand -base64 20
```

## Troubleshooting

### Backend no conecta a PostgreSQL

```bash
# Verificar que postgres esté healthy
docker-compose ps postgres

# Ver logs de postgres
docker-compose logs postgres

# Verificar variables de entorno del backend
docker-compose exec backend env | grep DB_
```

### Frontend no puede llamar al backend

1. Verificar que backend esté corriendo: `docker-compose ps backend`
2. Verificar healthcheck: `curl http://localhost:8080/actuator/health`
3. Revisar logs: `docker-compose logs backend`

### Rebuild forzado

```bash
# Rebuild sin cache
docker-compose build --no-cache

# Rebuild y restart
docker-compose up -d --build
```

## Development Mode

Para desarrollo local (sin Docker):

1. **Backend:** Seguir instrucciones en `delta-flores/README.md`
2. **Frontend:** Seguir instrucciones en `FLORES-DELTA-FRONTEND/README.md`
