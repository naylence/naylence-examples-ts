.PHONY: init build start stop run run-verbose run-browser clean help

# Docker image for Naylence Agent SDK with Advanced Security
DOCKER_IMAGE := naylence/agent-sdk-adv-node:0.3.5

.DEFAULT_GOAL := help

# Initialize: generate certificates and secrets
init:
	@echo "🔐 Generating PKI certificates..."
	@docker run --rm \
		-v "$(shell pwd):/work" \
		-w /work \
		$(DOCKER_IMAGE) \
		node scripts/setup-pki.mjs --output ./config/certs --org "Strict Overlay Development"
	
	@echo "🔑 Generating dev secrets..."
	node ../../../scripts/generate-secrets.mjs


# Build TypeScript sources
build:
	@echo "📦 Installing dependencies..."
	@npm install
	@echo "🔨 Building TypeScript code..."
	@npm run build

# Start all services (builds TypeScript, generates init files, starts containers)
start: build init
	@echo "🚀 Starting services..."
	@docker compose up -d
	@echo "⏳ Waiting for services to be ready..."
	@sleep 5
	@echo "✅ Services started!"

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
		-v advanced_caddy-data:/data \
		-w /app \
		--network advanced_naylence-net \
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
		-v advanced_caddy-data:/data:ro \
		-w /app \
		--network advanced_naylence-net \
		--env-file config/.env.client \
		-e FAME_SHOW_ENVELOPES=true \
		$(DOCKER_IMAGE) \
		node client.mjs

run-browser:
	@echo "🌐 Starting strict overlay browser client on http://localhost:3000"
	@echo "🔐 Ensure the Caddy root certificate (https://localhost:8443) is trusted before continuing."
	cd browser && npm install && npm run dev

# Clean up generated files and volumes
clean: stop
	@echo "🧹 Cleaning generated files..."
	@docker compose down -v 2>/dev/null || true
	@rm -f config/.env.client
	@rm -f config/.env.agent
	@rm -f config/.env.sentinel
	@rm -f config/.env.oauth2-server
	@rm -f config/.env.welcome
	@rm -f config/.env.welcome-browser
	@rm -f config/.env.ca
	@echo "🧹 Cleaning secrets directory..."
	@rm -rf config/secrets
	@echo "🧹 Cleaning PKI certificates..."
	@rm -rf config/certs
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf node_modules dist browser/node_modules browser/dist browser/env.js
	@echo "✅ Clean complete!"

# Show help
help:
	@echo "Advanced Security Example - Available targets:"
	@echo "  init          - Generate PKI certificates and secrets"
	@echo "  build         - Build TypeScript code"
	@echo "  start         - Build, initialize, and start all services"
	@echo "  stop          - Stop all services"
	@echo "  run           - Run the client (requires services to be running)"
	@echo "  run-verbose   - Run the client with envelope display"
	@echo "  run-browser   - Launch the browser PKCE client for strict overlay"
	@echo "  clean         - Remove generated files and Docker volumes"
	@echo ""
	@echo "Quick start:"
	@echo "  make start    # Start everything"
	@echo "  make run      # Test the client"
	@echo "  make clean    # Clean up when done"
