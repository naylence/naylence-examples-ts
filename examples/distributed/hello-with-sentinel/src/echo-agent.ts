import { withFabric } from "@naylence/runtime";
import { BaseAgent, NODE_CONFIG } from "@naylence/agent-sdk";
import { AGENT_ADDR } from "./common.js";

class EchoAgent extends BaseAgent {
  async runTask(payload: unknown): Promise<unknown> {
    return payload;
  }
}

async function main() {
  await withFabric({ rootConfig: NODE_CONFIG }, async () => {
    await new EchoAgent().aserve(AGENT_ADDR);
  });
}

// Run main function directly (ES module style)
main().catch((error) => {
  console.error("Echo agent failed:", error);
  process.exit(1);
});
