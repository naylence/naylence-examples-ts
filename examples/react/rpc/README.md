# RPC Example

This example demonstrates using the Naylence React integration with a MathAgent that exposes RPC operations using the `@operation` decorator.

## Features

- **MathAgent** with three operations:
  - `add(x, y)` - Simple addition
  - `multiply(x, y)` - Simple multiplication  
  - `fib_stream(n)` - Streaming Fibonacci sequence

- **Decorator Support** - Uses `@operation` decorator with proper Vite/Babel configuration

- **Streaming RPC** - Demonstrates async generator streaming from agent to client

## Running

```bash
make install
make run
```

## Available Commands

### Using Make (recommended)

| Command | Description |
| --- | --- |
| `make install` | Installs dependencies with npm. |
| `make run` | Starts the Vite dev server with fast refresh. |
| `make build` | Type-checks the project and builds the production bundle. |
| `make preview` | Serves the production build locally for quick smoke tests. |
| `make lint` | Runs ESLint using the config from `eslint.config.js`. |
| `make clean` | Removes node_modules and dist directories. |

### Using npm directly

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the Vite dev server with fast refresh. |
| `npm run build` | Type-checks the project and builds the production bundle. |
| `npm run preview` | Serves the production build locally for quick smoke tests. |
| `npm run lint` | Runs ESLint using the config from `eslint.config.js`. |

## Architecture

- **MathSentinel** - Serves the MathAgent on the Sentinel node
- **MathClient** - Connects to the agent and invokes operations
- **BroadcastChannel** - Communication between client and sentinel in the browser
