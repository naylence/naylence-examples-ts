# Distributed Cancellable Agent — A2A Tasks & Cancellation

This example demonstrates **Agent‑to‑Agent (A2A) task APIs** in a **distributed** topology. A client starts a long‑running task on an agent, subscribes to task updates (status + artifacts), reacts to progress, and then **cancels** the task mid‑flight.

---

Flow:

```
request: client ──▶ sentinel ──▶ cancellable-agent
reply:   client ◀─ sentinel ◀─ cancellable-agent
updates: client ◀─ sentinel ◀─ cancellable-agent (status/artifacts)
```

---

> ⚠️ **Security note:** This demo is intentionally insecure for clarity. There is **no auth, TLS, or overlay security** enabled here. Later examples will layer in secure admission, identities, and sealed channels.

---

> **For curious souls:** Naylence ships with a lightweight HTTP server under the hood but you'll never need to see or configure it. All transport, routing, and addressing are handled by the fabric itself. No boilerplate servers, no route wiring, just `make start` and go.

---

## What you'll learn

- Starting long‑running tasks with **`startTask(...)`**
- Receiving live **status** and **artifact** updates via **`subscribeToTaskUpdates(...)`**
- Updating artifacts from the agent using **`updateTaskArtifact(...)`**
- Querying task state with **`getTaskState(...)`**
- Canceling work with **`cancelTask(...)`**

---

## Components

- **cancellable-agent.ts** — Implements a `BackgroundTaskAgent` that simulates work in steps, emits progress artifacts, and stops when canceled.
- **client.ts** — Starts a task, subscribes to updates, prints progress, and cancels after a threshold.
- **sentinel.ts** — Runs the sentinel (downstream admission point at `:8000`).
- **common.ts** — Holds the logical address `cancellable@fame.fabric`.
- **docker-compose.yml** — Brings up **sentinel** and **cancellable-agent**; you run the client from the host.

---

## Quick start

> Requirements: Docker + Docker Compose + Node.js 18+ installed.

From this example folder:

```bash
make start       # 🚀 installs deps, builds, and brings up the stack (sentinel + cancellable-agent)
```

Run the sample client against the cancellable agent:

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
make build       # compile TypeScript
docker compose up -d
```

This starts:

- **sentinel** on `localhost:8000`
- **cancellable-agent** connected to the sentinel

2. **Run the client (host)**

```bash
make run
```

or

```bash
FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream" \
FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk \
node --enable-source-maps dist/client.mjs
```

### Example output

```
[STATUS] WORKING
[DATA ] progress: 0.1
[DATA ] progress: 0.2
[DATA ] progress: 0.3
[DATA ] progress: 0.4
[DATA ] progress: 0.5
Canceling task iuqSvFy19cUxswS
[STATUS] CANCELED
```

3. **Stop**

```bash
docker compose down --remove-orphans
```

---

## Standalone (no Compose)

Use your local Node.js environment to run each component in separate terminals:

**Terminal A — sentinel**

```bash
npx tsx src/sentinel.ts
```

**Terminal B — agent**

```bash
FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream" \
FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk \
npx tsx src/cancellable-agent.ts
```

**Terminal C — client**

```bash
FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream" \
FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk \
npx tsx src/client.ts
```

---

## How it works

### Agent

- Subclass: **`BackgroundTaskAgent`**
- Entry point: **`runBackgroundTask(params: TaskSendParams)`** — runs asynchronously in the background.

**Minimal agent loop**

```typescript
import {
  BackgroundTaskAgent,
  TaskState,
  type Artifact,
  type TaskSendParams,
} from "@naylence/agent-sdk";

