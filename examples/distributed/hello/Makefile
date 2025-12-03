.DEFAULT_GOAL := start

DOCKER_IMAGE := naylence/agent-sdk-node:0.3.5

# Install dependencies
install:
	npm install --legacy-peer-deps

# Build TypeScript code
build: install
	npm run build

# Start all services in Docker
start: build
	docker compose up -d

stop:
	docker compose down --remove-orphans

run:
	@FAME_SHOW_ENVELOPES=false \
	FAME_LOG_LEVEL=WARNING \
	FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream" \
	FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk \
	node dist/client.mjs

run-verbose:
	@FAME_SHOW_ENVELOPES=true \
	FAME_LOG_LEVEL=WARNING \
	FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream" \
	FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk \
	node dist/client.mjs

run-docker:
	@docker run --rm \
	-v "$(shell pwd)/dist:/app" \
	-v /app/node_modules \
	--network "$(shell basename "$(shell pwd)")_naylence-net" \
	-e FAME_SHOW_ENVELOPES=false \
	-e FAME_DIRECT_ADMISSION_URL="ws://echo-agent:8000/fame/v1/attach/ws/downstream" \
	-e FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk \
	$(DOCKER_IMAGE) \
	node client.mjs

run-docker-verbose:
	@docker run --rm \
	-v "$(shell pwd)/dist:/app" \
	-v /app/node_modules \
	--network "$(shell basename "$(shell pwd)")_naylence-net" \
	-e FAME_SHOW_ENVELOPES=true \
	-e FAME_DIRECT_ADMISSION_URL="ws://echo-agent:8000/fame/v1/attach/ws/downstream" \
	-e FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk \
	$(DOCKER_IMAGE) \
	node client.mjs

run-browser:
	@echo "🌐 Starting browser client on http://localhost:3000"
	@echo "⚠️  Make sure the echo agent is running (make start)"
	cd browser && npm run dev

clean: stop
	@echo "🧹 Cleaning build artifacts"
	@rm -rf node_modules dist browser/dist browser/node_modules

.PHONY: start stop build run run-verbose run-docker run-docker-verbose run-browser clean install