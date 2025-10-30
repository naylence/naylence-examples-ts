/**
 * Storage Agent demonstrating custom key-value storage using the node's storage provider
 *
 * This agent shows how to:
 * 1. Access the storage provider from the Fame node context
 * 2. Create a namespaced key-value store bound to a data model
 * 3. Perform CRUD operations with automatic serialization/deserialization
 * 4. Persist data across agent restarts using encrypted SQLite
 *
 * The storage provider is automatically resolved from the FameNode context
 * based on environment variables (FAME_STORAGE_PROFILE, FAME_STORAGE_MASTER_KEY, etc.)
 */

import { BaseAgent, NODE_CONFIG } from "@naylence/agent-sdk";
import { operation, type KeyValueStore } from "@naylence/runtime";
import { AGENT_ADDR } from "./common.js";

/**
 * Data model for stored records
 * This class defines the structure of data stored in the key-value store
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
 *
 * The agent uses a namespaced key-value store to persist RecordModel instances.
 * All storage operations are encrypted when using the encrypted-sqlite profile.
 */
class StorageAgent extends BaseAgent {
  private _store?: KeyValueStore<RecordModel>;

  /**
   * Initialize the key-value store during agent startup
   * The storage provider is accessed from the node context after the agent starts
   */
  async start(): Promise<void> {
    // Get the storage provider from the node (available after agent starts)
    const provider = this.storageProvider;

    // Create a namespaced key-value store bound to RecordModel
    // Namespace isolates this agent's data from other storage users
    this._store = await provider.getKeyValueStore(
      RecordModel,
      "storage_agent_namespace",
    );
  }

  /**
   * Store a value in the key-value store
   * @param key - The key to store the value under
   * @param value - The string value to store
   * @returns The created RecordModel with timestamp
   */
  @operation()
  async storeValue(key: string, value: string): Promise<RecordModel> {
    if (!this._store) {
      throw new Error("Store not initialized");
    }

    const record = new RecordModel(value);
    await this._store.set(key, record);
    return record;
  }

  /**
   * Retrieve a value from the key-value store
   * @param key - The key to retrieve
   * @returns The RecordModel if found, null otherwise
   */
  @operation()
  async retrieveValue(key: string): Promise<RecordModel | null> {
    if (!this._store) {
      throw new Error("Store not initialized");
    }

    const model = await this._store.get(key);
    return model ?? null;
  }

  /**
   * Retrieve all stored values as a streaming operation
   * Yields key-value pairs as they are read from storage
   */
  @operation({ streaming: true })
  async *retrieveAllValues(): AsyncGenerator<[string, RecordModel]> {
    if (!this._store) {
      throw new Error("Store not initialized");
    }

    const models = await this._store.list();
    for (const [key, value] of Object.entries(models)) {
      yield [key, value];
    }
  }
}

// Start the agent server
await new StorageAgent()
  .aserve(AGENT_ADDR, { rootConfig: NODE_CONFIG })
  .catch((error) => {
    console.error("Storage agent failed:", error);
    process.exit(1);
  });
