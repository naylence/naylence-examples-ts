.DEFAULT_GOAL := start

DOCKER_IMAGE := naylence/agent-sdk-node:0.3.5

init:
	@echo "📦 Installing dependencies..."
	@npm install
	@echo "🔑 Generating development secrets..."
	@KEEP_CREDENTIALS=false node ../../../scripts/generate-secrets.mjs --recursive --hmac --oauth-json

build:
	@echo "🔨 Building TypeScript sources..."
	@npm run build

start: init build
	@echo "� Starting services..."
	@docker compose up -d

# Stop all stop
stop:
	@echo "Stopping services..."
	@docker compose down

run:
	@if [ ! -f config/.env.client ]; then \
		echo "❌ Missing config/.env.client. Run 'make init' first."; \
		exit 1; \
	fi
	@if [ ! -f config/.env.agent ]; then \
		echo "❌ Missing config/.env.agent. Run 'make init' first."; \
		exit 1; \
	fi
	@echo "🧪 Running client..."
	@docker run --rm \
		-v "$(shell pwd)/dist:/app" \
		-v /app/node_modules \
		-v http-connector_caddy-data:/data:ro \
		--network http-connector_naylence-net \
		--env-file config/.env.client \
		$(DOCKER_IMAGE) \
		node --enable-source-maps client.mjs

run-verbose:
	@if [ ! -f config/.env.client ]; then \
		echo "❌ Missing config/.env.client. Run 'make init' first."; \
		exit 1; \
	fi
	@if [ ! -f config/.env.agent ]; then \
		echo "❌ Missing config/.env.agent. Run 'make init' first."; \
		exit 1; \
	fi
	@echo "🧪 Running client with verbose logging..."
	@docker run --rm \
		-v "$(shell pwd)/dist:/app" \
		-v /app/node_modules \
		-v http-connector_caddy-data:/data:ro \
		--network http-connector_naylence-net \
		--env-file config/.env.client \
		-e FAME_SHOW_ENVELOPES=true \
		$(DOCKER_IMAGE) \
		node --enable-source-maps client.mjs

logs:
	docker compose logs -f -t --tail=100 math-agent-internal

clean: stop
	@echo "🧹 Cleaning build artifacts"
	@rm -rf node_modules dist
	@rm -f config/.env.agent config/.env.client config/.env.sentinel config/.env.oauth2-server
	@rm -rf config/.secrets
	@docker volume rm http-connector_caddy-data 2>/dev/null || true

.PHONY: init build start stop run run-verbose logs clean
