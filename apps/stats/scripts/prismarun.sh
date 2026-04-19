#!/bin/sh
set -e

if [ ! -x /app/node_modules/.bin/prisma ]; then
	echo "Prisma CLI not found in node_modules. Installing dependencies..."
	npm ci
fi

PRISMA_GENERATE_ON_START="${PRISMA_GENERATE_ON_START:-true}"
PRISMA_RUN_MIGRATIONS="${PRISMA_RUN_MIGRATIONS:-true}"

if [ "$PRISMA_GENERATE_ON_START" = "true" ]; then
	echo "Generating Prisma client..."
	npx prisma generate
fi

if [ "$PRISMA_RUN_MIGRATIONS" = "true" ]; then
	echo "Running Prisma migrations..."
	npx prisma migrate deploy
fi

echo "Starting app..."
exec "$@"