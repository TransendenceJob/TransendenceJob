COMPOSE = docker compose --env-file .env -f docker/compose.yml


.PHONY: up down ps logs health reset

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

ps:
	$(COMPOSE) ps

logs:
	$(COMPOSE) logs -f --tail=100

health:
	@echo "== Containers (running) =="
	@docker ps
	@echo ""
	@echo "== Compose status =="
	@$(COMPOSE) ps
	@echo ""
	@echo "== Prometheus targets check =="
	@echo "Open: http://localhost:$${PROMETHEUS_PORT:-9090}/targets"
	@echo "== Grafana check =="
	@echo "Open: http://localhost:$${GRAFANA_PORT:-3000} (admin/admin by default)"

reset:
	@echo "⚠️  This will DELETE ALL DATA (Postgres/Redis/RabbitMQ volumes). Ctrl+C to abort. 10 seconds until command run"
	@sleep 10
	$(COMPOSE) down -v
