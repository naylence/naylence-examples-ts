# Retry Example: At-Least-Once Delivery

This example demonstrates Naylence's **at-least-once delivery policy** in action.
When a caller does not receive an acknowledgment (`ACK`) within a specified timeframe (defined by the sender retry policy), the message is **re-sent**.

As a result, the same message may be delivered multiple times. With this delivery policy, **idempotency or deduplication is the responsibility of the agent**.

---

## What's inside

- **Sentinel** — central coordinator that manages routing.
- **MessageAgent** — receives messages and simulates dropped acknowledgments:
  - Internally, it hooks into low-level envelope events and randomly discards some ACKs using `LostAckSimulator` class:

    ```typescript
    export class LostAckSimulator implements NodeEventListener {
      readonly priority = 1000;
      private deliveryAckCounter = 0;

      async onForwardUpstream(
        _node: NodeLike,
        envelope: FameEnvelope,
        _context?: FameDeliveryContext,
      ): Promise<FameEnvelope | null> {
        const frame = envelope.frame as DeliveryAckFrame | undefined;
        if (!frame || frame.type !== "DeliveryAck") {
          return envelope;
        }

        this.deliveryAckCounter += 1;
        if (this.deliveryAckCounter % 3 !== 0) {
          const refId = /* ... extract ref_id ... */;
          console.log("Simulating lost acknowledgment to envelope id", refId);
          return null;
        }

        return envelope;
      }
    }
    ```

  - ⚠️ This code is **only to simulate lost acknowledgments** for demonstration purposes. It is **not required** for retries in real systems.

  - From the agent's perspective, this results in receiving the same message multiple times.

- **Client** — sends a simple `"Hello, World!"` message and waits for an acknowledgment.

Flow:

```
client ──▶ sentinel ──▶ message-agent
                ▲
                └── (ACKs may be dropped, forcing retries)
```

---

## Files

- `sentinel.ts` — runs the sentinel.
- `message-agent.ts` — agent that receives messages (and simulates ACK loss).
- `client.ts` — sends a message.
- `lost-ack-simulator.ts` — simulates dropped acknowledgments for demonstration.
- `common.ts` — shared constants (agent address).
- `docker-compose.yml` — orchestrates services.
- `config/.env.agent.example` — template for agent delivery mode configuration.
- `config/.env.client.example` — template for client retry behavior configuration.
- `Makefile` — convenience targets (`init`, `start`, `run`, `stop`, etc.).

---

## Quick start

> Requirements: Docker + Docker Compose + Node.js 18+ installed.

1. **Initialize and build**

```bash
make init    # installs dependencies and generates config files
make build   # compiles TypeScript to JavaScript
```

Or run both steps with:

```bash
make start   # runs build and starts services
```

2. **Send a message (with retries)**

```bash
make run
```

👉 For more detailed visibility, you can also run:

```bash
make run-verbose
```

This will show the **actual envelopes** being sent by the client, making it easier to observe retries in action.

What happens:

- Client sends `"Hello, World!"`.
- MessageAgent receives it and prints it.
- Some ACKs are intentionally dropped → client retries.
- MessageAgent may log the same message multiple times.
- Eventually the client receives an acknowledgment.

3. **Stop everything**

```bash
make stop
```

---

## Expected output

Client:

```
Running client to send a message (with retries on no ACK received)...
Sending message to MessageAgent...
Acknowledgment received: type='DeliveryAck' ok=true code=null reason=null ref_id='dg7xsDbJGOzehjue'
```

Logs (`make run` shows them automatically):

```
message-agent-1  | Simulating lost acknowledgment to envelope id dg7xsDbJGOzehjue
message-agent-1  | MessageAgent received message: Hello, World!
message-agent-1  | Simulating lost acknowledgment to envelope id dg7xsDbJGOzehjue
message-agent-1  | MessageAgent received message: Hello, World!
message-agent-1  | MessageAgent received message: Hello, World!
```

---

## How it works

- **Retry policy** — if the client does not get an ACK in time, it resends the same message.
- **At-least-once delivery** — ensures eventual delivery, but may introduce duplicates.
- **Delivery profile configuration** — the delivery profile must be set to `FAME_DELIVERY_PROFILE=at-least-once` **on both the client and the agent side** for retries to work as intended.
- **Agent responsibility** — the framework does not deduplicate; your agent must handle duplicates if necessary.
- **Simulated ACK loss** — implemented only for demonstration. In real deployments, retries occur naturally due to network issues or node failures.

---

## Additional commands

### View live logs

```bash
make logs    # tail message-agent logs (Ctrl+C to stop)
```

### Run with verbose envelope logging

```bash
make run-verbose    # shows detailed envelope traffic
```

### Clean everything

```bash
make clean    # stops services, removes build artifacts and config files
```

---

## Configuration details

The example uses two environment files:

**`config/.env.agent`** (copied from `.env.agent.example`):

```bash
FAME_DIRECT_ADMISSION_URL=ws://sentinel:8000/fame/v1/attach/ws/downstream
FAME_DELIVERY_PROFILE=at-least-once
FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk
```

**`config/.env.client`** (copied from `.env.client.example`):

```bash
FAME_DIRECT_ADMISSION_URL=ws://localhost:8000/fame/v1/attach/ws/downstream
FAME_DELIVERY_PROFILE=at-least-once
FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk
```

These files are automatically copied by `make init` from the example templates.

---

## Troubleshooting

- **Client hangs** → ensure sentinel is healthy (`docker ps` should show `sentinel` up).
- **No retries observed** → check that `FAME_DELIVERY_PROFILE=at-least-once` is set in both agent and client `.env` files.
- **Too many duplicates** → expected in this example, since ACKs are being intentionally dropped. In a real system, add deduplication logic in the agent.
- **Missing config files** → run `make init` to copy `.env.agent.example` and `.env.client.example` to their active versions.
- **Build errors** → ensure Node.js 18+ is installed and dependencies are installed (`npm install`).

---

## Code comparison: Python vs TypeScript

Key differences in the implementation:

| Python                                         | TypeScript                     | Notes                       |
| ---------------------------------------------- | ------------------------------ | --------------------------- |
| `NodeEventListener`                            | `implements NodeEventListener` | Interface implementation    |
| `on_forward_upstream`                          | `onForwardUpstream`            | CamelCase for method names  |
| `on_message`                                   | `onMessage`                    |                             |
| `isinstance(envelope.frame, DeliveryAckFrame)` | `frame.type !== "DeliveryAck"` | Type checking approach      |
| Snake case (`ref_id`)                          | Camel case (`refId`)           | Property naming conventions |
| Python type hints                              | TypeScript types               | Static typing approach      |

---

## Key takeaway

With **at-least-once delivery**, messages are never silently lost, but they **may be delivered multiple times**. It's up to the agent to ensure correct behavior in the presence of duplicates.

---

## Next steps

- Modify the `LostAckSimulator` to drop different percentages of ACKs (e.g., every 5th instead of every 3rd).
- Implement deduplication logic in the agent to handle duplicate messages gracefully.
- Compare with the `agent-crash-recovery` example to see how persistence and crash recovery work together with retries.
- Experiment with different retry policies by adjusting timeout and retry count parameters.
- Integrate this pattern into your own agents that need guaranteed message delivery.
