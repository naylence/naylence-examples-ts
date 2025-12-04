[![Join our Discord](https://img.shields.io/badge/Discord-Join%20Chat-blue?logo=discord)](https://discord.gg/nwZAeqdv7y)

# Naylence Examples (TypeScript)

This repository is a tour of Naylence's Agent SDK and runtime patterns, from "hello world" agents to multi-agent orchestration and production-grade security. Use it as a workbook: run each example, skim its code, and move to the next. Many examples ship both CLI clients and browser UIs—several distributed samples include a browser client alongside the CLI, and there are dedicated browser-only ports in `examples/react` and `examples/vue`.

---

## Directory map

```
examples/
  simple/                      # single-process, zero-config building blocks
  distributed/                 # hello → RPC → cancellable → orchestration → topologies
    hello/
    hello-with-sentinel/
    rpc/
    cancellable/
    multi-agent/
    biomes/
    peers/
    stateful-conversation/
    push-notifications/
    status-subscription/
    capability-routing/
  llm/                         # single-process LLM agents
    chat-agent.ts
    llm-agent.ts
  monitoring/
    open-telemetry/
  persistence/
    agent-state/
    storage-provider/
  react/                      # React UI demos (hello, hello-3node, rpc)
  delivery/
    agent-crash-recovery/
    retry-on-no-ack-received/
  security/                    # admission, overlay, advanced identities & routing
    gated/
    overlay/
    advanced/
    http-connector/
    stickiness/
  vue/                        # Vue UI demos (hello, hello-3node, rpc)
```

**Conventions**

* Each folder has a short `README.md`, a `Makefile` with `start/run/stop`, and minimal code.
* Docker Compose brings up the long-running services (sentinel/agents). Clients usually run from your host with `make run`.
* Env vars like `FAME_DIRECT_ADMISSION_URL` and provider keys (`OPENAI_API_KEY`, etc.) are used where relevant.

---

## Recommended learning path

1. **Start tiny — `examples/simple/`**
   Learn the core Agent APIs without networking or a sentinel:

   * wrap a function as an agent (`function-as-agent.ts`)
   * one-shot `runTask` vs background tasks (`agent-with-bg-task.ts`)
   * basic RPC patterns (`rpc-agent.ts`)
   * echo / ping-pong for round-trip mental model

2. **Single-process with models — `examples/llm/`**
   Use the same Agent APIs to call external LLMs:

   * Q&A function-agent (`llm-agent.ts`)
   * Chat agent with per-session memory (`chat-agent.ts`)

   *Goal:* see that "agent" is a programming model first; distribution is optional.

3. **Introduce the fabric — `distributed/hello/` → `hello-with-sentinel/`**
   Bring up a **sentinel** and a separate **agent** container; call the agent from a host client. Learn the admission URL and logical addresses (`echo@fame.fabric`).

4. **RPC on the fabric — `distributed/rpc/`**
   Expose operations with `@operation`, including **streaming** (e.g., Fibonacci stream). Call methods over the fabric like local methods.

5. **Long-running work — `distributed/cancellable/` + `status-subscription/`**
   Use **A2A task APIs**: start a background task, subscribe to **status/artifact** updates, cancel mid-flight.

6. **Push vs stream — `distributed/push-notifications/`**
   Contrast streaming with **callback-style** notifications via an **on-message** handler.

7. **Decoupling addresses — `distributed/capability-routing/`**
   Resolve providers by **capability** instead of hard-coded logical addresses.

8. **Multi-agent orchestration — `distributed/multi-agent/`**
   Launch multiple agents and orchestrate them with **scatter–gather** (`Agent.broadcast`). Example: summarizer + sentiment + aggregator.

9. **Topologies — `distributed/biomes/` and `distributed/peers/`**
   *Biomes:* hierarchical parent/child sentinels (deep-to-deep delegation across child biomes).
   *Peers:* two sentinels connected via a peer link; route calls across the peer.

10. **Persistence — `persistence/`**
    Learn how to enable persistence in the fabric and use the persistence API within agents. This section covers:

    * Configuring node-level persistence (e.g. encrypted storage).
    * Saving and retrieving agent state and artifacts using the persistence API.
    * Ensuring data durability and recovery across restarts or failures.

    > Tip: Persistence is optional but recommended for agents that manage long-lived state or need to recover after interruptions.

11. **Delivery semantics — `delivery/agent-crash-recovery/`**
    Demonstrates **at-least-once delivery** with crash recovery. The agent:

    * Persists a counter in its state.
    * Crashes intentionally on odd counts.
    * Is restarted by Docker Compose.
    * Reprocesses the unhandled message on restart, proving durable recovery.

    > Tip: Requires both `FAME_DELIVERY_PROFILE=at-least-once` and a durable store (`FAME_STORAGE_PROFILE=encrypted-sqlite`).

12. **Monitoring — `monitoring/open-telemetry/`**
    See how message envelopes flow across the fabric using OpenTelemetry and Jaeger for distributed tracing. This example shows how to:

    * Instrument agents and sentinels with OpenTelemetry.
    * Visualize RPC request and response traces in Jaeger.
    * Track the lifecycle of an envelope as it moves between nodes.
    * Diagnose bottlenecks and latency in multi-agent workflows.

    > Tip: After running `make start`, open the Jaeger UI (usually at [http://localhost:16686](http://localhost:16686)) to explore traces in real time.

13. **Security tiers — `security/`**
    Progressively add real-world security:

    * **gated/**: OAuth2/JWT-gated admission to the sentinel
    * **overlay/**: signed envelopes (provenance, tamper-evidence)
    * **advanced/**: strict overlay + admission + SPIFFE/X.509 (SVID) identities and sealed channels (BSL add-on)
    * **http-connector/**: HTTP connector example for bridging agents/services
    * **stickiness/**: session-affinity (sticky routing) across replicas

> Tip: Stop at any stage that fits your needs. If you just need distributed RPC today, you can live in `distributed/rpc` and return for security/topologies later.

---

## Quick prerequisites

* **Node.js 18+** for running scripts locally
* **Docker + Docker Compose** for anything in `distributed/` or `security/`
* **OpenAI API key** for LLM-backed examples: `export OPENAI_API_KEY=…`

---

## How to run (common pattern)

Most distributed examples:

```bash
make start       # brings up sentinel + agent(s)
make run         # runs the client from your host
make run-verbose # prints envelope traffic for learning/debugging
make stop        # tears down containers
```

For simple examples (no Docker required), you can use npm scripts:

```bash
npm run example:simple:function    # function-as-agent.ts
npm run example:simple:echo        # echo-agent.ts
npm run example:simple:bg-task     # agent-with-bg-task.ts
npm run example:simple:rpc         # rpc-agent.ts
npm run example:simple:a2a         # a2a-agent.ts
npm run example:simple:ping-pong   # agent-ping-pong.ts
npm run example:simple:hello       # hello.ts

npm run example:llm:qa             # llm-agent.ts (requires OPENAI_API_KEY)
npm run example:llm:chat           # chat-agent.ts (requires OPENAI_API_KEY)
```

If you prefer not to use `make`, see each folder's `docker-compose.yml` and `README.md` for equivalent commands.

---

## Example catalog (high-level)

### `simple/`

* **function-as-agent.ts** — wrap a plain async function as an agent
* **echo-agent.ts** — minimal one-shot `runTask`
* **agent-with-bg-task.ts** — start/subscribe/cancel lifecycle
* **rpc-agent.ts** — define method-style RPC with `@operation`
* **agent-ping-pong.ts**, **a2a-agent.ts** — tiny messaging exercises
* **hello.ts** — minimal hello world example

### `llm/`

* **llm-agent.ts** — function-agent does Q&A with GPT
* **chat-agent.ts** — chat with per-session memory (REPL)

### `distributed/`

* **hello/** — echo across a real fabric (sentinel + agent)
* **hello-with-sentinel/** — same idea with explicit sentinel config
* **rpc/** — math agent with add/multiply + streaming Fibonacci
* **cancellable/** — background task with progress artifacts; client cancels at threshold
* **status-subscription/** — subscribe to status/artifact updates for long-running tasks
* **push-notifications/** — register a callback endpoint and receive push messages
* **capability-routing/** — route requests by declared agent capabilities
* **multi-agent/** — summarizer + sentiment + aggregator; `Agent.broadcast` scatter–gather
* **biomes/** — hierarchical (parent/child) sentinels; deep-to-deep delegation across child biomes
* **peers/** — peer-linked sentinels; calls hop across the peer link
* **stateful-conversation/** — conversation agent with persistent context/state

### `react/` and `vue/`

* **hello/** — client + sentinel + hello agent (UI)
* **hello-3node/** — client → sentinel → agent chain (UI)
* **rpc/** — math RPC with streaming Fibonacci (UI)

### `persistence/`

* **agent-state/** — demonstrates agent state persistence and recovery
* **storage-provider/** — configuring and using storage providers

### `delivery/`

* **agent-crash-recovery/** — demonstrates at-least-once delivery with crash/restart recovery
* **retry-on-no-ack-received/** — retry behavior when acknowledgment is not received

### `security/` (progressive)

* **gated/** — OAuth2 token-gated admission; TLS via Caddy as reverse proxy
* **overlay/** — overlay signing (integrity, provenance) on messages
* **advanced/** — strict overlay + admission + CA-issued SVIDs (SPIFFE/X.509); sealed channels
* **http-connector/** — bridge HTTP endpoints and agents via the connector example
* **stickiness/** — stickiness manager for session-affinity routing across replicas

---

## What to learn in each stage

* **Agent model**: `BaseAgent`, `Agent.fromHandler`, `runTask` vs `startTask`, artifacts and streams
* **Fabric mental model**: logical addresses, the sentinel as attach point, admission URL
* **RPC ergonomics**: `@operation` methods, request/response vs streaming
* **A2A tasks**: progress artifacts, status updates, cancellation & subscription
* **Push callbacks**: `onMessage` handlers and `sendMessage` for notifications
* **Orchestration**: parallel fan-out and result merging
* **Topologies**: hierarchical biomes vs peer links
* **Delivery**: at-least-once semantics, crash recovery, durable reprocessing
* **Security**: OAuth2 (gated), overlay signing (integrity/provenance), sealed channels + SVIDs (advanced), HTTP connector, stickiness

---

## Troubleshooting quickies

* **Client can't connect** → ensure `FAME_DIRECT_ADMISSION_URL` points to the sentinel (`ws://localhost:8000/...` from host; `ws://sentinel:8000/...` inside Compose).
* **No LLM output** → set `OPENAI_API_KEY`; verify model availability or override via `MODEL_NAME` when supported.
* **Agents don't attach** → start the sentinel first; check env files in `security/*/config/`.
* **Peer/biome routes** → verify peer attach URL (`FAME_PEER_WS_URL`) or child upstream URL(s) for hierarchical setups.
* **Port 8000/443 in use** → change the Compose port mapping or free the port.
* **TypeScript compilation errors** → ensure Node.js 18+ and run `npm install` to install all dependencies.

---

## Where to go next

* Extend the math RPC with your own operations (including streaming)
* Add micro-agents (keyword extractor, NER, RAG) to the multi-agent pipeline
* Turn on overlay signing in non-security examples to compare envelope metadata
* Swap the OAuth dev server with your IdP; integrate your own CA for SVID issuance
* Experiment with **stickiness** to keep a conversation pinned to a replica
* Try the **HTTP connector** to bridge existing HTTP services into the fabric

---

Happy hacking! If you spot a rough edge, file an issue with the example name and any logs/commands you ran.
