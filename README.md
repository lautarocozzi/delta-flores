# 🌱 Flores Delta - Cannabis Cultivation Management System

> Full-stack application for professional cannabis cultivation tracking and management

[![Backend](https://img.shields.io/badge/Backend-Spring%20Boot%203.2-green)](delta-flores/)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TS-blue)](FLORES-DELTA-FRONTEND/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

## 📋 Overview

Flores Delta is a comprehensive cultivation management system designed for professional cannabis growers. It provides end-to-end tracking of plants, environmental conditions, growth stages, and cultivation events.

### Key Features

- 🌿 **Plant Management**: Track individual plants through their entire lifecycle
- 🏠 **Room/Space Management**: Monitor environmental conditions per cultivation area
- 🧬 **Genetics Database**: Manage strain information and characteristics
- 📊 **Event Logging**: Record watering, pruning, nutrient application, and more
- 👥 **Multi-user Support**: Role-based access control (Grower, Admin, Super Admin)
- 📈 **Analytics Dashboard**: KPIs and insights on cultivation performance

## 🏗️ Architecture

```
flores-delta-mvp/
├── delta-flores/     Spring Boot 3.2 + PostgreSQL
├── FLORES-DELTA-FRONTEND/  React 18 + TypeScript + Vite
└── docs/            Architecture & guides
```

### Tech Stack

**Backend:**
- Java 17
- Spring Boot 3.2.x
- Spring Security (JWT)
- PostgreSQL 15
- Hibernate/JPA
- MinIO (object storage)

**Frontend:**
- React 18
- TypeScript 5
- Vite
- TanStack Query (React Query)
- Zod (runtime validation)
- Tailwind CSS + shadcn/ui
- Recharts

## 🚀 Quick Start

### Prerequisites

- Java 21+
- Node.js 18+
- PostgreSQL 15
- Maven 3.8+ (included via mvnw)

### Option 1: Docker Compose (Recommended)

```bash
# Copiar variables de entorno
cp .env.example .env

# Arrancar stack completo
docker-compose up -d

# Acceder a:
# - Frontend: http://localhost
# - Backend API: http://localhost:8080
# - MinIO Console: http://localhost:9001

```
##🐳 Docker (recomendado)
cp .env.example .env
docker compose up -d                           # CRUD básico
docker compose --profile minio up -d           # + fotos/media
- Frontend: http://localhost
- API: http://localhost:8080

##💻 Modo desarrollo
# Backend
cd delta-flores/web && ./mvnw spring-boot:run
# Frontend (otra terminal)
cd FLORES-DELTA-FRONTEND && npm install && npm run dev
- Frontend: http://localhost:5173
- API: http://localhost:8080
Credenciales por defecto: admin@delta.com / admin123
Ver [README-DOCKER.md](README-DOCKER.md) para detalles completos.

### Option 2: Development Mode

**Backend:**
```bash
cd delta-flores/web
./mvnw spring-boot:run
```

Backend runs on `http://localhost:8080`

See [delta-flores/README.md](delta-flores/README.md) for detailed setup.

**Frontend:**
```bash
cd FLORES-DELTA-FRONTEND
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

See [FLORES-DELTA-FRONTEND/README.md](FLORES-DELTA-FRONTEND/README.md) for detailed setup.

### Default Credentials

- Email: `admin@delta.com`
- Password: `admin123`

## 📚 Documentation

- [Architecture Overview](docs/architecture/ARQUITECTURA_FILOSOFIA_SOCIO.md)
- [Development Setup](docs/guides/INSTRUCCIONES_ARRANQUE.md)
- [Docker Deployment](README-DOCKER.md)
- [Testing Manual](docs/audits/CHECKPOINT_TESTING_MANUAL.md)

## 🧪 Testing

```bash
# Backend tests
cd delta-flores/web
./mvnw test

# Frontend tests
cd FLORES-DELTA-FRONTEND
npm run test
```

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Authors

- **Backend Architecture** - LautaroCozzi
- **Frontend Development** - NahuelBarbero

---

**Status:** 🟢 Production Ready | **Version:** 1.0.0 MVP

