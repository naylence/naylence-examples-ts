# Delivery · Retry on No ACK Received (TypeScript)

This example mirrors the Python demo under `examples/delivery/retry-on-no-ack-received`.
It highlights Naylence’s **at-least-once** delivery semantics: if the sender does not
receive a delivery acknowledgment (`DeliveryAck`) within the retry window, the same
message is sent again. This guarantees eventual delivery, but duplicates are possible
— agents must include their own idempotency or deduplication logic.

---

## What’s included

- **Sentinel** — central coordinator that accepts direct WebSocket admission.
- **MessageAgent** — a `BaseAgent` that prints the payload and installs a
  `LostAckSimulator` event listener which intentionally drops most `DeliveryAck`
  frames before they reach the caller. The simulator exists only to demonstrate
  retries; production deployments should not discard acknowledgments.
- **Client** — sends a `"Hello, World!"` payload and waits for the acknowledgment.

Flow overview:

```
client ──▶ sentinel ──▶ message-agent
						▲
						└── (ACKs may be dropped, forcing retries)
```

---

## Quick start

> Requirements: Docker + Docker Compose, Node.js ≥ 18 for local commands.

```bash
npm install       # install dependencies (once per checkout)
npm run build     # compile to ./dist for Docker + local runs
make start        # build + launch sentinel & message-agent
make run          # run the client (retries on missing ACKs)
make stop         # tear everything down
```

For detailed envelope tracing run:

```bash
make run-verbose
```

Expected output:

```
Running client to send a message (with retries on no ACK received)...
Sending message to MessageAgent...
Acknowledgment received: { type: 'DeliveryAck', ok: true, ... }

Message-agent logs:
message-agent-1  | Simulating lost acknowledgment to envelope id dg7xsDbJGOzehjue
message-agent-1  | MessageAgent received message: Hello, World!
message-agent-1  | Simulating lost acknowledgment to envelope id dg7xsDbJGOzehjue
message-agent-1  | MessageAgent received message: Hello, World!
message-agent-1  | MessageAgent received message: Hello, World!
```

Duplicates are expected: every dropped ACK triggers a resend.

---

## Files

- `src/sentinel.ts` — boots a sentinel using the shared SDK configuration.
- `src/message-agent.ts` — `BaseAgent` implementation that registers the
  `LostAckSimulator` listener.
- `src/lost-ack-simulator.ts` — `NodeEventListener` that discards most
  delivery acknowledgments (demo only).
- `src/client.ts` — sends a single message and prints the returned `DeliveryAck`.
- `config/.env.agent` — agent admission + delivery profile (`at-least-once`).
- `config/.env.client` — client admission + delivery profile matching the agent.
- `docker-compose.yml` — runs sentinel and agent containers.
- `Makefile` — convenience targets for building and running the example.

---

## How it works

1. **Retry policy** — the client relies on the `FAME_DELIVERY_PROFILE=at-least-once`
   profile; when an ACK is missing the fabric resends the message automatically.
2. **ACK loss simulation** — `LostAckSimulator.onForwardUpstream` checks outbound
   envelopes, identifies `DeliveryAck` frames, and drops two out of every three.
3. **Agent behavior** — receives the message multiple times and logs each payload.
4. **Client behavior** — keeps retrying until a `DeliveryAck` arrives.

> ⚠️ The simulator intentionally breaks acknowledgment delivery to demonstrate retries.
> Remove the listener when building real systems.

---

## Alternative: Docker Compose

1. **Build artifacts and image**

```bash
npm install
npm run build
docker compose up -d --build
```

This starts:

- `sentinel` listening on `localhost:8000`
- `message-agent` connected downstream to the sentinel (with lost ACK simulation)

2. **Run the client from the host**

```bash
FAME_PLUGINS=naylence-runtime,naylence-agent-sdk \
FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream" \
node dist/client.mjs
```

3. **Shutdown**

```bash
docker compose down --remove-orphans
```

---

## Troubleshooting

- **Client hangs** → ensure the sentinel container is healthy (`docker ps`).
- **No retries** → verify both `.env` files set `FAME_DELIVERY_PROFILE=at-least-once`.
- **Too many duplicates** → expected here; add deduplication in your agent logic when
  using at-least-once semantics in production.

---

## Key takeaway

At-least-once delivery prevents silent message loss at the cost of possible duplicates.
Agents are responsible for handling repeated messages safely.
