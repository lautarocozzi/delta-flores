# ================================
# STAGE 1: Build con Node
# ================================
FROM node:18-alpine AS builder

# ARG para VITE_API_URL (se hornea en build time de Vite)
ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app

# Copiar package files primero (cache de node_modules)
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Build de producción
RUN npm run build

# ================================
# STAGE 2: Runtime con Nginx
# ================================
FROM nginx:1.25-alpine

# Copiar build artifacts
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración Nginx custom
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto 80
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Nginx en foreground
CMD ["nginx", "-g", "daemon off;"]
