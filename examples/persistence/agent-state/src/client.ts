import { Agent, CLIENT_CONFIG } from "@naylence/agent-sdk";
import { withFabric } from "@naylence/runtime";
import { AGENT_ADDR } from "./common.js";

async function main(): Promise<void> {
  await withFabric({ rootConfig: CLIENT_CONFIG }, async () => {
    const agent = Agent.remoteByAddress(AGENT_ADDR);

    // Retrieve previous state
    const previousState = await agent.retrieveValue();
    console.log(`Previous state: ${JSON.stringify(previousState)}`);

    // Store new value with current timestamp
    const value = `${Date.now()}`;
    const updatedState = await agent.storeValue(value);
    console.log(`Updated state: ${JSON.stringify(updatedState)}`);
  });
}

main().catch((error) => {
  console.error("Client failed:", error);
  process.exit(1);
});
