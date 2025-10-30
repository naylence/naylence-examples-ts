# Status Subscription — A2A Task Updates Across the Fabric

This example shows how a client (or another agent) uses the **Agent‑to‑Agent (A2A) task interface** to **subscribe to live task updates** (status + artifacts) from a background task running on an agent.

---

Flow:

```
request: client ──▶ sentinel ──▶ status‑agent (startTask)
updates: client ◀─ sentinel ◀─ status‑agent (status/artifacts stream)
```

All messaging moves over the fabric; no REST servers or custom sockets.

---

> ⚠️ **Security note:** This demo is intentionally insecure for clarity. There is **no auth, TLS, or overlay security** enabled here. Later examples add secure admission, identities, and sealed channels.

---

> **For curious souls:** Naylence ships with a lightweight HTTP server under the hood but you'll never need to see or configure it. All transport, routing, and addressing are handled by the fabric itself. No boilerplate servers, no route wiring, just `make start` and go.

---

## What you'll learn

- Starting a background task with **`startTask(...)`**
- Subscribing to **status** and **artifact** updates via **`subscribeToTaskUpdates(...)`**
- Emitting artifacts from an agent with **`updateTaskArtifact(...)`**
- Reading updates as a **stream** of `TaskStatusUpdateEvent` and `TaskArtifactUpdateEvent`
- Discriminating between different event types in the update stream

---

## Components

- **`src/status-agent.ts`** — A `BackgroundTaskAgent` that simulates five work steps and emits progress artifacts.
- **`src/client.ts`** — Starts a task, subscribes to its update stream, and prints both status and artifact messages.
- **`src/sentinel.ts`** — Runs the sentinel (downstream attach URL served on `:8000`).
- **`docker-compose.yml`** — Starts **sentinel** and **status‑agent**; the client runs on the host.
- **`src/common.ts`** — Declares the logical address `status@fame.fabric`.

**Logical address:** `status@fame.fabric`

---

## Quick start

> Requirements: Docker + Docker Compose + Node.js 18+ installed.

From this example folder:

```bash
make start       # 🚀 bring up sentinel + status-agent
```

Run the sample client against the status agent:

```bash
make run         # ▶️ executes client
```

Shut down when done:

```bash
make stop        # ⏹ tear down containers
```

### See envelope traffic

Use the verbose target to print each **envelope** as it traverses the fabric:

```bash
make run-verbose
```

---

## Alternative: Docker Compose (manual)

1. **Start services**

```bash
docker compose up -d
```

This launches:

- **sentinel** on `localhost:8000`
- **status-agent** attached to the sentinel (via `FAME_DIRECT_ADMISSION_URL`)

2. **Run the client (host)**

```bash
export FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream"
npm run client
```

**Example output** (abridged):

```
[STATUS] WORKING
[DATA ] step 1/5 complete
[DATA ] step 2/5 complete
[DATA ] step 3/5 complete
[DATA ] step 4/5 complete
[DATA ] step 5/5 complete
[STATUS] FINISHED
```

3. **Stop**

```bash
docker compose down --remove-orphans
```

---

## Alternative: Run client in Docker

```bash
make run-docker         # run client in Docker container
make run-docker-verbose # run with envelope logging
```

---

## Standalone (no Compose)

Run each component in separate terminals with your local Node.js:

**Terminal A — sentinel**

```bash
npx tsx src/sentinel.ts
```

**Terminal B — agent**

```bash
export FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream"
npx tsx src/status-agent.ts
```

**Terminal C — client**

```bash
export FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream"
npx tsx src/client.ts
```

---

## How it works

### Agent

The agent subclasses `BackgroundTaskAgent` and periodically publishes progress artifacts while the background task runs:

```typescript
class StatusAgent extends BackgroundTaskAgent {
  async runBackgroundTask(params: TaskSendParams): Promise<void> {
    for (let i = 1; i <= 5; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const artifact: Artifact = {
        parts: [{ type: "data", data: { progress: `step ${i}/5 complete` } }],
        index: 0,
      };
      await this.updateTaskArtifact(params.id, artifact);
    }
  }
}
```

### Client

The client starts a task with a generated ID, then subscribes to the **same** ID's update stream and discriminates the incoming events:

```typescript
await withFabric({ rootConfig: CLIENT_CONFIG }, async () => {
  const agent = Agent.remoteByAddress(AGENT_ADDR);
  const taskId = generateId();

  await agent.startTask(makeTaskParams({ id: taskId }));

  const updates = await agent.subscribeToTaskUpdates(
    makeTaskParams({ id: taskId }),
  );

  for await (const evt of updates) {
    if ("status" in evt) {
      const statusEvt = evt as TaskStatusUpdateEvent;
      console.log(`[STATUS] ${statusEvt.status.state}`);
    } else if ("artifact" in evt) {
      const artifactEvt = evt as TaskArtifactUpdateEvent;
      const part = artifactEvt.artifact.parts[0] as DataPart;
      console.log(`[DATA ] ${part.data["progress"]}`);
    }
  }
});
```

Because the client, sentinel, and agent are separate services, **both** commands and updates travel across the fabric, but the code looks nearly identical to a single‑process setup.

---

## Code comparison: Python vs TypeScript

Key differences in the implementation:

| Python                                   | TypeScript                                        | Notes                    |
| ---------------------------------------- | ------------------------------------------------- | ------------------------ |
| `status_agent.py`                        | `status-agent.ts`                                 | File naming conventions  |
| `run_background_task(self, params)`      | `async runBackgroundTask(params: TaskSendParams)` | Method naming            |
| `await self.update_task_artifact(...)`   | `await this.updateTaskArtifact(...)`              | Method naming            |
| `Artifact(parts=[DataPart(...)])`        | `{ parts: [{ type: "data", data: {...} }] }`      | Object construction      |
| `Agent.remote_by_address(...)`           | `Agent.remoteByAddress(...)`                      | Method naming            |
| `make_task_params(id=task_id)`           | `makeTaskParams({ id: taskId })`                  | Function naming + params |
| `await agent.start_task(...)`            | `await agent.startTask(...)`                      | Method naming            |
| `await agent.subscribe_to_task_updates`  | `await agent.subscribeToTaskUpdates(...)`         | Method naming            |
| `isinstance(evt, TaskStatusUpdateEvent)` | `"status" in evt`                                 | Type discrimination      |
| `async for evt in updates:`              | `for await (const evt of updates)`                | Async iteration          |
| `part.data['progress']`                  | `part.data["progress"]`                           | Quote style              |

---

## Troubleshooting

- **Client can't connect**
  - Verify `FAME_DIRECT_ADMISSION_URL` (`localhost` from host; `sentinel` inside Compose network)
  - Ensure sentinel is running: `docker compose ps`
  - Check sentinel logs: `docker compose logs sentinel`

- **No updates appear**
  - Ensure the `taskId` used in `subscribeToTaskUpdates` matches the one used in `startTask`
  - Try `make run-verbose` to see envelope traffic
  - Check agent logs: `docker compose logs status-agent`

- **Agent doesn't attach**
  - Start **sentinel** first; check the env var in `docker-compose.yml`
  - Verify `FAME_DIRECT_ADMISSION_URL` points to the sentinel

- **Port in use**
  - Another process is using `8000`; change the Compose mapping or free the port
  - Check with: `lsof -i :8000`

- **Build errors**
  - Ensure Node.js 18+ is installed: `node --version`
  - Clean and rebuild: `make clean && make build`

- **Updates stream doesn't end**
  - This is expected behavior - the stream remains open until the task completes
  - The client will exit when the task reaches a terminal state (FINISHED/FAILED)

---

## Variations to try

- **Richer artifacts:** emit JSON progress with percentages, ETAs, partial results, checkpoints, final payloads
- **Client reconnection:** demonstrate reconnecting and resubscribing to an in‑flight task
- **Multiple subscribers:** have multiple clients subscribe to the same task updates
- **Cancellation:** combine with the **cancellable** example to add `cancelTask(...)` handling
- **Progress tracking:** build a progress bar UI that updates in real-time
- **Error handling:** emit error artifacts and handle task failures gracefully
- **Checkpointing:** save intermediate results as artifacts for recovery
- **Security profiles:** turn on **gated/overlay/strict‑overlay** without changing app code
- **Selective subscriptions:** filter updates by type (status-only or artifacts-only)

---

## Next steps

- Explore `distributed/cancellable` to add task cancellation
- Combine with `delivery/agent-crash-recovery` for resilient task execution
- Add persistence to store task state and artifacts
- Implement a dashboard to monitor multiple concurrent tasks
- Add metrics and monitoring for task performance tracking
- Extend with task queuing and priority scheduling
- Implement task dependencies and workflow orchestration

---

This example demonstrates **real-time task monitoring** using the A2A task interface, enabling clients to observe long-running operations with live status updates and incremental artifacts — all routed transparently through the fabric without custom protocols or servers.
