.DEFAULT_GOAL := build

DOCKER_IMAGE ?= naylence-llm-ts
SCRIPT ?= llm-agent.mjs

build:
	@echo "📦 Installing dependencies..."
	@npm install
	@echo "🔨 Building TypeScript sources..."
	@npm run build
	@echo "🐳 Building Docker image..."
	@docker build -f Dockerfile -t $(DOCKER_IMAGE) .

run:
	@echo "🚀 Running LLM example: $(SCRIPT)"
	@docker run --rm -it \
		-v "$(shell pwd)/dist:/app" \
		-v /app/node_modules \
		-e OPENAI_API_KEY=$${OPENAI_API_KEY} \
		-e FAME_LOG_LEVEL=WARNING \
		-e FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk \
		$(DOCKER_IMAGE) node $(SCRIPT)

run-ci:
	@echo "🚀 Running LLM example: $(SCRIPT) (CI mode)"
	@docker run --rm \
		-v "$(shell pwd)/dist:/app" \
		-v /app/node_modules \
		-e OPENAI_API_KEY=$${OPENAI_API_KEY} \
		-e FAME_LOG_LEVEL=WARNING \
		-e FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk \
		$(DOCKER_IMAGE) node $(SCRIPT)

clean:
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf node_modules dist

%:
	@:
