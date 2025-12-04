# Naylence Vue Hello - 3 Node Architecture

This Vue 3 example runs a 3-node Naylence fabric completely in the browser—no backend services. It splits the responsibilities into Client → Sentinel → Agent so you can see a browser-only distributed topology.

## Architecture

- **Client Node**: Invokes the agent service and shows responses.
- **Sentinel Node**: Routes messages between the client and agent nodes.
- **Agent Node**: Hosts and runs the `HelloAgent` service.

All nodes communicate via `BroadcastChannel` in a single tab, so you can inspect the full handshake with DevTools alone.

## Key Differences from 2-Node Setup

In the 2-node `hello` example, the agent runs on the sentinel. Here:
- The sentinel is only a router/coordinator.
- The agent runs on its own node.
- This mirrors backend deployments where agents live on separate services.

## Running the Example

```bash
cd examples/vue/hello-3node
make install
make run
```

Open the printed URL (typically http://localhost:5173) to see the three-node chain come online.

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

## How It Works

1. `src/App.vue` orchestrates startup order for the three `<FabricProvider>` instances.
2. `src/SentinelNode.vue` uses `useFabricEffect` to bring the router online first.
3. `src/AgentNode.vue` serves `HelloAgent` at `hello@fame.fabric` once the sentinel is ready.
4. `src/ClientNode.vue` uses `useRemoteAgent` to call the agent after both upstream nodes are available.
5. `src/config-3node-broadcast.ts` wires the BroadcastChannel transport for all nodes.

Because everything is browser-resident, you can watch the entire flow—client requests, sentinel routing, agent replies—without running separate processes.
