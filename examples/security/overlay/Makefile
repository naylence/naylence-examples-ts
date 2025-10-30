.PHONY: init build start stop run run-verbose clean

DOCKER_IMAGE := naylence/agent-sdk-node:0.3.3

# Generate secrets and .env files
init:
	@echo "Generating secrets..."
	@KEEP_CREDENTIALS=false node ../../../scripts/generate-secrets.mjs

# Build TypeScript sources
build:
	@echo "Building TypeScript sources..."
	@npm install
	@npm run build

# Start all services
start: init build
	@echo "Starting services..."
	@docker compose up -d
	@echo "Waiting for services to be ready..."
	@sleep 3
	@echo "Services started. Check health with: docker compose ps"

# Stop all services
stop:
	@echo "Stopping services..."
	@docker compose down

# Run the client (after starting services)
run:
	@echo "Running client..."
	@docker run --rm \
		-v "$(shell pwd)/dist:/app" \
	    -v /app/node_modules \
		-v overlay_caddy-data:/data:ro \
		-w /app \
		--network overlay_naylence-net \
		--env-file config/.env.client \
		$(DOCKER_IMAGE) \
		node client.mjs

# Run the client with verbose logging
run-verbose:
	@echo "Running client with verbose logging..."
	@docker run --rm \
		-v "$(shell pwd)/dist:/app" \
		-v /app/node_modules \
		-v overlay_caddy-data:/data:ro \
		-w /app \
		--network overlay_naylence-net \
		--env-file config/.env.client \
		-e FAME_SHOW_ENVELOPES=true \
		$(DOCKER_IMAGE) \
		node client.mjs

# Clean up generated files and volumes
clean:
	@echo "Cleaning up..."
	@docker compose down -v 2>/dev/null || true
	@rm -f config/.env.client
	@rm -f config/.env.agent
	@rm -f config/.env.sentinel
	@rm -f config/.env.oauth2-server
	@rm -rf config/secrets
	@rm -rf node_modules dist
	@echo "Clean complete!"

# Show help
help:
	@echo "Overlay Security Example - Available targets:"
	@echo "  init         - Generate secrets and .env files"
	@echo "  build        - Build Docker image"
	@echo "  start        - Start all services (runs init first)"
	@echo "  stop         - Stop all services"
	@echo "  run          - Run the client (requires services to be running)"
	@echo "  run-verbose  - Run the client with debug logging (shows signed envelopes)"
	@echo "  clean        - Remove generated files and Docker volumes"
