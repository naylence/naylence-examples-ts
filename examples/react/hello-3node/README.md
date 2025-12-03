# Hello App - 3 Node Architecture

This example demonstrates a 3-node Naylence fabric architecture running entirely in the browser—every node stays in the same tab, no backend services required.

## Architecture

- **Client Node**: Makes requests to the agent service
- **Sentinel Node**: Routes messages between the client and agent nodes
- **Agent Node**: Hosts and runs the HelloAgent service

All three nodes communicate via `BroadcastChannel` API in the browser, so you can inspect the full distributed topology with only DevTools open.

## Key Differences from 2-Node Setup

In the 2-node setup (`hello`), the agent runs directly on the sentinel node. In this 3-node setup:
- The sentinel acts purely as a router/coordinator
- The agent runs on its own separate node
- This mirrors distributed backend architectures where agents run on separate services

## Running the Example

```bash
# Install dependencies
make install

# Start development server
make run
```

Then open your browser to the URL shown (typically http://localhost:5173)

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

1. **Sentinel starts first** - Acts as the message router
2. **Agent connects to sentinel** - Registers the `hello@fame.fabric` service
3. **Client connects to sentinel** - Can now call the remote agent
4. **Message flow**: Client → Sentinel → Agent → Sentinel → Client

## Files

- `config-3node.ts` - Configuration for all three node types
- `ClientNode.tsx` - UI and logic for the client node
- `SentinelNode.tsx` - UI for the sentinel (pure routing)
- `AgentNode.tsx` - UI and agent hosting logic
- `App.tsx` - Orchestrates initialization order
- `HelloAgent.ts` - Simple echo agent implementation

Because each node is browser-resident, you can open a single page and watch the entire fabric handshake happen client-side—ideal for learning or demos without standing up infrastructure.
