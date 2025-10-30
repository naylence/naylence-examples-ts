import { BaseAgent, NODE_CONFIG } from "@naylence/agent-sdk";
import { operation, withFabric } from "@naylence/runtime";
import { MATH_AGENT1_ADDR } from "./common.js";

class MathAgent extends BaseAgent {
  @operation()
  async add(params: { x: number; y: number }): Promise<number> {
    const { x, y } = params;
    return x + y;
  }

  @operation({ name: "multiply" })
  async multi(params: { x: number; y: number }): Promise<number> {
    const { x, y } = params;
    return x * y;
  }
}

async function main() {
  await withFabric({ rootConfig: NODE_CONFIG }, async () => {
    await new MathAgent().aserve(MATH_AGENT1_ADDR);
  });
}

main().catch((error) => {
  console.error("Math agent 1 failed:", error);
  process.exit(1);
});
