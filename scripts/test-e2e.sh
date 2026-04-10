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

cleanup_test_db() {
	docker exec -e PGPASSWORD="$AUTH_TEST_DB_PASSWORD" postgres_auth_test \
		psql -U "$AUTH_TEST_DB_USER" -d "$AUTH_TEST_DB_NAME" -v ON_ERROR_STOP=1 \
		-c 'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;' >/dev/null
}

trap cleanup_test_db EXIT

docker compose --env-file "$ENV_FILE" \
	-f docker/compose.infra.yml \
	-f docker/compose.prod.yml \
	-f docker/compose.dev.yml \
	--profile prod --profile dev up -d postgres_auth_test auth_service

docker exec -e E2E_DB_HOST=postgres_auth_test \
	-e E2E_DB_PORT=5432 \
	-e E2E_DB_USER="$AUTH_TEST_DB_USER" \
	-e E2E_DB_PASSWORD="$AUTH_TEST_DB_PASSWORD" \
	-e E2E_DB_NAME="$AUTH_TEST_DB_NAME" \
	auth_service npm run test:e2e
