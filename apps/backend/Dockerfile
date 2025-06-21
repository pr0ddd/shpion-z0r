# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /app

# Copy backend package files and install deps
COPY apps/backend/package.json apps/backend/package-lock.json ./
# Install deps (incl. dev for build)
RUN npm install

# Copy backend source code
COPY apps/backend/ ./

# Copy shared tsconfig base for TypeScript compilation
COPY tsconfig.base.json /tsconfig.base.json

# Copy prisma schema into expected path if not already (it's inside backend)
# Генерируем Prisma Client, передавая временный URL через переменную среды только на время команды
RUN DATABASE_URL="file:dummy.db" npx prisma generate

# Build TypeScript
RUN npm run build

# Prune development dependencies already omitted above if needed
RUN npm prune --production

# Stage 2: Production
FROM node:22-alpine

WORKDIR /app

# Copy production dependencies from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

# Copy Prisma schema and client
COPY --from=builder /app/prisma ./prisma

# Expose the application port
EXPOSE 3001

# Run the application
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node dist/index.js"] 