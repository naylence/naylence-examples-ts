# Persistence Example — Encrypted Node Storage

This example demonstrates how a Naylence node can be configured with a **storage provider** and how an agent can take advantage of this provider to store its own data for housekeeping and other purposes.

When you run this example, you will see the following directory structure created:

```
% find data
data
data/agent
data/agent/__node_meta_encrypted_value.db
data/agent/agent_state_encrypted_value.db
data/agent/__keystore_encrypted_value.db
data/agent/__binding_store_encrypted_value.db
data/sentinel
data/sentinel/__node_meta_encrypted_value.db
data/sentinel/__route_store_encrypted_value.db
data/sentinel/__keystore_encrypted_value.db
data/sentinel/__binding_store_encrypted_value.db
```

All of these files are **encrypted SQLite databases**:

- Files beginning with `__` are used for **internal node purposes**, such as:
  - Metadata (`__node_meta…`)
  - Route storage (`__route_store…`)
  - Keystore (`__keystore…`)
  - Binding store (`__binding_store…`)

- The file `agent_state_encrypted_value.db` contains the **custom agent storage**, where the agent's state is persisted.

> 💡 Developers can also **create and plug in their own node storage providers** if they need custom persistence logic.

---

## What you'll learn

- Configuring a **sentinel** and **agent** with encrypted storage backends.
- Using an agent (`PersistentAgent`) to persist custom state across restarts.
- Observing that stored data survives across agent restarts.
- Understanding how Naylence internally separates node housekeeping from user-defined storage.
- Working with `BaseAgentState` to define custom persistent state models.

---

## Important Environment Variables

This example relies on three key environment variables for storage configuration:

```ini
FAME_STORAGE_PROFILE=encrypted-sqlite
FAME_STORAGE_MASTER_KEY=<your_master_key>
FAME_STORAGE_DB_DIRECTORY=/work/data/agent
```

- **`FAME_STORAGE_PROFILE`** — selects the storage backend. In this example we use `encrypted-sqlite`, which stores all node and agent data in encrypted SQLite databases. Other possible values include: **sqlite** (unencrypted SQLite) and **memory** (the default in-memory storage).
- **`FAME_STORAGE_MASTER_KEY`** — the master encryption key used to protect all stored databases. In this example, it is generated automatically during `make init`.
- **`FAME_STORAGE_DB_DIRECTORY`** — the directory path where the encrypted SQLite files will be created and stored. For the agent, this is `/work/data/agent`; for the sentinel, `/work/data/sentinel`.

---

## Storage API Used by the Agent

The `PersistentAgent` demonstrates how an agent can use the built-in **state persistence** to store custom data models that extend `BaseAgentState`.

```typescript
/**
 * Custom agent state that extends BaseAgentState
 */
class CustomAgentState extends BaseAgentState {
  value?: string;
}

/**
 * Agent that persists custom state using the configured storage provider
 * Storage provider is automatically resolved from the node context
 */
class PersistentAgent extends BaseAgent<CustomAgentState> {
  constructor() {
    super(null, {
      stateModel: CustomAgentState,
    });
  }

  /**
   * Store a value in the agent's persistent state
   */
  @operation()
  async storeValue(value: string): Promise<CustomAgentState> {
    return await this.withState(async (state) => {
      state.value = value;
      return state;
    });
  }

  /**
   * Retrieve the current state
   */
  @operation()
  async retrieveValue(): Promise<CustomAgentState> {
    return await this.getState();
  }
}
```

**Key concepts:**

- **`BaseAgentState`** — extend this class to define your custom state schema.
- **`stateModel`** — pass your custom state class in the agent options.
- **`withState(fn)`** — safely update state within a transaction; changes are persisted automatically.
- **`getState()`** — retrieve the current persisted state.

⚠️ **Important:** The storage provider is automatically resolved from the node context when the agent is served. The state is persisted automatically when using `withState()`.

This API allows the agent to manage its own persisted state safely, with automatic serialization and encryption.

---

## Quick start

### Using Make

```bash
make start
```

This will:

1. Generate a master encryption key
2. Create configuration files
3. Bring up the **sentinel** and **persistent-agent** services with encrypted SQLite storage

Run the client:

```bash
make run
```

You will see output like:

```
Previous state: null
Updated state: {"value":"1730227876509"}
```

Now stop the services:

```bash
make stop
```

Then start them again:

```bash
make start
make run
```

You will notice that the **previously stored value is still available**:

```
Previous state: {"value":"1730227876509"}
Updated state: {"value":"1730227899234"}
```

This proves that the data is being persisted to disk through the configured storage provider, even though the agent container was restarted.

---

## Things to watch out for

