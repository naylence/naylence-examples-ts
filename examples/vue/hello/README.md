# Naylence Vue Hello Example

This is the smallest Vue 3 app that wires up the Naylence Fabric using the `@naylence/vue` components and composables. A single page hosts both a **Sentinel node** (serving the `HelloAgent`) and a **Client node** that calls it. Everything runs in the browser—no backend fabric node—so you can watch the full lifecycle in DevTools.

## Prerequisites

- Node.js 18+
- npm 9+

## Getting Started

```bash
cd examples/vue/hello
make install
make run
```

Open the printed Vite dev server URL (typically http://localhost:5173). Check the console to see the fabric connection and agent serving logs.

## Available Commands

### Using Make (recommended)

| Command | Description |
| --- | --- |
| `make install` | Installs dependencies with npm. |
| `make run` | Starts the Vite dev server with hot reload. |
| `make build` | Type-checks and builds the production bundle. |
| `make preview` | Serves the production build locally for quick smoke tests. |
| `make lint` | Runs ESLint using `eslint.config.js`. |
| `make clean` | Removes `node_modules` and `dist`. |

### Using npm directly

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the Vite dev server. |
| `npm run build` | Type-checks and builds the production bundle. |
| `npm run preview` | Serves the production build locally. |
| `npm run lint` | Runs ESLint. |

## How It Works

1. `src/main.ts` mounts the Vue app.
2. `src/App.vue` renders two `<FabricProvider>` instances—one for the sentinel, one for the client—and sequences their startup.
3. `src/SentinelNode.vue` uses `useFabricEffect` to serve `HelloAgent` at `hello@fame.fabric`, while showing received messages.
4. `src/ClientNode.vue` uses `useRemoteAgent` to call `runTask` on the agent and render responses.

Use this project as a starting point for adding Naylence to Vue apps: copy it, change the agent addresses, and keep everything client-side for quick iteration.
