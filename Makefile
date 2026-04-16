# ---------- Files ----------
ENV_FILE ?= .env
COMPOSE_BASE = docker/compose.infra.yml
COMPOSE_DEV  = docker/compose.dev.yml
COMPOSE_PROD = docker/compose.prod.yml

# ---------- Compose commands ----------
DC_BASE = docker compose --env-file $(ENV_FILE) -f $(COMPOSE_BASE)
DC_DEV  = docker compose --env-file $(ENV_FILE) -f $(COMPOSE_BASE)  -f $(COMPOSE_DEV) --profile dev
DC_PROD = docker compose --env-file $(ENV_FILE) -f $(COMPOSE_BASE) -f $(COMPOSE_PROD) --profile prod 
DC_OBS  = docker compose --env-file $(ENV_FILE) -f $(COMPOSE_BASE) --profile dev --profile obs

# Optional service selector:
SVC ?=
CMD ?= sh

.PHONY: help check-env up down down-base down-dev down-prod down-all \
	ps logs health reset dev prod debug obs rebuild pull restart exec sh e2e-auth

help:
	@echo "Targets:"
	@echo "  make dev         - Start dev stack"
	@echo "  make prod        - Start prod-like stack"
	@echo "  make debug       - Start dev stack with debug config"
	@echo "  make obs         - Start infra + observability"
	@echo "  make down        - Stop dev stack"
	@echo "  make down-base   - Stop base infra only"
	@echo "  make down-dev    - Stop dev stack"
	@echo "  make down-prod   - Stop prod stack"
	@echo "  make down-all    - Stop everything defined by all compose files"
	@echo "  make ps          - Show compose status"
	@echo "  make logs        - Follow logs for all services"
	@echo "  make logs SVC=x  - Follow logs for one service"
	@echo "  make restart     - Restart all services in dev stack"
	@echo "  make restart SVC=x - Restart one service in dev stack"
	@echo "  make exec SVC=x CMD='...' - Exec command in service"
	@echo "  make sh SVC=x    - Shell into service"
	@echo "  make rebuild     - Build images"
	@echo "  make e2e-auth    - Run auth-service e2e tests against isolated test DB"
	@echo "  make reset       - Down all + delete volumes"

check-env:
	@test -f $(ENV_FILE) || (echo "❌ $(ENV_FILE) missing. Run: cp .env.example $(ENV_FILE)" && exit 1)

# Default
up: dev

dev: check-env
	$(DC_DEV) up -d --build

prod: check-env
	$(DC_PROD) up -d --build

debug: check-env
	$(DC_DEV) up -d --build

obs: check-env
	$(DC_OBS) up -d

# ---------- Down targets ----------
down: down-dev

down-base:
	$(DC_BASE) down

down-dev:
	$(DC_DEV) down

down-prod:
	$(DC_PROD) down

down-all:
	docker compose --env-file $(ENV_FILE) \
		-f $(COMPOSE_BASE) \
		-f $(COMPOSE_DEV) \
		-f $(COMPOSE_PROD) \
		--profile dev \
		--profile prod \
		--profile obs \
		down --remove-orphans

ps:
	$(DC_DEV) ps

logs:
ifdef SVC
	$(DC_DEV) logs -f --tail=100 $(SVC)
else
	$(DC_DEV) logs -f --tail=100
endif

health:
	@echo "== Containers (running) =="
	@docker ps
	@echo ""
	@echo "== Compose status =="
	@$(DC_DEV) ps
	@echo ""
	@echo "== Prometheus targets check =="
	@echo "Open: http://localhost:$${PROMETHEUS_PORT:-9090}/targets"
	@echo "== Grafana check =="
	@echo "Open: http://localhost:$${GRAFANA_PORT:-3000}"

rebuild: check-env
ifeq ($(NOCACHE),1)
	$(DC_DEV) build --no-cache
else
	$(DC_DEV) build
	@echo "Successfuly rebuilded ✅"
endif

pull: check-env
	$(DC_DEV) pull

restart:
ifdef SVC
	$(DC_DEV) restart $(SVC)
else
	$(DC_DEV) restart
endif

exec:
ifndef SVC
	$(error Please provide SVC=<service>, e.g. make exec SVC=nginx CMD="nginx -t")
endif
	$(DC_DEV) exec $(SVC) $(CMD)

sh:
ifndef SVC
	$(error Please provide SVC=<service>, e.g. make sh SVC=nginx)
endif
	$(DC_DEV) exec $(SVC) sh

e2e-auth: check-env
	bash scripts/test-e2e.sh

reset:
	@echo "⚠️  This will DELETE ALL DATA (volumes). Ctrl+C to abort. 10 seconds..."
	@sleep 10
	docker compose --env-file $(ENV_FILE) \
		-f $(COMPOSE_BASE) \
		-f $(COMPOSE_DEV) \
		-f $(COMPOSE_PROD) \
		--profile dev \
		--profile prod \
		--profile obs \
		down -v --remove-orphans