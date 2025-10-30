import { BaseAgent, NODE_CONFIG } from "@naylence/agent-sdk";
import { operation, withFabric } from "@naylence/runtime";
import { MATH_AGENT1_ADDR } from "./common.js";

class MathAgent extends BaseAgent {
  @operation() // exposed as "add"
  async add(params: { x: number; y: number }): Promise<number> {
    return params.x + params.y;
  }

  @operation({ name: "multiply" }) // exposed as "multiply"
  async multi(params: { x: number; y: number }): Promise<number> {
    return params.x * params.y;
  }
}

await withFabric({ rootConfig: NODE_CONFIG }, async () => {
  await new MathAgent().aserve(MATH_AGENT1_ADDR);
});
