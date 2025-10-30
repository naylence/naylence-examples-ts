# Hello: Sentinel + Agent + Client

A slightly more complete **distributed example** for Naylence that runs a **sentinel**, an **echo agent**, and a **client**. It shows a typical topology where an agent registers through a sentinel and a client attaches to the fabric to invoke the agent by **logical address**.

> ⚠️ **Security note:** This demo is intentionally insecure for clarity. There is **no auth, TLS, or overlay security** enabled here. Later examples will layer in secure admission, identities, and sealed channels.

---

> **For curious souls:** Naylence ships with a lightweight HTTP server under the hood but you'll never need to see or configure it. All transport, routing, and addressing are handled by the fabric itself. No boilerplate servers, no route wiring, just `make start` and go.

---

## What's inside

- **Sentinel** — coordination node that accepts downstream connections on `:8000`.
- **EchoAgent** — trivial agent that echoes whatever payload it receives.
- **Client** — short‑lived process that sends a message and prints the response.

```
request: client ──▶ sentinel ──▶ echo-agent
reply:   client ◀─ sentinel ◀─ echo-agent
```

**Logical address:** `echo@fame.fabric` (defined in `common.ts`).

_All client requests and agent replies are routed through the sentinel — there is no direct client↔agent channel in this topology._

---

## Files

- `sentinel.ts` — starts a sentinel (dev config).
- `echo-agent.ts` — `BaseAgent` with async `runTask` that returns the payload.
- `client.ts` — attaches to the fabric and calls `runTask("Hello, World!")`.
- `common.ts` — defines the agent's logical address.
- `docker-compose.yml` — services for sentinel and agent, plus healthcheck.

---

## Quick start

> Requirements: Docker + Docker Compose + Node.js 18+ installed.

From this example folder:

```bash
make start       # 🚀 installs deps, builds, and brings up the stack (sentinel + echo-agent)
```

Run the sample client against the echo agent:

```bash
make run         # ▶️ executes client
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

## Alternative: Quick start (Docker Compose)

1. **Build and start services**

```bash
make build           # compile TypeScript
docker compose up -d
```

This brings up:

- **sentinel** on `localhost:8000` (with a lightweight healthcheck)
- **echo-agent** connected to the sentinel (uses `FAME_DIRECT_ADMISSION_URL`)

2. **Run the client (host)**

```bash
FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream" \
FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk \
node dist/client.mjs
```

Or use the make target:

```bash
make run
```

**Expected output**

```
Hello, World!
```

3. **Stop**

```bash
docker compose down --remove-orphans
```

---

## Alternative: run the client in Docker

```bash
make run-docker         # run client in Docker container
make run-docker-verbose # run with envelope logging
```

Or manually:

```bash
docker run --rm \
  -v "$(pwd):/work:ro" \
  -w /work \
  --network "hello-with-sentinel_naylence-net" \
  -e FAME_DIRECT_ADMISSION_URL="ws://sentinel:8000/fame/v1/attach/ws/downstream" \
  -e FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk \
  -e NODE_ENV=production \
  node:24-bullseye-slim \
  sh -c "npm install && npm run build && node dist/client.mjs"
```

---

## Standalone TypeScript (no Compose)

If you prefer to run all processes locally with your own Node.js environment (requires dependencies installed via `npm install`):

1. **Start sentinel**

```bash
npx tsx src/sentinel.ts
```

2. **Start the agent** (new terminal)

```bash
FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream" \
FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk \
npx tsx src/echo-agent.ts
```

3. **Run the client** (another terminal)

```bash
FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream" \
FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk \
npx tsx src/client.ts
```

---

## How it works

- **Agent:** Implements `BaseAgent.runTask(payload)` as an async method; returning the payload makes it an echo.
- **Registration:** The agent connects **downstream** to the sentinel via `FAME_DIRECT_ADMISSION_URL`.
- **Client:** Creates a remote handle with `Agent.remoteByAddress(AGENT_ADDR)` and awaits `runTask(...)`.
- **Addressing:** Components refer to the agent via its **logical address** `echo@fame.fabric`.

---

## Code comparison: Python vs TypeScript

Key differences in the implementation:

| Python                             | TypeScript                                          | Notes                       |
| ---------------------------------- | --------------------------------------------------- | --------------------------- |
| `run_task`                         | `runTask`                                           | CamelCase for method names  |
| `Agent.remote(address=AGENT_ADDR)` | `Agent.remoteByAddress(AGENT_ADDR)`                 | Method naming               |
| `async with FameFabric.create():`  | `await withFabric({ ... }, async () => {})`         | Resource management pattern |
| `Sentinel.serve(...)`              | `await Sentinel.aserve({ ... })`                    | Sentinel initialization     |
| `def run_task(self, payload, id):` | `async runTask(payload: unknown): Promise<unknown>` | Method signature            |
| Python env vars in shell           | Same env vars work in Node.js                       | Environment configuration   |

---

## Troubleshooting

- **Client hangs / fails to connect** → ensure `FAME_DIRECT_ADMISSION_URL` points to the sentinel you're using (`localhost` from host, `sentinel` inside Compose network).
- **Agent fails to start** → start the sentinel first; the agent depends on it.
- **Port in use** → something is already bound to `8000`. Stop it or change the mapping in `docker-compose.yml`.
- **Build errors** → ensure Node.js 18+ is installed and run `npm install --legacy-peer-deps`.
- **Module not found** → make sure you've run `make build` before starting Docker services.
- **Network not found** → ensure you're running `make run-docker` from the correct directory, or adjust the network name to match your directory.

---

## Next steps

- Swap the echo behavior with custom logic in `runTask` (long‑running tasks are fine — it's fully async).
- Introduce **security**: SVID‑backed identities, envelope signing, overlay encryption, and policy‑based admission.
- Add more agents and route by capability or by logical addresses.
- Compare with the simpler `hello` example to see the difference with explicit sentinel setup.
- Move to `distributed/rpc` to see how to define multiple operations with `@operation`.

---

This example is a bridge between the minimal echo demo and the security‑enabled scenarios that follow. It's designed for easy iteration: long‑running **sentinel/agent** in Compose, short‑lived **client** on demand.
