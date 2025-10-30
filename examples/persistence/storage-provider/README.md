# Persistence Example — Encrypted Node Storage with Key-Value Store

This example demonstrates how a Naylence node can be configured with a **storage provider** and how an agent can take advantage of this provider to store its own data using a **namespaced key-value store API**.

When you run this example, you will see the following directory structure created:

```
% find data
data
data/agent
data/agent/__node_meta_encrypted_value.db
data/agent/storage_agent_namespace_encrypted_value.db
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

- The file `storage_agent_namespace_encrypted_value.db` contains the **custom agent storage**, where the agent's key-value data is persisted.

> 💡 Developers can also **create and plug in their own node storage providers** if they need custom persistence logic.

---

## What you'll learn

- Configuring a **sentinel** and **agent** with encrypted storage backends.
- Using an agent (`StorageAgent`) to persist custom key-value records.
- Accessing the storage provider's **key-value store API** from an agent.
- Observing that stored data survives across agent restarts.
- Understanding how Naylence internally separates node housekeeping from user-defined storage.
- Working with namespaced key-value stores bound to data models.

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

The `StorageAgent` demonstrates how an agent can use the storage provider's **key-value API** to persist custom data models.

```typescript
/**
 * Data model for stored records
 */
class RecordModel {
  value: string;
  created: Date;

  constructor(value: string, created?: Date) {
    this.value = value;
    this.created = created ?? new Date();
  }
}

/**
 * Agent that demonstrates using the storage provider's key-value API
 */
class StorageAgent extends BaseAgent {
  private _store?: KeyValueStore<RecordModel>;

  /**
   * Initialize the key-value store during agent startup
   */
  async start(): Promise<void> {
    // Get the storage provider from the node (available after agent starts)
    const provider = this.storageProvider;

    // Create a namespaced key-value store bound to RecordModel
    this._store = await provider.getKeyValueStore(
      RecordModel,
      "storage_agent_namespace",
    );
  }

  @operation()
  async storeValue(key: string, value: string): Promise<RecordModel> {
    const record = new RecordModel(value);
    await this._store.set(key, record);
    return record;
  }

  @operation()
  async retrieveValue(key: string): Promise<RecordModel | null> {
    return (await this._store.get(key)) ?? null;
  }

  @operation({ streaming: true })
  async *retrieveAllValues(): AsyncGenerator<[string, RecordModel]> {
    const models = await this._store.list();
    for (const [key, value] of Object.entries(models)) {
      yield [key, value];
    }
  }
}
```

**Key concepts:**

- **`storageProvider`** — access the storage provider from `this.storageProvider` (available after agent starts).
- **`getKeyValueStore(Model, namespace)`** — creates a namespaced key-value store bound to a data model.
- **`set(key, record)`** — saves a record under the given key.
- **`get(key)`** — retrieves a record by key (returns the model or null).
- **`list()`** — lists all stored records in the namespace as a dictionary.

⚠️ **Important:** The `BaseAgent.storageProvider` property is available **only after the agent has started**. Access it inside the `start()` method, not in the constructor. Attempting to use it earlier may result in it being `undefined`.

This API allows the agent to manage its own persisted state safely, with records validated and serialized automatically.

---

## Quick start

### Using Make

```bash
make start
```

This will:

1. Generate a master encryption key
2. Create configuration files
3. Bring up the **sentinel** and **storage-agent** services with encrypted SQLite storage

Run the client:

```bash
make run
```

You will see output like:

```
Stored value: {"value":"Hello, World!","created":"2025-10-29T23:39:36.911Z"}

Retrieved value: {"value":"Hello, World!","created":"2025-10-29T23:39:36.911Z"}

All stored key-values:
[ 'key_1730227876509', { value: 'Hello, World!', created: '2025-10-29T23:30:50.512Z' } ]
...

Total stored values: 5
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

You will notice that the **previously stored values are still available**, even though the agent container was restarted. This proves that the data is being persisted to disk through the configured storage provider.

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

| Python                                 | TypeScript                                        | Notes                 |
| -------------------------------------- | ------------------------------------------------- | --------------------- |
| `class RecordModel(BaseModel):`        | `class RecordModel { ... }`                       | Data model definition |
| `Field(default_factory=...)`           | `created: Date = new Date()`                      | Default values        |
| `async def start(self):`               | `async start(): Promise<void>`                    | Method signature      |
| `self.storage_provider`                | `this.storageProvider`                            | Property access       |
| `await provider.get_kv_store(...)`     | `await provider.getKeyValueStore(...)`            | Method naming         |
| `RecordModel \| None`                  | `RecordModel \| null`                             | Null types            |
| `@operation`                           | `@operation()`                                    | Decorator syntax      |
| `@operation(streaming=True)`           | `@operation({ streaming: true })`                 | Decorator parameters  |
| `async def retrieve_all_values(self):` | `async *retrieveAllValues(): AsyncGenerator`      | Generator syntax      |
| `for k, v in (await ...).items():`     | `for (const [key, value] of Object.entries(...))` | Dictionary iteration  |

---

## Makefile Commands

```bash
make init         # Generate master encryption key and config files
make build        # Build TypeScript and Docker image
make start        # Initialize and start sentinel + agent containers
make stop         # Stop all containers
make run          # Run client to test storage operations
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
                   │ Storage       │
                   │ Agent         │
                   └───────────────┘
                           │
                           ▼
                   ┌───────────────┐
                   │ Storage       │
                   │ Provider      │
                   └───────────────┘
                           │
                           ▼
                   ┌───────────────┐
                   │ Key-Value     │
                   │ Store         │
                   │ (encrypted)   │
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
  - Check agent logs: `docker compose logs storage-agent`

- **"Store not initialized" errors**
  - The storage provider wasn't accessed in the `start()` method
  - Ensure `await super.start()` is called if overriding start in subclass

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
- The TypeScript implementation uses the **key-value store API**, which provides a flexible dictionary-like interface for storing arbitrary records.
- Namespaces isolate different agents' or components' data within the same storage provider.

---

## Variations to try

- **Custom data models:** create complex nested structures with multiple properties
- **Multiple namespaces:** use different namespaces for different types of data
- **Different storage profiles:** try `sqlite` (unencrypted) or `memory` for testing
- **Custom storage provider:** implement your own storage backend (Redis, PostgreSQL, etc.)
- **Data validation:** add validation logic in the data model constructor
- **Bulk operations:** implement batch insert/update operations
- **Query patterns:** add methods to filter or search stored records
- **Expiration/TTL:** implement time-based data expiration
- **Indexing:** add secondary indexes for efficient lookups

---

## Next steps

- Compare with `persistence/agent-state` to see state transaction API vs key-value API
- Combine with `delivery/agent-crash-recovery` for fault-tolerant agents
- Implement data migrations when changing data model structure
- Add data replication for high availability
- Implement data backup and restore functionality
- Monitor storage metrics and optimize database performance
- Add compression for large datasets
- Implement audit logging for storage operations

---

This example demonstrates **flexible key-value storage** for Naylence agents, showing how to persist arbitrary data structures with automatic encryption and serialization — essential for building data-driven agents that maintain custom state beyond the built-in agent state API.
