#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${ENV_FILE:-.env}"

if [[ ! -f "$ENV_FILE" ]]; then
	echo "Missing $ENV_FILE"
	exit 1
fi

source "$ENV_FILE"

AUTH_TEST_DB_USER="${AUTH_TEST_DB_USER:-auth_test}"
AUTH_TEST_DB_PASSWORD="${AUTH_TEST_DB_PASSWORD:-auth_test}"
AUTH_TEST_DB_NAME="${AUTH_TEST_DB_NAME:-auth_test_db}"
AUTH_TEST_DB_HOST="${AUTH_TEST_DB_HOST:-postgres_auth_test}"
AUTH_TEST_DB_PORT="${AUTH_TEST_DB_PORT:-5432}"

COMPOSE_CMD=(
	docker compose --env-file "$ENV_FILE"
	-f docker/compose.infra.yml
	-f docker/compose.prod.yml
	-f docker/compose.dev.yml
	--profile prod --profile dev
)

was_running() {
	docker ps --format '{{.Names}}' | grep -q "^$1$"
}

REDIS_WAS_RUNNING=0
POSTGRES_AUTH_TEST_WAS_RUNNING=0

if was_running redis; then
	REDIS_WAS_RUNNING=1
fi

if was_running postgres_auth_test; then
	POSTGRES_AUTH_TEST_WAS_RUNNING=1
fi

cleanup_test_db() {
	if docker ps --format '{{.Names}}' | grep -q '^postgres_auth_test$'; then
		docker exec -e PGPASSWORD="$AUTH_TEST_DB_PASSWORD" postgres_auth_test \
			psql -U "$AUTH_TEST_DB_USER" -d "$AUTH_TEST_DB_NAME" -v ON_ERROR_STOP=1 \
			-c 'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;' >/dev/null
	fi
}

teardown_services() {
	if [[ "$POSTGRES_AUTH_TEST_WAS_RUNNING" -eq 0 ]]; then
		"${COMPOSE_CMD[@]}" stop postgres_auth_test >/dev/null 2>&1 || true
		"${COMPOSE_CMD[@]}" rm -f postgres_auth_test >/dev/null 2>&1 || true
	fi

	if [[ "$REDIS_WAS_RUNNING" -eq 0 ]]; then
		"${COMPOSE_CMD[@]}" stop redis >/dev/null 2>&1 || true
		"${COMPOSE_CMD[@]}" rm -f redis >/dev/null 2>&1 || true
	fi
}

on_exit() {
	cleanup_test_db || true
	teardown_services || true
}

trap on_exit EXIT

"${COMPOSE_CMD[@]}" up -d postgres_auth_test redis

"${COMPOSE_CMD[@]}" build auth_service

"${COMPOSE_CMD[@]}" run --rm --no-deps \
	-e NODE_ENV=test \
	-e DB_HOST="$AUTH_TEST_DB_HOST" \
	-e DB_PORT="$AUTH_TEST_DB_PORT" \
	-e DB_USER="$AUTH_TEST_DB_USER" \
	-e DB_PASSWORD="$AUTH_TEST_DB_PASSWORD" \
	-e DB_NAME="$AUTH_TEST_DB_NAME" \
	-e DATABASE_URL="postgresql://${AUTH_TEST_DB_USER}:${AUTH_TEST_DB_PASSWORD}@${AUTH_TEST_DB_HOST}:${AUTH_TEST_DB_PORT}/${AUTH_TEST_DB_NAME}?schema=public" \
	-e E2E_DB_HOST="$AUTH_TEST_DB_HOST" \
	-e E2E_DB_PORT="$AUTH_TEST_DB_PORT" \
	-e E2E_DB_USER="$AUTH_TEST_DB_USER" \
	-e E2E_DB_PASSWORD="$AUTH_TEST_DB_PASSWORD" \
	-e E2E_DB_NAME="$AUTH_TEST_DB_NAME" \
	-e REDIS_HOST=redis \
	-e REDIS_PORT=6379 \
	-e GOOGLE_CLIENT_ID="e2e-google-client-id" \
	-e GOOGLE_CLIENT_SECRET="e2e-google-client-secret" \
	-e GOOGLE_REDIRECT_URI="http://localhost:3000/auth/google/callback" \
	auth_service npm run test:e2e
