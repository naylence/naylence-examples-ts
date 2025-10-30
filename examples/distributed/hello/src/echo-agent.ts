import { withFabric } from "@naylence/runtime";
import { BaseAgent, SENTINEL_CONFIG } from "@naylence/agent-sdk";
import { AGENT_ADDR } from "./common.js";

class EchoAgent extends BaseAgent {
  async runTask(payload: any): Promise<any> {
    return payload;
  }
}

async function main() {
  await withFabric({ rootConfig: SENTINEL_CONFIG }, async () => {
    await new EchoAgent().aserve(AGENT_ADDR);
  });
}

// Start the agent when this module is run directly
main().catch((error) => {
  console.error("Echo agent failed:", error);
  process.exit(1);
});
