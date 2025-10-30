import { BaseAgent } from "@naylence/agent-sdk";
import { operation } from "@naylence/runtime";
import { AGENT_ADDR } from "./common.js";

class MathAgent extends BaseAgent {
  @operation()
  async add(params: { x: number; y: number }): Promise<number> {
    const { x, y } = params;
    return x + y;
  }

  @operation({ name: "multiply" })
  async multiply(params: { x: number; y: number }): Promise<number> {
    const { x, y } = params;
    return x * y;
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

await new MathAgent().aserve(AGENT_ADDR).catch((error: unknown) => {
  console.error("Math agent failed:", error);
  process.exit(1);
});
