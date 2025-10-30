.DEFAULT_GOAL := start

# Install dependencies
install:
	npm install --legacy-peer-deps

# Build TypeScript code
build: install
	npm run build

# Start all services in Docker
start: build
	docker compose up -d

# Stop all services
stop:
	docker compose down --remove-orphans

# Run the client locally (requires services to be running)
run:
	@FAME_SHOW_ENVELOPES=false \
	FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream" \
	node --enable-source-maps dist/client.mjs

# Run the client with verbose envelope logging
run-verbose:
	@FAME_SHOW_ENVELOPES=true \
	FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream" \
	node --enable-source-maps dist/client.mjs

# View logs from all services
logs:
	docker compose logs -f

# View logs from the sentinel
logs-sentinel:
	docker compose logs -f sentinel

# View logs from the sender
logs-sender:
	docker compose logs -f push-sender

# View logs from the receiver
logs-receiver:
	docker compose logs -f push-receiver

# Clean up everything
clean: stop
	@echo "🧹 Cleaning build artifacts"
	@rm -rf node_modules dist
	docker compose down -v --remove-orphans 2>/dev/null || true

# Rebuild from scratch
rebuild: clean build

.PHONY: install build start stop run run-verbose logs logs-sentinel logs-sender logs-receiver clean rebuild
