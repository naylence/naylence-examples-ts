.DEFAULT_GOAL := help

help:
	@echo "📚 Stateful Conversation Example - Available Commands:"
	@echo ""
	@echo "  make build         - Build TypeScript and Docker image"
	@echo "  make start         - Start sentinel and chat-agent containers"
	@echo "  make stop          - Stop all containers"
	@echo "  make run           - Run interactive chat client"
	@echo "  make test          - Run automated test client"
	@echo "  make run-verbose   - Run with envelope debugging"
	@echo "  make clean         - Stop containers"
	@echo ""

check-openai-key:
	@if [ -z "$$OPENAI_API_KEY" ]; then \
		echo "❌ Error: OPENAI_API_KEY environment variable is not set"; \
		echo "Please set it with: export OPENAI_API_KEY='sk-...'"; \
		exit 1; \
	fi

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
	@echo "🚀 Running interactive chat client..."
	@FAME_SHOW_ENVELOPES=false \
	FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream" \
	node dist/client.mjs

test: check-openai-key
	@echo "🧪 Running automated test client..."
	@FAME_SHOW_ENVELOPES=false \
	FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream" \
	OPENAI_API_KEY=${OPENAI_API_KEY} \
	node dist/test-client.mjs

run-verbose: check-openai-key
	@echo "🚀 Running interactive chat client (verbose mode)..."
	@FAME_SHOW_ENVELOPES=true \
	FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream" \
	OPENAI_API_KEY=${OPENAI_API_KEY} \
	node dist/client.mjs

clean: stop
	@echo "🧹 Cleaning build artifacts"
	@rm -rf node_modules dist
	@echo "🧹 Cleanup complete"

.PHONY: help check-openai-key build start stop run test run-verbose clean
