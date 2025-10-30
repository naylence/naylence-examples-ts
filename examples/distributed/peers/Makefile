.DEFAULT_GOAL := start

install:
	npm install

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
	node dist/client.mjs

run-verbose:
	@FAME_SHOW_ENVELOPES=true \
	FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream" \
	node dist/client.mjs

run-docker:
	@docker run --rm \
	-v "$(shell pwd)/dist:/app" \
	-v /app/node_modules \
	--network "$(shell basename "$(shell pwd)")_naylence-net" \
	-e FAME_SHOW_ENVELOPES=false \
	-e FAME_DIRECT_ADMISSION_URL="ws://peer-sentinel1:8000/fame/v1/attach/ws/downstream" \
	-e FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk \
	-e NODE_ENV=production \
	naylence/agent-sdk-node:0.3.0 \
	node client.mjs

run-docker-verbose:
	@docker run --rm \
	-v "$(shell pwd)/dist:/app" \
	-v /app/node_modules \
	--network "$(shell basename "$(shell pwd)")_naylence-net" \
	-e FAME_SHOW_ENVELOPES=true \
	-e FAME_DIRECT_ADMISSION_URL="ws://peer-sentinel1:8000/fame/v1/attach/ws/downstream" \
	-e FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk \
	-e NODE_ENV=production \
	naylence/agent-sdk-node:0.3.0 \
	node client.mjs

clean: stop
	@echo "🧹 Cleaning up..."
	rm -rf dist node_modules

.PHONY: start stop run run-verbose run-docker run-docker-verbose clean
