# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /app

# Copy backend package files and install deps
COPY apps/backend/package.json apps/backend/package-lock.json ./
# Install deps (incl. dev for build)
RUN npm install

# Copy backend source code
COPY apps/backend/ ./

# Skip Prisma generate during build to avoid external binary download;
# it will run on container startup (see CMD).

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Prune development dependencies already omitted above if needed
RUN npm prune --production

# ---------------------------
# Stage 2: Production
FROM node:22-alpine

WORKDIR /app

# Copy production dependencies and built files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
# Copy entrypoint script
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

# Copy production env so dotenv can load variables inside container
COPY apps/backend/.env.production ./

# Expose the application port
EXPOSE 3001

# Run the application via entrypoint that prepares DB & seeds
ENTRYPOINT ["sh","/app/entrypoint.sh"] 