.DEFAULT_GOAL := start

build:
	@echo "📦 Installing backend dependencies..."
	@npm install
	@echo "🔨 Building backend TypeScript sources..."
	@npm run build
	@echo "🐳 Building Docker image..."
	@docker compose build

start: build
	docker compose up -d

stop:
	docker compose down --remove-orphans

run-browser:
	@echo "🌐 Starting React frontend on http://localhost:3000"
	@cd browser && npm install && npm run dev

clean: stop
	@echo "🧹 Cleaning build artifacts"
	@rm -rf node_modules dist browser/node_modules browser/dist

.PHONY: build start stop run-frontend clean
