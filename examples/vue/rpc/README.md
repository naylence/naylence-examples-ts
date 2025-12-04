# Naylence Vue RPC Example

This Vue 3 sample shows the Naylence Vue integration with a `MathAgent` that exposes RPC operations via decorators. It runs entirely in the browser with a client node calling a sentinel-hosted agent over `BroadcastChannel`.

## Features

- **MathAgent** with three operations:
  - `add(x, y)` – simple addition
  - `multiply(x, y)` – simple multiplication
  - `fib_stream(n)` – streaming Fibonacci sequence
- **Decorator Support** via `@operation` annotations in `MathAgent`
- **Streaming RPC** from agent to client using async generators

## Running

```bash
cd examples/vue/rpc
make install
make run
```

Open the printed URL (typically http://localhost:5173) and try the math operations.

## Available Commands

### Using Make (recommended)

| Command | Description |
| --- | --- |
| `make install` | Installs dependencies with npm. |
| `make run` | Starts the Vite dev server with hot reload. |
| `make build` | Type-checks and builds the production bundle. |
| `make preview` | Serves the production build locally. |
| `make lint` | Runs ESLint using `eslint.config.js`. |
| `make clean` | Removes `node_modules` and `dist`. |

### Using npm directly

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the Vite dev server. |
| `npm run build` | Type-checks and builds the production bundle. |
| `npm run preview` | Serves the production build locally. |
| `npm run lint` | Runs ESLint. |

## Architecture

- **MathSentinel (`src/MathSentinel.vue`)** – uses `useFabricEffect` to serve `MathAgent` at `math@fame.fabric` and log calls.
- **MathClient (`src/MathClient.vue`)** – uses `useRemoteAgent` to invoke add/multiply/Fibonacci operations and render results.
- **config (`src/config.ts`)** – wires both nodes to the browser-only BroadcastChannel transport.

Use this as a starting point for RPC-style agents in Vue—copy it, adjust the agent methods, and keep the fabric runtime in-page for quick iteration.
