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

run-browser:
	@echo "🌐 Starting browser client on http://localhost:3000"
	@echo "Make sure the sentinel and math agent are running (make start)"
	cd browser && npm run dev

clean: stop
	@echo "🧹 Cleaning build artifacts"
	@rm -rf node_modules dist browser/dist browser/node_modules

.PHONY: start stop build run run-verbose run-browser clean install
