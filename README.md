# Flores Delta

Sistema de gestion de cultivo cannabis profesional.

## Levantar el proyecto

```bash
docker compose up -d --build
```

Eso es todo. Levanta PostgreSQL, backend (Spring Boot) y frontend (Vite con hot-reload).

### URLs

| Servicio   | URL                          |
| ---------- | ---------------------------- |
| Frontend   | http://localhost:5173         |
| Backend    | http://localhost:8080         |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| MinIO      | http://localhost:9001 (con `--profile minio`) |

### Credenciales por defecto

- Email: `admin@delta.com`
- Password: `admin123`

### Con almacenamiento de archivos (MinIO)

```bash
docker compose --profile minio up -d --build
```

## Comandos utiles

### Levantar

```bash
docker compose up -d --build                           # stack basico
docker compose --profile minio up -d --build           # + MinIO (fotos/media)
```

### Parar (mantiene contenedores y datos)

```bash
docker compose stop                                    # parar todo
docker compose stop frontend                           # parar solo el frontend
docker compose stop backend                            # parar solo el backend
docker compose --profile minio stop                    # parar todo incluyendo MinIO
```

### Bajar (parar + eliminar contenedores, mantiene volumenes)

```bash
docker compose down                                    # bajar todo
docker compose --profile minio down                    # bajar todo incluyendo MinIO
```

### Bajar y limpiar todo (contenedores + volumenes + redes)

```bash
docker compose down -v                                 # ELIMINA la base de datos
docker compose --profile minio down -v                  # ELIMINA todo incluyendo MinIO
```

### Rebuild completo

```bash
docker compose up -d --build --force-recreate          # recrear desde cero
```

### Ver logs

```bash
docker compose logs -f                                 # todos los servicios
docker compose logs -f frontend                        # solo el frontend
docker compose logs -f backend                         # solo el backend
```

## Desarrollo local

El frontend ya levanta con **hot-reload** dentro de Docker. Editás un archivo en `frontend/src/` y se recarga solo.

### Backend (fuera de Docker)

```bash
cd backend
./mvnw spring-boot:run
```

### Frontend (fuera de Docker)

```bash
cd frontend
npm install
npm run dev
```

## Stack tecnico

- **Backend**: Java 21, Spring Boot 3.2, Spring Security JWT, PostgreSQL 15, MinIO
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts
- **Infra**: Docker Compose, Vite dev server (hot-reload)

## Arquitectura

```
FLORESDELTA/
├── backend/          Spring Boot API
├── frontend/         React + Vite
├── docker-compose.yml
├── .env.example
└── docs/
```
