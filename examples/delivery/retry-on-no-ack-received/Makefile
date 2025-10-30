.DEFAULT_GOAL := start

init:
	@echo "Installing dependencies..."
	npm install
	@echo "Generating configuration files..."
	@if [ ! -f config/.env.client ]; then \
		cp config/.env.client.example config/.env.client; \
	fi
	@if [ ! -f config/.env.agent ]; then \
		cp config/.env.agent.example config/.env.agent; \
	fi

build: init
	npm run build

start: build
	docker compose up -d

stop:
	docker compose down --remove-orphans 2>/dev/null || true

run:
	@echo "Running client to send a message (with retries on no ACK received)..."
	@set -a && . config/.env.client && set +a && node dist/client.mjs
	@echo
	@echo "Message-agent logs:"
	@docker compose logs message-agent

run-verbose:
	@echo "Running client to send a message (with retries on no ACK received)..."
	@set -a && . config/.env.client && FAME_SHOW_ENVELOPES=true set +a && node dist/client.mjs
	@echo
	@echo "Message-agent logs:"
	@docker compose logs message-agent

logs:
	@echo "Tailing message-agent logs (press Ctrl+C to stop)..."
	docker compose logs -f -t --tail=100 message-agent

clean: stop
	@echo "🧹 Cleaning build artifacts"
	@rm -rf node_modules dist
	@rm -f config/.env.client config/.env.agent

.PHONY: init build start stop run run-verbose logs clean
