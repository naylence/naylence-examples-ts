# Naylence React Hello Example

This example shows the smallest possible React application that wires up the Naylence Fabric using the `@naylence/react` provider hooks. It renders a single component that connects to the Fame Fabric, demonstrates the `useFabric`, `useFabricEffect`, and `useRemoteAgent` hooks, and logs activity in the browser console. **Everything runs inside the browser—no local Node server or backend fabric node is required—so you can observe the full lifecycle using only DevTools.**

## Prerequisites

- Node.js 18+
- npm 9+

## Getting Started

```bash
cd examples/hello
make install
make run
```

Open the printed Vite dev server URL (typically http://localhost:5173) to see the component connect to the fabric. Watch the browser console for the step-by-step lifecycle logs produced by the `FabricProvider`.

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

## How It Works

1. `src/main.tsx` wraps the app with `<FabricProvider>`.
2. Components call `useFabric` to read status and fabric instance, `useFabricEffect` to run work only when ready, and `useRemoteAgent` to create typed proxies for remote agents.
3. Logging is enabled in the hooks so you can follow the connection lifecycle end-to-end.

Use this project as a starting point for integrating Naylence into your own React apps—copy it, change the agent addresses you call, and iterate from there, all while keeping the fabric runtime completely client-side.