class CancellableAgent extends BackgroundTaskAgent {
  async runBackgroundTask(params: TaskSendParams): Promise<void> {
    const maxSteps = 10;
    for (let i = 1; i < maxSteps; i++) {
      // 1) honor cancellation
      const taskState = await this.getTaskState(params.id);
      if (taskState === TaskState.CANCELED) {
        break;
      }

      // 2) compute progress
      const progress = i / maxSteps;

      // 3) emit progress artifact
      const artifact: Artifact = {
        parts: [{ type: "data", data: { progress } }],
        index: 0,
      };
      await this.updateTaskArtifact(params.id, artifact);

      // 4) simulate work
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}
```

### Client

**Start → subscribe → cancel**

```typescript
import { Agent, makeTaskParams } from "@naylence/agent-sdk";
import { generateId } from "@naylence/core";

async function main(): Promise<void> {
  await withFabric({ rootConfig: CLIENT_CONFIG }, async () => {
    const agent = Agent.remoteByAddress(AGENT_ADDR);
    const taskId = generateId();

    await agent.startTask(makeTaskParams({ id: taskId }));

    const updates = await agent.subscribeToTaskUpdates(
      makeTaskParams({ id: taskId }),
    );

    for await (const evt of updates) {
      if ("status" in evt) {
        console.log(`[STATUS] ${evt.status.state}`);
      } else if ("artifact" in evt) {
        const part = evt.artifact.parts[0] as DataPart;
        const progress = part.data["progress"] as number;
        console.log(`[DATA ] progress: ${progress}`);
        if (progress >= 0.5) {
          console.log(`Canceling task ${taskId}`);
          await agent.cancelTask({ id: taskId });
        }
      }
    }
  });
}
```

Because the client, sentinel, and agent are separate services, all commands and update streams travel across the fabric — but the code looks almost identical to the single‑process version.

---

## Code comparison: Python vs TypeScript

Key differences in the implementation:

| Python                                   | TypeScript                                               | Notes                      |
| ---------------------------------------- | -------------------------------------------------------- | -------------------------- |
| `run_background_task`                    | `runBackgroundTask`                                      | CamelCase for method names |
| `get_task_state`                         | `getTaskState`                                           |                            |
| `update_task_artifact`                   | `updateTaskArtifact`                                     |                            |
| `start_task`                             | `startTask`                                              |                            |
| `subscribe_to_task_updates`              | `subscribeToTaskUpdates`                                 |                            |
| `cancel_task`                            | `cancelTask`                                             |                            |
| `make_task_params`                       | `makeTaskParams`                                         |                            |
| `TaskState.CANCELED`                     | `TaskState.CANCELED`                                     | Enum usage is similar      |
| `asyncio.sleep(0.5)`                     | `await new Promise(resolve => setTimeout(resolve, 500))` | Sleep/delay pattern        |
| `async for evt in updates:`              | `for await (const evt of updates)`                       | Async iteration syntax     |
| `isinstance(evt, TaskStatusUpdateEvent)` | `"status" in evt`                                        | Type checking approach     |

---

## Troubleshooting

- **Client can't connect** → Ensure `FAME_DIRECT_ADMISSION_URL` points to the sentinel you're using (`localhost` from host; `sentinel` in Compose).
- **Agent doesn't attach** → Start the **sentinel** first; check the env var in docker-compose.yml.
- **No updates appear** → Confirm you subscribed with the same `taskId` you used to start the task.
- **Port in use** → Another process is using `8000`; change the Compose mapping or free the port.
- **Build errors** → Ensure Node.js 18+ is installed and run `npm install --legacy-peer-deps`.
- **Module not found** → Make sure you've run `make build` or `npm run build` before starting services.

---

## Next steps

- Replace the dummy loop with real long‑running work (downloads, ETL, training, etc.).
- Add **checkpoint artifacts** and **final result** artifacts.
- Demonstrate **client reconnection** and resubscribing to in‑flight tasks.
- Add **secure admission** and **overlay encryption** to the same example.
- Experiment with different cancellation thresholds or add user input to cancel interactively.
- Compare with the `status-subscription` example to see more detailed status update patterns.

---

This example highlights the full A2A lifecycle — **start → stream updates → cancel** — and, by contrast, helps you appreciate how simple the one‑shot `runTask(...)` API is in earlier examples.
