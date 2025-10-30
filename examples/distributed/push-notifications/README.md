# Distributed Push Notifications Example

This example demonstrates how to use the Naylence Agent SDK to implement a **push‑notification** pattern via callback rather than streaming. It consists of:

- A **Sentinel** (`sentinel.ts`) that routes all messages over WebSocket
- A **PushSender** agent (`push-sender.ts`) that runs background tasks and pushes notifications to registered endpoints
- A **PushReceiver** agent (`push-receiver.ts`) that:
  - Registers its own endpoint with the sender
  - Receives and prints notifications via a callback handler

- A **client script** (`client.ts`) that drives the receiver
- A **shared config** (`common.ts`) defining addresses

---

## Prerequisites

- **Node.js 18+**
- **Docker + Docker Compose** for running services
- **Naylence Agent SDK** and **Runtime** installed via npm
- No external API keys are required for this demo.

---

> ⚠️ **Security note:** This demo is intentionally insecure for clarity. There is **no auth, TLS, or overlay security** enabled here. Later examples will layer in secure admission, identities, and sealed channels.

---

> **For curious souls:** Naylence ships with a lightweight HTTP server under the hood but you'll never need to see or configure it. All transport, routing, and addressing are handled by the fabric itself. No boilerplate servers, no route wiring, just `make start` and go.

---

## Directory Layout

```
examples/distributed/push-notifications/
├── src/
│   ├── common.ts            # Addresses
│   ├── sentinel.ts          # Fame router (WebSocket attach)
│   ├── push-sender.ts       # PushSender agent (BackgroundTaskAgent)
│   ├── push-receiver.ts     # PushReceiver agent (BackgroundTaskAgent)
│   └── client.ts            # Simple client to start the receiver
├── docker-compose.yml       # Container orchestration
├── Makefile                 # Build & run commands
└── package.json             # Dependencies
```

---

## Configuration (`common.ts`)

- **RECEIVER_AGENT_ADDR** — Logical address where `PushReceiver` is served (`"receiver@fame.fabric"`).
- **SENDER_AGENT_ADDR** — Logical address for `PushSender` (`"sender@fame.fabric"`).
- **NODE_CONFIG** — Sentinel/agent fabric settings (dev mode, WebSocket URL).
- **CLIENT_CONFIG** — Client fabric settings (dev mode, WebSocket URL).

---

## How It Works

1. **Start the Sentinel**

   ```bash
   make start
   ```

   This builds the TypeScript code and starts all services via Docker Compose:
   - **sentinel** on port 8000 with WebSocket attach endpoint
   - **push-sender** agent at `"sender@fame.fabric"`
   - **push-receiver** agent at `"receiver@fame.fabric"`

2. **PushSender agent** (`push-sender.ts`)
   - Uses `BackgroundTaskAgent.aserve()` to serve at `"sender@fame.fabric"`.
   - Stores incoming `TaskPushNotificationConfig` in an internal Map.
   - When its `runBackgroundTask` is invoked, it loops ~9 times, sending JSON notifications to the registered endpoint using `FameFabric.current().sendMessage(url, payload)`.
   - Each notification includes `task_id` and `message`.

3. **PushReceiver agent** (`push-receiver.ts`)
   - Serves at `"receiver@fame.fabric"` via `BackgroundTaskAgent.aserve()`.
   - Its `runBackgroundTask` does:
     1. Generate a new `task_id` using `generateId()`.
     2. **RPC** to `PushSender.registerPushEndpoint(...)`, passing a `TaskPushNotificationConfig` with its own address.
     3. **RPC** to `PushSender.runTask(null, taskId)` which starts the sender's background loop.

   - Implements `onMessage(message)` to print each incoming push notification and store it in a Map.

4. **Run the client**

   ```bash
   make run
   ```

   - Creates a FameFabric context using `CLIENT_CONFIG`.
   - Obtains a proxy to `PushReceiver` via `Agent.remoteByAddress(RECEIVER_AGENT_ADDR)`.
   - Calls `runTask()` to enqueue the receiver's background job.
   - As the job runs, you'll see notifications in the logs:

     ```text
     PushReceiver running task <task-id>
     Configured push notification endpoint for task <task-id>
     PushSender running task <task-id>
     PushSender sent notification { task_id: '...', message: 'Notification #1' }
     PushReceiver got notification: { task_id: '...', message: 'Notification #1' }
     ...
     PushSender sent notification { task_id: '...', message: 'Notification #9' }
     PushReceiver got notification: { task_id: '...', message: 'Notification #9' }
     PushSender completed task <task-id>
     ```

