.DEFAULT_GOAL := help

DOCKER_IMAGE := naylence/agent-sdk-node:0.3.3

help:
	@echo "📚 Storage Provider Example - Available Commands:"
	@echo ""
	@echo "  make init          - Generate master encryption key and config files"
	@echo "  make build         - Build TypeScript and Docker image"
	@echo "  make start         - Initialize and start sentinel + agent containers"
	@echo "  make stop          - Stop all containers"
	@echo "  make run           - Run client to test storage operations"
	@echo "  make run-verbose   - Run client with envelope debugging"
	@echo "  make clean         - Stop containers and remove all generated data"
	@echo ""

init:
	@echo "🔐 Generating master encryption key and configuration files..."
	@KEEP_CREDENTIALS=false node ../../../scripts/generate-secrets.mjs

build:
	@echo "📦 Installing dependencies..."
	@npm install
	@echo "🔨 Building TypeScript..."
	@npm run build

start: init build
	@echo "🚀 Starting services..."
	docker compose up -d
	@echo "⏳ Waiting for services to be ready..."
	@sleep 3
	@echo "✅ Services started!"

stop:
	@echo "🛑 Stopping services..."
	docker compose down --remove-orphans

run:
	@if [ ! -f config/.env.agent ]; then \
		echo "❌ Error: Configuration not initialized. Run 'make init' first."; \
		exit 1; \
	fi
	@echo "🧪 Running client..."
	@docker run --rm \
		-v "$(shell pwd)/dist:/app" \
		-v /app/node_modules \
		-v "$(shell pwd)/config/certs:/etc/fame/certs:ro" \
		-v advanced_caddy-data:/data:ro \
		-w /app \
		--network "storage-provider_naylence-net" \
		--env-file config/.env.client \
		-e FAME_SHOW_ENVELOPES=false \
		$(DOCKER_IMAGE) \
		node client.mjs

run-verbose:
	@if [ ! -f config/.env.agent ]; then \
		echo "❌ Error: Configuration not initialized. Run 'make init' first."; \
		exit 1; \
	fi
	@echo "🧪 Running client (verbose mode)..."
	@docker run --rm \
		-v "$(shell pwd)/dist:/app" \
		-v /app/node_modules \
		-v "$(shell pwd)/config/certs:/etc/fame/certs:ro" \
		-v advanced_caddy-data:/data:ro \
		-w /app \
		--network "storage-provider_naylence-net" \
		--env-file config/.env.client \
		-e FAME_SHOW_ENVELOPES=true \
		$(DOCKER_IMAGE) \
		node client.mjs

clean: stop
	@echo "🧹 Cleaning generated files..."
	@rm -rf config/.env.agent config/.env.sentinel config/.env.client 2>/dev/null || true
	@echo "🧹 Cleaning data directory..."
	@docker run --rm -v "$(shell pwd)/data:/work/data" alpine:latest sh -c "rm -rf /work/data/*" 2>/dev/null || rm -rf data 2>/dev/null || true
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf dist node_modules package-lock.json
	@echo "✅ Cleanup complete"

.PHONY: help init build start stop run run-verbose clean

