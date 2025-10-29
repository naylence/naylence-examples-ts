# Distributed RPC Example — Client ▸ Sentinel ▸ Agent (TypeScript)

This example demonstrates **arbitrary RPC operations** in a **distributed topology** using TypeScript:

```
request: client ──▶ sentinel ──▶ math-agent
reply:   client ◀─ sentinel ◀─ math-agent
```

The goal is to show that methods exposed with the **`@operation`** decorator behave the **same** in distributed mode as they do locally — including **renaming** RPC endpoints and **streaming** results.

---

> ⚠️ **Security note:** This demo is intentionally insecure for clarity. There is **no auth, TLS, or overlay security** enabled here. Later examples will layer in secure admission, identities, and sealed channels.

---

> **For curious souls:** Naylence ships with FastAPI/Uvicorn under the hood but you'll never need to see or configure it. All transport, routing, and addressing are handled by the fabric itself. No boilerplate servers, no route wiring, just `make start` and go.

---

## What's inside

- **Sentinel** — coordination node listening on `:8000`.
- **MathAgent** — exposes three RPC ops via `@operation`:
  - `add(x, y)` — simple sum.
  - `multiply(x, y)` — method is `multi(...)` but published as **`multiply`** via `@operation({ name: "multiply" })`.
  - `fib_stream(n)` — **streaming** Fibonacci sequence using `@operation({ name: "fib_stream", streaming: true })`.

- **Client** — calls the operations and consumes the stream.

**Logical address:** `math@fame.fabric` (see `src/common.ts`).

---

## Files

- `src/math-agent.ts` — `BaseAgent` with `@operation` methods (rename + streaming examples).
- `src/client.ts` — attaches to the fabric and invokes `add`, `multiply`, and `fib_stream` (async stream).
- `src/sentinel.ts` — starts the sentinel in dev mode.
- `docker-compose.yml` — brings up **sentinel** and **math-agent** service.
- `src/common.ts` — holds `AGENT_ADDR` (`math@fame.fabric`).

---

## Quick start

> Requirements: Docker + Docker Compose installed, Node.js 20+ for local development.

From this example folder:

```bash
make start       # 🚀 brings up the stack (sentinel + math-agent)
```

Run the sample client against the math agent (add/multiply/fib_stream):

```bash
make run         # ▶️ executes client.ts
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

1. **Build the project**

```bash
npm install
npm run build
```

2. **Start services**

```bash
docker compose up -d
```

This starts:

- **sentinel** on `localhost:8000`
- **math-agent** connected downstream (uses `FAME_DIRECT_ADMISSION_URL` internally)

3. **Run the client (host)**

```bash
export FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream"
export FAME_PLUGINS="naylence-runtime,naylence-agent-sdk"
node dist/client.mjs
```

**Expected output (example)**

```
7
42
0 1 1 2 3 5 8 13 21 34
```

4. **Stop**

```bash
docker compose down --remove-orphans
```

---

## Standalone (no Compose)

Run each component in separate terminals after building:

**Terminal A — sentinel**

```bash
npm run build
FAME_PLUGINS="naylence-runtime,naylence-agent-sdk" node dist/sentinel.mjs
```

**Terminal B — agent**

```bash
export FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream"
export FAME_PLUGINS="naylence-runtime,naylence-agent-sdk"
node dist/math-agent.mjs
```

**Terminal C — client**

```bash
export FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream"
export FAME_PLUGINS="naylence-runtime,naylence-agent-sdk"
node dist/client.mjs
```

---

## The `@operation` decorator

```typescript
import { operation } from "@naylence/runtime";

class MathAgent extends BaseAgent {
  @operation() // published as "add"
  async add(x: number, y: number): Promise<number> {
    return x + y;
  }

  @operation({ name: "multiply" }) // rename RPC op
  async multi(x: number, y: number): Promise<number> {
    return x * y;
  }

  @operation({ name: "fib_stream", streaming: true }) // enable streaming
  async *fib(n: number): AsyncGenerator<number> {
    let a = 0;
    let b = 1;
    for (let i = 0; i < n; i++) {
      yield a;
      [a, b] = [b, a + b];
    }
  }
}
```

### Key points

- **Expose any method** as an RPC op with `@operation()`.
- **Rename** the external RPC name via `@operation({ name: '...' })` without changing your TypeScript method name.
- **Streaming results** with `streaming: true`; use async generators and consume with `_stream: true` client-side:

```typescript
// client.ts
const stream = await agent.fib_stream({ _stream: true, n: 10 });
for await (const value of stream) {
  console.log(value);
}
```

The same code works **unchanged** in single-process and distributed setups.

---

## TypeScript-specific notes

- **Decorators**: This example uses experimental TypeScript decorators. Make sure your `tsconfig.json` includes:

  ```json
  {
    "compilerOptions": {
      "experimentalDecorators": true,
      "emitDecoratorMetadata": true
    }
  }
  ```

- **ES Modules**: The build process converts `.js` to `.mjs` for proper ES module support in Node.js.

- **Async generators**: TypeScript natively supports async generator functions with `async *methodName()` syntax.

---

## Troubleshooting

- **Client can't connect** → ensure `FAME_DIRECT_ADMISSION_URL` points to the right sentinel (`localhost` on host; `sentinel` in Compose).
- **Agent fails to attach** → start **sentinel** first; check the env var in Compose.
- **Port already in use** → another process uses `8000`. Stop it or edit the Compose port mapping.
- **Plugin not found** → ensure `FAME_PLUGINS` environment variable is set to `naylence-runtime,naylence-agent-sdk`.
- **TypeScript compilation errors** → run `npm install` to ensure all dependencies are installed.

---

## Next steps

- Add auth & identities (SVID), envelope signing, and **overlay encryption**.
- Extend `MathAgent` with more RPCs (e.g., matrix ops), or add a second agent and compose calls.
- Demonstrate **backpressure** and cancellation on streaming RPCs.

---

This example proves that Naylence RPCs are **transport-agnostic**: define once with `@operation`, run anywhere — locally or across the fabric via a sentinel.
