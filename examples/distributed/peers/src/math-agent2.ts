import { BaseAgent, NODE_CONFIG } from "@naylence/agent-sdk";
import { operation, withFabric } from "@naylence/runtime";
import { MATH_AGENT2_ADDR } from "./common.js";

class MathAgent extends BaseAgent {
  @operation({ name: "fib_stream", streaming: true }) // exposed as "fib_stream" with streaming enabled
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

await withFabric({ rootConfig: NODE_CONFIG }, async () => {
  await new MathAgent().aserve(MATH_AGENT2_ADDR);
});
