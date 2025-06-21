# Stage 1: Build the React application
FROM node:22-alpine AS builder

# Папка приложения внутри контейнера
WORKDIR /app

# ------------------------
# 1. Устанавливаем зависимости только фронтенда
# ------------------------
# Копируем лишь package.json / lock из фронтенда
COPY apps/frontend/package.json apps/frontend/package-lock.json ./

RUN npm install --legacy-peer-deps

# Accept build arguments for React environment variables
ARG VITE_API_URL
ARG VITE_LIVEKIT_URL

# Set environment variables from build arguments
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_LIVEKIT_URL=$VITE_LIVEKIT_URL

# ------------------------
# 2. Копируем исходники фронтенда и общие пакеты
# ------------------------
# Исходники фронтенда
COPY apps/frontend/ ./
# Общие библиотеки, чтобы резолвились алиасы вида @shared/*
COPY shared ./shared

# Корневой tsconfig нужен для extends "../../tsconfig.base.json"
COPY tsconfig.base.json /tsconfig.base.json

# Build the application
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:1.25-alpine

# Copy the build output from the builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy the custom Nginx configuration (файл находится в apps/frontend)
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080 as port 80 might be in use on the host
EXPOSE 8080

# By default, start Nginx for production.
# For development, this will be overridden by docker-compose `command: npm start`
CMD ["nginx", "-g", "daemon off;"] 