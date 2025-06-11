# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
# Note: You need a dummy DATABASE_URL at build time for generation
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Prune development dependencies
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

# The command to run the application
# We use the production start script defined in package.json
CMD [ "npm", "run", "start" ] 