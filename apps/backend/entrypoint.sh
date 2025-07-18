#!/bin/sh
set -e

# If DATABASE_URL is not provided but individual PG vars are, build it.
if [ -z "$DATABASE_URL" ] && [ -n "$POSTGRES_USER" ] && [ -n "$POSTGRES_PASSWORD" ] && [ -n "$POSTGRES_DB" ]; then
  HOST=${POSTGRES_HOST:-db}
  export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${HOST}:5432/${POSTGRES_DB}?schema=public"
  echo "INFO  Generated DATABASE_URL from individual PG variables"
fi

npx prisma generate
npx prisma migrate deploy --schema=./prisma/schema.prisma || true
npx prisma db seed --schema=./prisma/schema.prisma || echo "⚠️  Seed failed (maybe already applied)"

exec node dist/index.js 