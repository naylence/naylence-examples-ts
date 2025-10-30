/**
 * Client that demonstrates using the storage provider to persist custom data
 *
 * The client:
 * 1. Stores a timestamped value in the storage agent
 * 2. Retrieves the stored value
 * 3. Lists all stored values using streaming
 * 4. Shows that data persists across agent restarts
 */

import { Agent, CLIENT_CONFIG } from "@naylence/agent-sdk";
import { withFabric } from "@naylence/runtime";
import { AGENT_ADDR } from "./common.js";

async function main(): Promise<void> {
  await withFabric({ rootConfig: CLIENT_CONFIG }, async () => {
    const agent = Agent.remoteByAddress(AGENT_ADDR);

    // Create a unique key with current timestamp
    const key = `key_${Date.now()}`;

    // Store a value
    const storedValue = await agent.storeValue(key, "Hello, World!");
    console.log(`\nStored value: ${JSON.stringify(storedValue)}`);

    // Retrieve the value
    const retrievedValue = await agent.retrieveValue(key);
    console.log(`\nRetrieved value: ${JSON.stringify(retrievedValue)}`);

    // List all stored values using streaming
    console.log("\nAll stored key-values:");
    let counter = 0;
    const stream = await agent.retrieveAllValues({ _stream: true });
    for await (const value of stream) {
      console.log(value);
      counter++;
    }
    console.log(`\nTotal stored values: ${counter}`);
  });
}

main().catch((error: Error) => {
  console.error("Client failed:", error);
  process.exit(1);
});
