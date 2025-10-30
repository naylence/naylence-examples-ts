# Capability Routing Example — Addressless Agent Discovery

This example shows how to call an agent **by capability** instead of by a fixed logical address. Rather than hard‑coding `math@fame.fabric`, the client asks the fabric for "any agent that provides the **math capability**," and the fabric returns a remote proxy to the matching agent.

---

## Why route by capability?

- **Decoupling** — clients don't need to know exact addresses, only the capability they need.
- **Replaceable implementations** — swap or upgrade agents without touching clients.
- **Scale‑out ready** — multiple agents can advertise the same capability; the fabric can choose a suitable provider.

---

## What this demonstrates

- Defining a **custom capability** tag (`fame.capability.math`).
- An agent that **advertises capabilities** (the built‑in `agent` plus `math`).
- A client that resolves a provider via `Agent.remoteByCapabilities([...])` and then calls `add`, `multiply`, and a **streaming** `fibStream`.

---

> ⚠️ **Security note:** This demo is intentionally insecure for clarity. There is **no auth, TLS, or overlay security** enabled here. Later examples will layer in secure admission, identities, and sealed channels.

---

> **For curious souls:** Naylence ships with a lightweight HTTP server under the hood but you'll never need to see or configure it. All transport, routing, and addressing are handled by the fabric itself. No boilerplate servers, no route wiring, just `make start` and go.

---

## Files

- **`docker-compose.yml`** — starts a sentinel and one math agent container.
- **`sentinel.ts`** — minimal dev‑mode sentinel entrypoint.
- **`math-agent.ts`** — a `BaseAgent` that exposes `add`, `multiply`, and streaming `fibStream`, and advertises capabilities.
- **`client.ts`** — attaches to the sentinel and **discovers the agent by capability**.
- **`common.ts`** — defines the capability constant `MATH_CAPABILITY = "fame.capability.math"`.
- **`Makefile`** — `start`, `run`, `run-verbose`, `stop`, `logs` targets.

---

## Key concepts

**1) Declare capabilities on the agent**

In `math-agent.ts` the agent returns a list of capabilities:

```typescript
import { BaseAgent } from "@naylence/agent-sdk";
import { AGENT_CAPABILITY } from "@naylence/core";
import { MATH_CAPABILITY } from "./common.js";

class MathAgent extends BaseAgent {
  override get capabilities(): string[] {
    return [AGENT_CAPABILITY, MATH_CAPABILITY];
  }

  @operation()
  async add(params: { x: number; y: number }): Promise<number> {
    return params.x + params.y;
  }

  // ... other operations
}
```

**2) Discover a provider by capability**

In `client.ts` the client asks the fabric for any agent that satisfies the **required set** of capabilities:

```typescript
import { Agent } from "@naylence/agent-sdk";
import { AGENT_CAPABILITY } from "@naylence/core";
import { MATH_CAPABILITY } from "./common.js";

const mathAgent = Agent.remoteByCapabilities([
  AGENT_CAPABILITY,
  MATH_CAPABILITY,
]);
```

Then it calls operations as usual (including streaming):

```typescript
const addResult = await mathAgent.add({ x: 5, y: 3 });
console.log(`add(5, 3) = ${addResult}`);

const multiplyResult = await mathAgent.multiply({ x: 4, y: 7 });
console.log(`multiply(4, 7) = ${multiplyResult}`);

const fibStream = await mathAgent.fibStream({ _stream: true, n: 10 });
for await (const num of fibStream) {
  console.log(num);
}
```

---

## How it works (flow)

1. **Sentinel** starts and listens on port **8000**.
2. **Math agent** attaches to the sentinel and advertises its capability list.
3. **Client** attaches to the sentinel and requests a provider by capability.
4. The fabric resolves a matching agent, returns a proxy, and routes calls/streams normally.

---

## Run it

> Requirements: Docker + Docker Compose + Node.js 18+ installed.

```bash
make start       # install deps, build, start sentinel and math agent
make run         # run client (capability discovery + add/multiply + fibStream)
make run-verbose # same as run, with envelope metadata
make stop        # tear down
```

> The client uses `FAME_DIRECT_ADMISSION_URL=ws://localhost:8000/fame/v1/attach/ws/downstream` to attach to the sentinel; the agent uses the in‑compose URL `ws://sentinel:8000/...`.

### Expected output

```
add(5, 3) = 8
multiply(4, 7) = 28
Fibonacci sequence: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34
```

---

## Additional commands

### View logs from all services

```bash
make logs             # tail all service logs
make logs-sentinel    # tail sentinel logs only
make logs-math        # tail math-agent logs only
```

### Rebuild from scratch

```bash
make rebuild    # clean and rebuild everything
```

---

## Code comparison: Python vs TypeScript

Key differences in the implementation:

| Python                           | TypeScript                            | Notes                                    |
| -------------------------------- | ------------------------------------- | ---------------------------------------- |
| `@property def capabilities`     | `override get capabilities()`         | Getter syntax                            |
| `remote_by_capabilities`         | `remoteByCapabilities`                | CamelCase for method names               |
| `fib_stream(n=10, _stream=True)` | `fibStream({ _stream: true, n: 10 })` | Parameter passing style                  |
| `async for v in stream:`         | `for await (const v of stream)`       | Async iteration syntax                   |
| `@operation`                     | `@operation()`                        | Decorator syntax (parens required in TS) |
| `def add(self, x, y):`           | `async add(params: { x, y })`         | Parameter structure                      |
| Snake case (`fib_stream`)        | Camel case (`fibStream`)              | Naming conventions                       |

---

## Troubleshooting

- **"No provider found"**
  - Ensure the agent is running and advertises the expected capability value: `fame.capability.math`.
  - Double‑check the client's list: it should include both `AGENT_CAPABILITY` and `MATH_CAPABILITY`.

- **Client connects but calls fail**
  - Verify `FAME_DIRECT_ADMISSION_URL` is set appropriately for host vs. container contexts.
  - Ensure you've built the TypeScript code with `make build` before starting services.

- **No stream output**
  - Make sure `fibStream` is invoked with `_stream: true` parameter.
  - Try `make run-verbose` to observe envelope flow.

- **Build errors**
  - Ensure Node.js 18+ is installed and run `npm install --legacy-peer-deps`.

- **Type errors with `mathAgent` calls**
  - The current implementation uses `(mathAgent as any)` for dynamic method calls. In production, you'd define a proper interface.

---

## Variations to try

- **Multiple providers** — start two math agents advertising the same capability to see selection behavior:
  ```yaml
  # In docker-compose.yml, add a second math-agent service
  math-agent-2:
    # ... same config as math-agent
  ```
- **Composite capabilities** — add another tag (e.g., `fame.capability.stats`) and require both in `remoteByCapabilities([...])`.
- **Address fallback** — keep a known address for emergencies, but use capability routing for the happy path.
- **Custom capability matching** — experiment with different capability combinations to see how the fabric selects providers.

---

## Next steps

- Add more operations to the `MathAgent` (e.g., `subtract`, `divide`, `power`).
- Create a second agent type with different capabilities and have the client discover both.
- Implement proper TypeScript interfaces for the agent proxy instead of using `any`.
- Compare with the `distributed/rpc` example to see address-based routing.
- Add capability-based load balancing by running multiple instances of the same agent.

---

_This example demonstrates the power of capability-based routing for building flexible, decoupled distributed systems._
