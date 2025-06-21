# Stage 1: Build the React application
FROM node:22-alpine AS builder

# Корень репозитория внутри контейнера
WORKDIR /workspace

# ------------------------
# 1. Устанавливаем зависимости monorepo (Nx) целиком
# ------------------------
# Копируем корневые package файлы и lockfile
COPY package.json package-lock.json ./

# Устанавливаем все зависимости, включая @nx/* и workspace-пакеты
RUN npm install --legacy-peer-deps

# Accept build arguments for React environment variables
ARG VITE_API_URL
ARG VITE_LIVEKIT_URL

# Set environment variables from build arguments
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_LIVEKIT_URL=$VITE_LIVEKIT_URL

# ------------------------
# 2. Копируем остальной исходник репозитория
# ------------------------
COPY . .

# Сборка production версии фронтенда через Nx (Vite)
RUN npx nx build frontend --configuration=production

# Build-output находится в dist/apps/frontend

# Stage 2: Serve the application with Nginx
FROM nginx:1.25-alpine

# Copy the build output from the builder stage
COPY --from=builder /workspace/dist/apps/frontend /usr/share/nginx/html

# Copy the custom Nginx configuration (файл находится в apps/frontend)
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080 as port 80 might be in use on the host
EXPOSE 8080

# By default, start Nginx for production.
# For development, this will be overridden by docker-compose `command: npm start`
CMD ["nginx", "-g", "daemon off;"] 