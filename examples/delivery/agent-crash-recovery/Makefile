
.DEFAULT_GOAL := start

init:
	@echo "Installing dependencies..."
	npm install
	@echo "Generating local configuration and secrets..."
	@KEEP_CREDENTIALS=false node ../../../scripts/generate-secrets.mjs
	@mkdir -p data/agent

build: init
	npm run build

start: build
	@mkdir -p data/agent
	docker compose up -d

stop:
	docker compose down --remove-orphans 2>/dev/null || true

run:
	@mkdir -p data/agent
	@if [ ! -f config/.env.client ]; then \
		echo "❌ Missing config/.env.client. Run 'make init' first."; \
		exit 1; \
	fi
	@echo "Running client to send a message (with crash and recovery demonstration)..."
	@set -a && . config/.env.client && set +a && node dist/client.mjs
	@echo
	@echo "Message-agent logs:"
	@docker compose logs message-agent

run-verbose:
	@mkdir -p data/agent
	@if [ ! -f config/.env.client ]; then \
		echo "❌ Missing config/.env.client. Run 'make init' first."; \
		exit 1; \
	fi
	@echo "Running client to send a message (with crash and recovery demonstration)..."
	@set -a && . config/.env.client && FAME_SHOW_ENVELOPES=true set +a && node dist/client.mjs
	@echo
	@echo "Message-agent logs:"
	@docker compose logs message-agent

logs:
	@echo "Tailing message-agent logs (press Ctrl+C to stop)..."
	docker compose logs -f -t --tail=100 message-agent

clean: stop
	@echo "Cleaning build artifacts"
	@rm -rf node_modules dist
	@rm -rf data
	@rm -rf config/.env.agent config/.env.client config/.secrets

.PHONY: init build start stop run run-verbose logs clean
