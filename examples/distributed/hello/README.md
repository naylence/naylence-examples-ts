# Hello Example

This example demonstrates the **simplest distributed setup** using the Naylence Agent SDK. It consists of two components:

- **EchoAgent** — a minimal agent that simply echoes back any payload it receives.
- **Client** — a short‑lived program that sends a message to the agent and prints the response.

In this demo, the agent is hosted directly on a **sentinel node**, and the client connects directly to it. In real production setups, agents usually run behind sentinels, and clients don't talk to agents directly — but for simplicity, we bend the rules here.

> ⚠️ **Security note:** This example does **not** feature any security mechanisms. It is kept intentionally minimal for learning purposes. Later examples in this repository will introduce secure configurations.

---

> **For curious souls:** Naylence ships with a lightweight HTTP server under the hood but you'll never need to see or configure it. All transport, routing, and addressing are handled by the fabric itself. No boilerplate servers, no route wiring, just `make start` and go.

---

## Components

### EchoAgent

- Implemented in [`echo-agent.ts`](src/echo-agent.ts).
- Extends `BaseAgent` from the Naylence Agent SDK — the simplest way to build a new agent.
- Overrides `runTask` (fully async), which can support long‑running tasks.
- Assigned a **logical address** (`echo@fame.fabric`) defined in [`common.ts`](src/common.ts), so other components can reference it.

### Client

- Implemented in [`client.ts`](src/client.ts).
- Creates a remote handle to the agent by its logical address.
- Sends the string `"Hello, World!"` as a task.
- Prints the agent's echoed response.

Expected output:

```
Hello, World!
```

### Browser Client

- Implemented in [`browser/src/browser-client.ts`](browser/src/browser-client.ts).
- A browser-based client that connects to the echo agent via WebSocket.
- Uses the same fabric connection mechanism as the Node.js client.
- Provides a simple UI to send messages and view responses.
- See [`browser/README.md`](browser/README.md) for more details.

---

## Quick start

> Requirements: Docker + Docker Compose + Node.js 18+ installed.

From this example folder:

```bash
make start       # 🚀 installs deps, builds, and brings up the stack (sentinel + echo-agent)
```

Run the sample client against the echo agent:

```bash
make run         # ▶️ executes Node.js client
```

Or run the browser client:

```bash
make run-browser # 🌐 starts browser client on http://localhost:3000
```

Shut down when done:

```bash
make stop        # ⏹ stop containers
```

### See envelope traffic

Use the verbose target to print every **envelope** as it travels through the fabric:

```bash
make run-verbose
```

---

## Alternative: Running the Example

There are several other ways to run the components:

### 1. Standalone TypeScript (with tsx)

Make sure your Node.js environment is set up and dependencies are installed (`npm install`).

Start the agent (long‑running service):

```bash
npx tsx src/echo-agent.ts
```

In another terminal, run the client:

```bash
FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream" \
FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk \
npx tsx src/client.ts
```

---

### 2. Docker Compose (manual)

Build the TypeScript code first:

```bash
make build
```

Start the echo agent via Compose:

```bash
docker compose up -d
```

This starts:

- A sentinel on `localhost:8000`
- The `echo-agent` connected to that sentinel

Run the client locally:

```bash
FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream" \
FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk \
node dist/client.mjs
```

Or use the make target:

```bash
make run
```

Stop services when done:

```bash
docker compose down --remove-orphans
```

---

### 3. Run client in Docker

Optionally, run the client inside Docker (requires services to be running):

```bash
make run-docker         # run client in Docker container
make run-docker-verbose # run with envelope logging
```

Or manually:

```bash
docker run --rm \
  -v "$(pwd)/dist:/app" \
  -v /app/node_modules \
  --network "hello_naylence-net" \
  -e FAME_DIRECT_ADMISSION_URL="ws://echo-agent:8000/fame/v1/attach/ws/downstream" \
  -e FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk \
  naylence/agent-sdk-node:0.3.3 \
  node client.mjs
```

---

## Code comparison: Python vs TypeScript

Key differences in the implementation:

| Python                           | TypeScript                                  | Notes                       |
| -------------------------------- | ------------------------------------------- | --------------------------- |
| `run_task`                       | `runTask`                                   | CamelCase for method names  |
| `async with FameFabric.create()` | `await withFabric({ ... }, async () => {})` | Resource management pattern |
| `Agent.remote_by_address`        | `Agent.remoteByAddress`                     | Method naming               |
| `await remote.run_task(payload)` | `await remote.runTask(payload)`             | Consistent camelCase        |
| `def run_task(self, payload):`   | `async runTask(payload: any)`               | Method signature            |
| Python string interpolation      | Template literals                           | String formatting           |

---

## Notes

- Agents are typically **long‑running services** (run via Compose).
- Clients are typically **short‑lived** and run on demand (for faster iteration).
- In Compose networking, use `echo-agent:8000`; from your host, use `localhost:8000`.
- The TypeScript version requires a build step (`npm run build`) before running in Docker.

---

## Troubleshooting

- **Client can't connect** → Ensure `FAME_DIRECT_ADMISSION_URL` points to the correct endpoint (`localhost:8000` from host; `echo-agent:8000` in Compose network).
- **Build errors** → Ensure Node.js 18+ is installed and run `npm install --legacy-peer-deps`.
- **Module not found** → Make sure you've run `make build` before starting Docker services.
- **Port 8000 in use** → Another process is using the port; change the Compose mapping or free the port.
- **Network not found** → Ensure you're running `make run-docker` from the correct directory, or adjust the network name.

---

## Next steps

- Modify the `EchoAgent` to transform the payload (e.g., uppercase it, reverse it, add a prefix).
- Try sending different data types (objects, arrays) to see how the agent echoes them.
- Compare with `hello-with-sentinel` to see a more explicit sentinel setup.
- Move to `distributed/rpc` to see how to define multiple operations with `@operation`.
- Add logging to see when the agent receives and processes tasks.

---

This example is intentionally minimal — a first step toward building more complex and **secure** multi‑agent distributed systems with Naylence.