- The **master encryption key** is generated automatically by `make` or `make init`.
- If you re-run `make init`, a different master key will be created, making your existing encrypted databases unreadable and the nodes will fail to start.
- To start over, run:

```bash
make clean
```

This removes all generated data, configs, and secrets.

- You can safely run `make start` and `make stop` repeatedly; the persisted data will survive restarts.

---

## Code comparison: Python vs TypeScript

Key differences in the implementation:

| Python                                       | TypeScript                                       | Notes                        |
| -------------------------------------------- | ------------------------------------------------ | ---------------------------- |
| `storage_agent.py`                           | `persistent-agent.ts`                            | File naming conventions      |
| `class RecordModel(BaseModel):`              | `class CustomAgentState extends BaseAgentState`  | State model definition       |
| `await self.storage_provider.get_kv_store()` | `super(null, { stateModel: CustomAgentState })`  | Storage initialization       |
| `await self._store.set(key, record)`         | `await this.withState(async (state) => { ... })` | State update pattern         |
| `await self._store.get(key)`                 | `await this.getState()`                          | State retrieval              |
| `@operation`                                 | `@operation()`                                   | Decorator syntax             |
| `RecordModel \| None`                        | `CustomAgentState`                               | Return types                 |
| Key-value store API                          | State transaction API                            | Different abstraction levels |

---

## Makefile Commands

```bash
make init         # Generate master encryption key and config files
make build        # Build TypeScript and Docker image
make start        # Initialize and start sentinel + agent containers
make stop         # Stop all containers
make run          # Run client to test state persistence
make run-verbose  # Run client with envelope debugging
make clean        # Stop containers and remove all generated data
make help         # Show available commands
```

---

## Architecture

```
┌─────────┐
│ Client  │──(RPC)──▶ ┌──────────┐
└─────────┘           │ Sentinel │
                      └──────────┘
                           │
                           ▼
                   ┌───────────────┐
                   │ Persistent    │
                   │ Agent         │
                   └───────────────┘
                           │
                           ▼
                   ┌───────────────┐
                   │ Encrypted     │
                   │ SQLite DB     │
                   └───────────────┘
```

---

## Troubleshooting

- **Client can't connect to sentinel**
  - Ensure all services are running: `docker compose ps`
  - Check sentinel logs: `docker compose logs sentinel`
  - Verify network configuration

- **Agent fails to start**
  - Check if `config/.env.agent` exists (run `make init`)
  - Verify master key is set in environment
  - Check agent logs: `docker compose logs persistent-agent`

- **"Error opening database" or encryption errors**
  - The master key doesn't match the encrypted databases
  - Run `make clean` to start fresh with a new key
  - Ensure `FAME_STORAGE_MASTER_KEY` is consistent across restarts

- **Data not persisting across restarts**
  - Verify `FAME_STORAGE_PROFILE=encrypted-sqlite` is set
  - Check that `FAME_STORAGE_DB_DIRECTORY` points to a mounted volume
  - Ensure the `data/` directory has correct permissions

- **Build errors**
  - Ensure Node.js 18+ is installed: `node --version`
  - Clean and rebuild: `make clean && make build`

- **Database files not visible**
  - Check Docker volume mounts in `docker-compose.yml`
  - Verify the `data/` directory exists and has write permissions

---

## Notes

- All stored data is encrypted at rest with the automatically generated master key.
- The example demonstrates **how agent-defined storage is kept alongside node internal storage**.
- You can plug in your own custom storage provider by implementing the node storage provider interface and configuring the node accordingly.
- The TypeScript implementation uses the **state transaction API** (`withState()`), which provides automatic persistence and concurrency control.
- State updates within `withState()` are atomic and automatically persisted to the configured storage backend.

---

## Variations to try

- **Custom state schema:** extend `BaseAgentState` with complex nested structures
- **Multiple state properties:** add more fields to track different aspects of agent state
- **State migrations:** implement version handling for state schema evolution
- **Different storage profiles:** try `sqlite` (unencrypted) or `memory` for testing
- **Custom storage provider:** implement your own storage backend (Redis, PostgreSQL, etc.)
- **State validation:** add custom validation logic in `withState()` transactions
- **Concurrent updates:** test multiple clients updating state simultaneously
- **Backup and restore:** implement state export/import functionality

---

## Next steps

- Explore `persistence/storage-provider` for more advanced storage patterns
- Combine with `delivery/agent-crash-recovery` for fault-tolerant agents
- Add state versioning and migration logic
- Implement state replication for high availability
- Add state snapshots and point-in-time recovery
- Monitor storage metrics and optimize database performance
- Implement state compression for large datasets

---

This example demonstrates **encrypted persistent storage** for Naylence agents, showing how to maintain state across restarts with automatic encryption and serialization — essential for building stateful, production-ready agents.
