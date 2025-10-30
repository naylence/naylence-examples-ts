import { BaseAgent, NODE_CONFIG, Agent } from "@naylence/agent-sdk";
import { operation, withFabric } from "@naylence/runtime";
import { MATH_AGENT1_ADDR, MATH_AGENT2_ADDR } from "./common.js";

class MathAgent extends BaseAgent {
  @operation({ name: "multiply" })
  async multi(params: { x: number; y: number }): Promise<number> {
    const { x, y } = params;
    // Delegate to math-agent1 in the other biome
    const agent1 = Agent.remoteByAddress(MATH_AGENT1_ADDR);
    return await agent1.multiply({ x, y });
  }

  @operation({ name: "fib_stream", streaming: true })
  async *fib(params: { n: number }): AsyncGenerator<number> {
    const { n } = params;
    let a = 0;
    let b = 1;
    for (let i = 0; i < n; i++) {
      yield a;
      [a, b] = [b, a + b];
    }
  }
}

async function main() {
  await withFabric({ rootConfig: NODE_CONFIG }, async () => {
    await new MathAgent().aserve(MATH_AGENT2_ADDR);
  });
}

main().catch((error) => {
  console.error("Math agent 2 failed:", error);
  process.exit(1);
});
