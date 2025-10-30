# Distributed RPC Example — Client ▸ Sentinel ▸ Agent

This example demonstrates **arbitrary RPC operations** in a **distributed topology**:

```
request: client ──▶ sentinel ──▶ math-agent
reply:   client ◀─ sentinel ◀─ math-agent
```

The goal is to show that methods exposed with the **`@operation`** decorator behave the **same** in distributed mode as they do locally — including **renaming** RPC endpoints and **streaming** results.

---

> ⚠️ **Security note:** This demo is intentionally insecure for clarity. There is **no auth, TLS, or overlay security** enabled here. Later examples will layer in secure admission, identities, and sealed channels.

---

> **For curious souls:** Naylence ships with a lightweight HTTP server under the hood but you'll never need to see or configure it. All transport, routing, and addressing are handled by the fabric itself. No boilerplate servers, no route wiring, just `make start` and go.

---

## What's inside

- **Sentinel** — coordination node listening on `:8000`.
- **MathAgent** — exposes three RPC ops via `@operation`:
  - `add(x, y)` — simple sum.
  - `multiply(x, y)` — method is `multi(...)` but published as **`multiply`** via `@operation({ name: "multiply" })`.
  - `fib_stream(n)` — **streaming** Fibonacci sequence using `@operation({ name: "fib_stream", streaming: true })`.

- **Client** — calls the operations and consumes the stream.

**Logical address:** `math@fame.fabric` (see `common.ts`).

---

## Files

- **`src/math-agent.ts`** — `BaseAgent` with `@operation()` methods (rename + streaming examples).
- **`src/client.ts`** — attaches to the fabric and invokes `add`, `multiply`, and `fib_stream` (async stream).
- **`src/sentinel.ts`** — starts the sentinel in dev mode.
- **`docker-compose.yml`** — brings up **sentinel** and **math-agent** service.
- **`src/common.ts`** — holds `AGENT_ADDR` (`math@fame.fabric`).

---

## Quick start

> Requirements: Docker + Docker Compose + Node.js 18+ installed.

From this example folder:

```bash
make start       # 🚀 brings up the stack (sentinel + math-agent)
```

Run the sample client against the math agent (add/multiply/fib_stream):

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

1. **Start services**

```bash
docker compose up -d
```

This starts:

- **sentinel** on `localhost:8000`
- **math-agent** connected downstream (uses `FAME_DIRECT_ADMISSION_URL` internally)

2. **Run the client (host)**

```bash
export FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream"
export FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk
node dist/client.mjs
```

**Expected output (example)**

```
7
42
0 1 1 2 3 5 8 13 21 34
```

3. **Stop**

```bash
docker compose down --remove-orphans
```

---

## Standalone (no Compose)

Run each component in separate terminals using your local Node.js:

**Terminal A — sentinel**

```bash
npx tsx src/sentinel.ts
```

**Terminal B — agent**

```bash
export FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream"
npx tsx src/math-agent.ts
```

**Terminal C — client**

```bash
export FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream"
npx tsx src/client.ts
```

---

## The `@operation` decorator

```typescript
class MathAgent extends BaseAgent {
  @operation() // published as "add"
  async add(params: { x: number; y: number }): Promise<number> {
    const { x, y } = params;
    return x + y;
  }

  @operation({ name: "multiply" }) // rename RPC op
  async multi(params: { x: number; y: number }): Promise<number> {
    const { x, y } = params;
    return x * y;
  }

  @operation({ name: "fib_stream", streaming: true }) // enable streaming
  async *fib(params: { n: number }): AsyncGenerator<number> {
    const { n } = params;
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
- **Rename** the external RPC name via `@operation({ name: "..." })` without changing your TypeScript method name.
- **Streaming results** with `streaming: true`; use `async *` generator and consume with `_stream: true` client-side:

```typescript
// client.ts
const fibStream = await agent.fib_stream({ _stream: true, n: 10 });
for await (const value of fibStream) {
  console.log(value);
}
```

The same code works **unchanged** in single-process and distributed setups.

---

## Code comparison: Python vs TypeScript

Key differences in the implementation:

| Python                                 | TypeScript                                  | Notes                   |
| -------------------------------------- | ------------------------------------------- | ----------------------- |
| `math_agent.py`                        | `math-agent.ts`                             | File naming conventions |
| `@operation`                           | `@operation()`                              | Decorator syntax        |
| `@operation(name="multiply")`          | `@operation({ name: "multiply" })`          | Decorator parameters    |
| `@operation(streaming=True)`           | `@operation({ streaming: true })`           | Boolean syntax          |
| `async def add(self, x, y):`           | `async add(params: { x, y })`               | Method signature        |
| `async def fib(...): yield a`          | `async *fib(...): AsyncGenerator<number>`   | Generator syntax        |
| `async for v in stream:`               | `for await (const v of stream)`             | Async iteration         |
| `Agent.remote_by_address(...)`         | `Agent.remoteByAddress(...)`                | Method naming           |
| `await agent.fib_stream(_stream=True)` | `await agent.fib_stream({ _stream: true })` | Parameter passing       |

---

## Troubleshooting

- **Client can't connect**
  - Ensure `FAME_DIRECT_ADMISSION_URL` points to the right sentinel (`localhost` on host; `sentinel` in Compose).
  - Verify sentinel is running: `docker compose ps`

- **Agent fails to attach**
  - Start **sentinel** first; check the env var in `docker-compose.yml`.
  - Check agent logs: `docker compose logs math-agent`

- **Port already in use**
  - Another process uses `8000`. Stop it or edit the Compose port mapping.
  - Check with: `lsof -i :8000`

- **Streaming doesn't work**
  - Ensure `_stream: true` is passed in the client call.
  - Verify the operation decorator has `streaming: true`.

- **Build errors**
  - Ensure Node.js 18+ is installed: `node --version`
  - Clean and rebuild: `make clean && make build`

---

## Variations to try

- **Add more operations:** extend `MathAgent` with matrix ops, complex calculations, or async I/O operations
- **Multiple agents:** add a second agent and compose calls between them
- **Backpressure:** demonstrate flow control on streaming RPCs
- **Cancellation:** cancel long-running streaming operations mid-flight
- **Error handling:** implement retry logic and error propagation
- **Security profiles:** switch to **overlay** or **strict‑overlay** to see signed envelopes
- **Performance testing:** benchmark RPC latency and throughput
- **Bidirectional streaming:** combine streaming requests and responses

---

## Next steps

- Add auth & identities (SVID), envelope signing, and **overlay encryption**
- Explore `distributed/cancellable` to see cancellation patterns
- Compare with `distributed/push-notifications` for callback-based patterns
- Implement complex multi-agent workflows with RPC orchestration
- Add monitoring and observability to track RPC performance
- Extend with validation and schema enforcement for RPC parameters

---

This example proves that Naylence RPCs are **transport-agnostic**: define once with `@operation()`, run anywhere — locally or across the fabric via a sentinel. The decorator-based approach provides a clean, type-safe API that works identically in both single-process and distributed deployments.