---

## Key Concepts Demonstrated

- **Callback‐style notifications** via `sendMessage` and a custom `onMessage` handler
- **Decoupled agents**: sender knows nothing about the receiver beyond its address
- **BackgroundTaskAgent**: leveraging long‐running tasks with status updates
- **FameFabric routing**: WebSocket attach, JSON frame delivery
- **RPC + push combo**: using one A2A call to configure, another to start
- **Distributed task coordination**: receiver coordinates with sender via RPC before receiving async push notifications

---

## Run it

> Requirements: Docker + Docker Compose + Node.js 18+ installed.

```bash
make start       # install deps, build, start sentinel and agents
make run         # run client (triggers push notifications)
make run-verbose # same as run, but prints envelope metadata
make logs        # view logs from all services
make logs-sender # view logs from push-sender
make logs-receiver # view logs from push-receiver
make stop        # tear down services
```

### Expected output

The client will output the collected notifications:

```json
{
  "notifications": [
    "Notification #1",
    "Notification #2",
    "Notification #3",
    "Notification #4",
    "Notification #5",
    "Notification #6",
    "Notification #7",
    "Notification #8",
    "Notification #9"
  ]
}
```

You can also watch the receiver logs to see notifications arrive in real-time:

```bash
make logs-receiver
```

---

## Code comparison: Python vs TypeScript

Key differences in the implementation:

| Python                                  | TypeScript                                        | Notes                   |
| --------------------------------------- | ------------------------------------------------- | ----------------------- |
| `push_sender.py`                        | `push-sender.ts`                                  | File naming conventions |
| `run_background_task(self, params)`     | `async runBackgroundTask(params: TaskSendParams)` | Method naming + types   |
| `fabric.send_json(url, payload)`        | `await fabric.sendMessage(url, notification)`     | API naming              |
| `def on_message(self, message)`         | `async onMessage(message: any)`                   | Method naming           |
| `dict[str, TaskPushNotificationConfig]` | `Map<string, TaskPushNotificationConfig>`         | Data structures         |
| `@operation`                            | `@operation()`                                    | Decorator syntax        |
| `BackgroundTaskAgent.aserve(...)`       | `await BackgroundTaskAgent.aserve(...)`           | Async patterns          |
| `Agent.remote_by_address(...)`          | `Agent.remoteByAddress(...)`                      | Method naming           |
| `generate_id()`                         | `generateId()`                                    | Function naming         |

---

## Troubleshooting

- **No notifications?**
  - Ensure both agents use the _same_ `SENDER_AGENT_ADDR` and `RECEIVER_AGENT_ADDR` in `common.ts`.
  - Check that the sender and receiver containers are healthy: `docker compose ps`
  - View logs: `make logs-sender` and `make logs-receiver`

- **Sentinel connection errors?**
  - Verify sentinel is running and reachable at `ws://localhost:8000/fame/v1/attach/ws/downstream`
  - Check sentinel logs: `make logs-sentinel`

- **Client timeouts?**
  - Ensure all services are up before running the client: `docker compose ps`
  - Try `make run-verbose` to see envelope-level debugging

- **Build errors?**
  - Ensure Node.js 18+ is installed: `node --version`
  - Clean and rebuild: `make clean && make build`

- **Container network issues?**
  - All containers should be on the same Docker network
  - Check `docker compose logs` for network-related errors

---

## Variations to try

- **Custom notification formats:** extend the notification payload with timestamps, priorities, or structured data
- **Multiple receivers:** register multiple endpoints with the same sender and observe broadcast behavior
- **Notification filtering:** add filter parameters to `registerPushEndpoint` to control which notifications a receiver gets
- **Throttle interval:** adjust the `setTimeout` delay in `push-sender.ts` to control notification rate
- **Error handling:** implement retry logic if `sendMessage` fails
- **Push notification acknowledgments:** have receivers send ACKs back to the sender
- **Stateful notifications:** track notification delivery status in the sender
- **Security profiles:** switch to **overlay** or **strict‑overlay** to see how identities propagate in push notifications

---

## Next steps

- Explore `distributed/rpc` for synchronous request-response patterns
- Compare with `distributed/cancellable` to see streaming vs callback patterns
- Add authentication to push endpoints using security profiles
- Implement a notification queue for reliable delivery
- Add monitoring to track notification delivery metrics
- Extend with notification persistence for offline receivers

---

This example demonstrates **decoupled asynchronous communication** where agents can receive notifications via callback handlers rather than polling or streaming, enabling event-driven architectures with minimal coupling between sender and receiver.
