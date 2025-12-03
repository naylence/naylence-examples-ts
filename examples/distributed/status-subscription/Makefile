.DEFAULT_GOAL := start

install:
	npm install

build: install
	npm run build

start: build
	docker compose up -d

stop:
	docker compose down --remove-orphans

run:
	@FAME_SHOW_ENVELOPES=false \
	FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream" \
	npm run client

run-verbose:
	@FAME_SHOW_ENVELOPES=true \
	FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream" \
	npm run client

run-browser:
	@echo "🌐 Starting browser client on http://localhost:3000"
	@echo "⚠️  Make sure the sentinel and status agent are running (make start)"
	cd browser && npm run dev

run-docker:
	@docker run --rm \
	-e FAME_SHOW_ENVELOPES=false \
	-e FAME_DIRECT_ADMISSION_URL="ws://sentinel:8000/fame/v1/attach/ws/downstream" \
	--network status-subscription_naylence-net \
	-v $(PWD)/dist:/workspace/naylence-examples-ts/examples/distributed/status-subscription/dist:ro \
	-w /workspace/naylence-examples-ts/examples/distributed/status-subscription \
	naylence-status-subscription:latest \
	node dist/client.mjs

run-docker-verbose:
	@docker run --rm \
	-e FAME_SHOW_ENVELOPES=true \
	-e FAME_DIRECT_ADMISSION_URL="ws://sentinel:8000/fame/v1/attach/ws/downstream" \
	--network status-subscription_naylence-net \
	-v $(PWD)/dist:/workspace/naylence-examples-ts/examples/distributed/status-subscription/dist:ro \
	-w /workspace/naylence-examples-ts/examples/distributed/status-subscription \
	naylence-status-subscription:latest \
	node dist/client.mjs

clean: stop
	@echo "🧹 Cleaning build artifacts"
	@rm -rf node_modules dist browser/dist browser/node_modules

.PHONY: start stop run run-verbose run-browser run-docker run-docker-verbose clean
