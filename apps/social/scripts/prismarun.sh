#!/bin/sh
set -e

NPM_CI_ON_START="${NPM_CI_ON_START:-false}"

if [ "$NPM_CI_ON_START" = "true" ] || [ ! -x /app/node_modules/.bin/prisma ]; then
	echo "Installing dependencies before Prisma setup..."
	npm ci
fi

PRISMA_BIN="/app/node_modules/.bin/prisma"
if [ ! -x "$PRISMA_BIN" ]; then
	echo "Prisma CLI is still missing after npm ci."
	exit 1
fi

PRISMA_GENERATE_ON_START="${PRISMA_GENERATE_ON_START:-true}"
PRISMA_RUN_MIGRATIONS="${PRISMA_RUN_MIGRATIONS:-true}"

if [ "$PRISMA_GENERATE_ON_START" = "true" ]; then
	echo "Generating Prisma client..."
	"$PRISMA_BIN" generate
fi

if [ "$PRISMA_RUN_MIGRATIONS" = "true" ]; then
	echo "Running Prisma migrations..."
	"$PRISMA_BIN" migrate deploy
fi

echo "Starting app..."
exec "$@"
