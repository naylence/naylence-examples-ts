.DEFAULT_GOAL := run

# Default script if none is provided
SCRIPT ?= echo-agent.ts

# Override SCRIPT with first argument if provided
ifneq ($(word 2,$(MAKECMDGOALS)),)
SCRIPT := $(word 2,$(MAKECMDGOALS))
endif

# Extract base name without extension for npm script lookup
SCRIPT_BASE := $(basename $(SCRIPT))

# Common environment variables
FAME_PLUGINS ?= @naylence/runtime,@naylence/agent-sdk
TSCONFIG := tsconfig.json

start:
	

stop:
	

run:
	@echo "🚀 Running $(SCRIPT)..."
	@cd ../.. && npx cross-env FAME_PLUGINS=$(FAME_PLUGINS) npx tsx --tsconfig examples/simple/$(TSCONFIG) examples/simple/$(SCRIPT)

run-verbose:
	@echo "🚀 Running $(SCRIPT) with verbose logging..."
	@cd ../.. && npx cross-env FAME_PLUGINS=$(FAME_PLUGINS) npx tsx --tsconfig examples/simple/$(TSCONFIG) examples/simple/$(SCRIPT)

clean: stop
	@echo "🧹 Nothing to clean"

# Catch-all rule to prevent make from trying to execute script names as targets
%:
	@:

