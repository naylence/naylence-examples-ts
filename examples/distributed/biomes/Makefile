.DEFAULT_GOAL := start

# Install dependencies
install:
	npm install

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
	FAME_LOG_LEVEL=WARNING \
	FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream" \
	FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk \
	node --enable-source-maps dist/client.mjs

# Run the client with verbose envelope logging
run-verbose:
	@FAME_SHOW_ENVELOPES=true \
	FAME_LOG_LEVEL=WARNING \
	FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream" \
	FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk \
	node --enable-source-maps dist/client.mjs

# View logs from all services
logs:
	docker compose logs -f

# View logs from a specific service
logs-main:
	docker compose logs -f main-sentinel

logs-child1:
	docker compose logs -f child-sentinel1

logs-child2:
	docker compose logs -f child-sentinel2

logs-agent1:
	docker compose logs -f math-agent1

logs-agent2:
	docker compose logs -f math-agent2

# Clean up everything
clean: stop
	@echo "🧹 Cleaning build artifacts"
	@rm -rf node_modules dist

# Rebuild from scratch
rebuild: clean build

.PHONY: install build start stop run run-verbose logs logs-main logs-child1 logs-child2 logs-agent1 logs-agent2 clean rebuild
