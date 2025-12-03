.DEFAULT_GOAL := start

build:
	@echo "📦 Installing dependencies..."
	@npm install
	@echo "🔨 Building TypeScript sources..."
	@npm run build
	@echo "🐳 Building Docker image..."
	@docker compose build

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

run-browser:
	@echo "🌐 Starting browser client on http://localhost:3000"
	@cd browser && npm install && npm run dev

clean: stop
	@echo "🧹 Cleaning build artifacts"
	@rm -rf node_modules dist browser/node_modules browser/dist

.PHONY: build start stop run run-verbose run-browser clean
