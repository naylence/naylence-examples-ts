.DEFAULT_GOAL := start

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
	FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream" \
	FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk \
	node dist/client.mjs

run-verbose:
	@FAME_SHOW_ENVELOPES=true \
	FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream" \
	FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk \
	node dist/client.mjs

run-docker:
	@docker run --rm \
	-v "$(shell pwd):/work:ro" \
	-w /work \
	--network "$(shell basename "$(shell pwd)")_naylence-net" \
	-e FAME_SHOW_ENVELOPES=false \
	-e FAME_DIRECT_ADMISSION_URL="ws://sentinel:8000/fame/v1/attach/ws/downstream" \
	-e FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk \
	-e NODE_ENV=production \
	node:24-bullseye-slim \
	sh -c "npm install && npm run build && node dist/client.mjs"

run-docker-verbose:
	@docker run --rm \
	-v "$(shell pwd):/work:ro" \
	-w /work \
	--network "$(shell basename "$(shell pwd)")_naylence-net" \
	-e FAME_SHOW_ENVELOPES=true \
	-e FAME_DIRECT_ADMISSION_URL="ws://sentinel:8000/fame/v1/attach/ws/downstream" \
	-e FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk \
	-e NODE_ENV=production \
	node:24-bullseye-slim \
	sh -c "npm install && npm run build && node dist/client.mjs"

clean: stop
	@echo "🧹 Cleaning build artifacts"
	@rm -rf node_modules dist

.PHONY: start stop build run run-verbose run-docker run-docker-verbose clean install
