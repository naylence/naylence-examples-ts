.PHONY: init build start stop run run-verbose clean help

DOCKER_IMAGE := naylence/agent-sdk-adv-node:0.3.5

# Generate secrets and .env files
init:
	@echo "🔐 Generating PKI certificates..."
	@mkdir -p config/certs
	@node scripts/setup-pki.mjs --output ./config/certs --org "Stickiness Development"
	
	@echo "🔑 Generating dev secrets..."
	@KEEP_CREDENTIALS=false node ../../../scripts/generate-secrets.mjs

# Build TypeScript sources
build:
	@echo "📦 Installing dependencies..."
	@npm install
	@echo "🔨 Building TypeScript sources..."
	@npm run build

# Start all services
start: build init
	@echo "🚀 Starting services..."
	@docker compose up -d
	@echo "⏳ Waiting for services to be ready..."
	@sleep 3
	@echo "✅ Services started. Check health with: docker compose ps"

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
		-v "$(shell pwd)/config/certs:/etc/fame/certs:ro" \
		-v stickiness_caddy-data:/data \
		-w /app \
		--network stickiness_naylence-net \
		--env-file config/.env.client \
		$(DOCKER_IMAGE) \
		node client.mjs

# Run the client with verbose logging
run-verbose:
	@echo "Running client with verbose logging..."
	@docker run --rm \
		-v "$(shell pwd)/dist:/app" \
		-v /app/node_modules \
		-v "$(shell pwd)/config/certs:/etc/fame/certs:ro" \
		-v stickiness_caddy-data:/data \
		-w /app \
		--network stickiness_naylence-net \
		--env-file config/.env.client \
		-e FAME_SHOW_ENVELOPES=true \
		$(DOCKER_IMAGE) \
		node client.mjs

# Clean up generated files and volumes
clean:
	@echo "🧹 Cleaning up..."
	@docker compose down -v 2>/dev/null || true
	@rm -f config/.env.client config/.env.agent config/.env.sentinel
	@rm -f config/.env.oauth2-server config/.env.welcome config/.env.ca
	@rm -rf config/secrets config/.secrets
	@rm -rf config/certs
	@rm -rf node_modules dist
	@echo "✅ Clean complete!"

# Show help
help:
	@echo "Stickiness Security Example - Available targets:"
	@echo "  init         - Generate secrets and .env files"
	@echo "  build        - Build TypeScript sources"
	@echo "  start        - Start all services (runs init and build)"
	@echo "  stop         - Stop all services"
	@echo "  run          - Run the client (requires services to be running)"
	@echo "  run-verbose  - Run the client with debug logging"
	@echo "  clean        - Remove generated files and Docker volumes"
