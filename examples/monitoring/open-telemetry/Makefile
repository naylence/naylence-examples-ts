.PHONY: init build start stop run run-verbose clean help

DOCKER_IMAGE := naylence-open-telemetry-ts:latest
COMPOSE_PROJECT := open-telemetry

.DEFAULT_GOAL := help

init:
	@echo "Generating dev secrets..."
	@node ../../../scripts/generate-secrets.mjs

build:
	@echo "Installing dependencies..."
	@npm install
	@echo "Building TypeScript sources..."
	@npm run build
	@echo "Building Docker image..."
	@docker compose build

start: build init
	@echo "Starting services..."
	@docker compose -p $(COMPOSE_PROJECT) up -d
	@echo "Services starting. Use 'docker compose ps' to inspect health."

stop:
	@echo "Stopping services..."
	@docker compose -p $(COMPOSE_PROJECT) down --remove-orphans

run:
	@echo "Running client in Docker..."
	@docker run --rm \
		-v "$(shell pwd)/dist:/app" \
		-v /app/node_modules \
		-v "$(shell pwd)/config:/etc/otel-config:ro" \
		-v $(COMPOSE_PROJECT)_caddy-data:/data:ro \
		-w /app \
		--network $(COMPOSE_PROJECT)_naylence-net \
		--env-file config/.env.client \
		$(DOCKER_IMAGE) \
		node client.mjs

run-verbose:
	@echo "Running client with verbose logging..."
	@docker run --rm \
		-v "$(shell pwd)/dist:/app" \
		-v /app/node_modules \
		-v "$(shell pwd)/config:/etc/otel-config:ro" \
		-v $(COMPOSE_PROJECT)_caddy-data:/data:ro \
		-w /app \
		--network $(COMPOSE_PROJECT)_naylence-net \
		--env-file config/.env.client \
		-e FAME_SHOW_ENVELOPES=true \
		$(DOCKER_IMAGE) \
		node client.mjs

clean: stop
	@echo "Removing generated files..."
	@rm -f config/.env.client config/.env.agent config/.env.sentinel config/.env.oauth2-server
	@rm -rf config/secrets
	@rm -rf node_modules dist
	@docker volume rm $(COMPOSE_PROJECT)_caddy-data 2>/dev/null || true
	@echo "Clean complete."

help:
	@echo "OpenTelemetry Monitoring Example"
	@echo "  make build        Install deps and compile TypeScript"
	@echo "  make init         Generate dev OAuth2 secrets (.env files)"
	@echo "  make start        Build image and start docker-compose stack"
	@echo "  make stop         Stop running stack"
	@echo "  make run          Execute the client inside the network"
	@echo "  make run-verbose  Execute the client with debug logging"
	@echo "  make clean        Remove generated files and volumes"
