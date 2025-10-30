import { withFabric } from "@naylence/runtime";
import { Agent, CLIENT_CONFIG } from "@naylence/agent-sdk";
import { RECEIVER_AGENT_ADDR } from "./common.js";

async function main(): Promise<void> {
  await withFabric({ rootConfig: CLIENT_CONFIG }, async () => {
    const agent = Agent.remoteByAddress(RECEIVER_AGENT_ADDR);
    const result = await (agent as any).runTask(null, null);
    console.log(result);
  });
}

main().catch((error) => {
  console.error("Client failed:", error);
  process.exit(1);
});
