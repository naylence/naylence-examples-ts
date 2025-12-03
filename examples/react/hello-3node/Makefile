.DEFAULT_GOAL := run

# Install dependencies
install:
	npm install --legacy-peer-deps

# Build the React application
build: install
	npm run build

# Start development server
run: install
	@echo "🚀 Starting React 3-Node example on http://localhost:5173"
	npm run dev

# Preview production build
preview: build
	@echo "🌐 Previewing production build on http://localhost:4173"
	npm run preview

# Lint the code
lint:
	npm run lint

# Clean build artifacts and node_modules
clean:
	@echo "🧹 Cleaning build artifacts"
	@rm -rf node_modules dist

.PHONY: install build run preview lint clean
