# Base compose file(s)
ENV_FILE ?= .env
COMPOSE_BASE = docker/compose.yml
COMPOSE_DEV  = docker/compose.dev.yml
COMPOSE_PROD = docker/compose.prod.yml

# Compose command helpers
DC_BASE = docker compose --env-file $(ENV_FILE) -f $(COMPOSE_BASE)
DC_DEV  = $(DC_BASE) -f $(COMPOSE_DEV)  --profile dev
DC_PROD = $(DC_BASE) -f $(COMPOSE_PROD) --profile prod
DC_OBS  = $(DC_BASE) --profile dev --profile obs

# Default service for exec/sh if not provided:
SVC ?= nginx

.PHONY: help check-env up down ps logs health reset 
		dev prod debug obs rebuild pull restart exec sh

help:
	@echo "Targets:"
	@echo "  make dev        - Start dev stack (hot reload, etc.)"
	@echo "  make prod       - Start prod-like stack"
	@echo "  make debug      - Start dev stack + debug ports (if configured)"
	@echo "  make obs        - Start observability profile (prom/grafana, etc.)"
	@echo "  make down       - Stop stack"
	@echo "  make ps         - Show status"
	@echo "  make logs       - Follow logs (set SVC=... for one service)"
	@echo "  make restart    - Restart (SVC=... optional)"
	@echo "  make rebuild    - Build images (no cache optional: NOCACHE=1)"
	@echo "  make exec       - Exec into running container (SVC=..., CMD=...)"
	@echo "  make sh         - Shell into running container (SVC=...)"
	@echo "  make reset      - Down + delete volumes (DANGEROUS)"

check-env:
	@test -f $(ENV_FILE) || (echo "❌ $(ENV_FILE) missing. Run: cp .env.example $(ENV_FILE)" && exit 1)

# Keep your original 'up' as a sane default (dev)
up: dev

dev: check-env
	$(DC_DEV) up -d

prod: check-env
	$(DC_PROD) up -d

# debug is just dev + whatever you define in compose.dev.yml (ports/command)
debug: check-env
	$(DC_DEV) up -d

# Bring up observability profile (can be used with dev/prod too)
obs: check-env
	$(DC_OBS) up -d

down:
	$(DC_BASE) down

ps:
	$(DC_BASE) ps

# Logs: default all, or set SVC=api for a single service
logs:
ifeq ($(origin SVC), undefined)
	$(DC_BASE) logs -f --tail=100
else
	$(DC_BASE) logs -f --tail=100 $(SVC)
endif

health:
	@echo "== Containers (running) =="
	@docker ps
	@echo ""
	@echo "== Compose status =="
	@$(DC_BASE) ps
	@echo ""
	@echo "== Prometheus targets check =="
	@echo "Open: http://localhost:$${PROMETHEUS_PORT:-9090}/targets"
	@echo "== Grafana check =="
	@echo "Open: http://localhost:$${GRAFANA_PORT:-3000} (admin/admin by default)"

# Rebuild images (optionally without cache: make rebuild NOCACHE=1)
rebuild: check-env
ifeq ($(NOCACHE),1)
	$(DC_BASE) build --no-cache
else
	$(DC_BASE) build
endif

pull: check-env
	$(DC_BASE) pull

# Restart whole stack or one service: make restart SVC=api
restart:
ifeq ($(origin SVC), undefined)
	$(DC_BASE) restart
else
	$(DC_BASE) restart $(SVC)
endif

# Exec: make exec SVC=api CMD="ls -la"
CMD ?= sh
exec:
	$(DC_BASE) exec $(SVC) $(CMD)

sh:
	$(DC_BASE) exec $(SVC) sh

reset:
	@echo "⚠️  This will DELETE ALL DATA (volumes). Ctrl+C to abort. 10 seconds..."
	@sleep 10
	$(DC_BASE) down -v