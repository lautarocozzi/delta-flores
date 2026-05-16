# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-09

### Added
- **Backend:**
  - Complete REST API for plant, room, and genetics management
  - JWT authentication with HttpOnly cookies
  - MinIO integration for image storage
  - Multi-user support with role-based access control
  - Event logging system (watering, pruning, nutrients, stage changes)
  
- **Frontend:**
  - React 18 SPA with TypeScript
  - TanStack Query for server state management
  - Zod runtime validation on all GET endpoints
  - shadcn/ui component library
  - Comprehensive dashboard with KPIs
  - Event timeline and filtering
  
- **Infrastructure:**
  - Docker multi-stage builds for backend and frontend
  - docker-compose orchestration with healthchecks
  - Production-ready Nginx configuration
  - Professional .env.example templates

### Security
- JWT tokens stored in HttpOnly cookies (XSS protection)
- Zod runtime validation preventing corrupted data propagation
- Non-root Docker user for backend container
- Security headers configured in Nginx (X-Frame-Options, CSP, etc.)

### Fixed
- CepaDto backend naming convention (PascalCase → camelCase)
- Type safety in NutrienteDtoSchema
- Validation on mutation endpoints (createPlanta, createSala, updateSala)

## [Unreleased]

### Planned
- Backend validation on POST/PUT endpoints
- Error boundary components in React
- Comprehensive test suite (backend + frontend)
- CI/CD pipeline with GitHub Actions
