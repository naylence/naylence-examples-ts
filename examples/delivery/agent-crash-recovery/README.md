# Crash Recovery: Agent Reprocessing Messages (TypeScript)

This TypeScript example mirrors the Python demo at
`examples/delivery/agent-crash-recovery`. It showcases Naylence’s ability to
recover from **agent crashes** while preserving in-flight messages with
**at-least-once delivery** and a **durable store**.

If the agent crashes mid-processing, the fabric replays the message when the
agent comes back online. Because the agent’s state is persisted, the retry runs
with the updated counter and succeeds.

---

## What’s included

- **Sentinel** — coordination node that accepts downstream connections.
- **MessageAgent** — stateful agent with a persistent counter:
  - increments the counter on each message (stored in encrypted SQLite).
  - intentionally crashes on **odd counts**.
  - successfully processes the same message on **even counts** after restart.
- **Client** — sends a single `"Hello, World!"` payload.

Flow:

```
client ──▶ sentinel ──▶ message-agent
```

1. Client sends message.
2. Agent increments counter → odd → simulates a crash (`process.exit(1)`).
3. Docker Compose restarts agent container.
4. Agent resumes with persisted counter → retries the same message → succeeds.

---

## Requirements

- Node.js ≥ 18 for local builds and client runs.
- Docker + Docker Compose to run the sentinel and agent.

Run the initialization step once to install dependencies, generate a random
storage master key, and create the `.env` files:

```bash
make init
```

---

## Quick start

```bash
make init    # install deps + generate config (run once per checkout)
make start   # build + launch sentinel and message-agent
make run     # run the client once (crash → restart → success)
make stop    # tear everything down
```

During the crash/restart cycle, the Makefile prints the agent logs so you can
see both the simulated failure and the eventual success.

For full envelope tracing:

```bash
make run-verbose
```

---

## Alternative: Docker Compose

1. **Initialize configuration and build artifacts**

```bash
make init
npm run build
docker compose up -d --build
```

This brings up:

- `sentinel` listening on `localhost:8000`
- `message-agent` connected downstream with encrypted SQLite storage mounted at
  `./data`

2. **Run the client from the host**

```bash
FAME_PLUGINS=naylence-runtime,naylence-agent-sdk \
FAME_DELIVERY_PROFILE=at-least-once \
FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream" \
node dist/client.mjs
```

3. **Shut everything down**

```bash
docker compose down --remove-orphans
```

---

## Configuration

- `config/.env.agent` enables at-least-once delivery and durable storage via
  Naylence’s encrypted SQLite backend. The storage directory is mapped to
  `./data` for persistence across restarts.
- `config/.env.client` keeps the client on the same at-least-once profile so
  retries are enabled end-to-end.
- `config/.secrets/storage-master-key.txt` holds the 32-byte key created during
  `make init` (ignored by git and excluded from Docker builds).

> Re-run `make init` whenever you need to rotate the development key or
> regenerate the configuration files.

---

## Expected output

Client:

```
Sending message to MessageAgent...
Acknowledgment received: { type: 'DeliveryAck', ok: true, ... }
```

Agent logs:

```
MessageAgent current state: 0
MessageAgent simulating crash while processing message...
# container restarts
MessageAgent current state: 1
MessageAgent processed message successfully: Hello, World!
```

---

## Troubleshooting

- **Agent never restarts** → ensure Docker Compose is running and that
  `restart: on-failure` is still present in `docker-compose.yml`.
- **No recovery after crash** → verify the storage variables in
  `config/.env.agent` and confirm `./data/agent` has write permissions.
- **Client cannot connect** → wait for the sentinel healthcheck to pass, then
  retry the client command once `docker compose ps` shows the service as healthy.

---

## Key takeaway

At-least-once delivery plus durable storage ensures that a crashing agent does
not lose in-flight work. The framework automatically replays unhandled messages
once the agent resumes, keeping reliability guarantees intact.
