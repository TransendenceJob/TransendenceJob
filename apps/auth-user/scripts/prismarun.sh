#!/bin/sh
set -e

echo "Generating Prisma client..."
npx prisma generate

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Starting app..."
exec "$@"