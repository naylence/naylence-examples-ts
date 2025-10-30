import { withFabric } from "@naylence/runtime";
import { Agent, CLIENT_CONFIG } from "@naylence/agent-sdk";
import { AGENT_ADDR } from "./common.js";

async function main(): Promise<void> {
  await withFabric({ rootConfig: CLIENT_CONFIG }, async () => {
    const remote = Agent.remoteByAddress(AGENT_ADDR);
    const result = await remote.runTask("Hello, World!");
    console.log(result);
  });
}

// Run main function directly (ES module style)
main().catch((error) => {
  console.error("Client failed:", error);
  process.exit(1);
});
