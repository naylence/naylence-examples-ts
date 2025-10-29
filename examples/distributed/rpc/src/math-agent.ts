import { BaseAgent, NODE_CONFIG } from "@naylence/agent-sdk";
import {
  operation,
  withFabric,
  enableLogging,
  LogLevel,
} from "@naylence/runtime";
import { AGENT_ADDR } from "./common.js";

enableLogging(LogLevel.INFO);

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
    await new MathAgent().aserve(AGENT_ADDR);
  });
}

main().catch((error) => {
  console.error("Math agent failed:", error);
  process.exit(1);
});
