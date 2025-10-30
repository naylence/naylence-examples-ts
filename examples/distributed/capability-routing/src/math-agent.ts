import { BaseAgent, NODE_CONFIG } from "@naylence/agent-sdk";
import { operation, withFabric } from "@naylence/runtime";
import { AGENT_CAPABILITY } from "@naylence/core";
import { MATH_CAPABILITY } from "./common.js";

class MathAgent extends BaseAgent {
  constructor(name: string | null = null) {
    super(name);
  }

  override get capabilities(): string[] {
    return [AGENT_CAPABILITY, MATH_CAPABILITY];
  }

  @operation() // exposed as "add"
  async add(params: { x: number; y: number }): Promise<number> {
    const { x, y } = params;
    return x + y;
  }

  @operation({ name: "multiply" }) // exposed as "multiply"
  async multi(params: { x: number; y: number }): Promise<number> {
    const { x, y } = params;
    return x * y;
  }

  @operation({ name: "fibStream", streaming: true }) // exposed as "fib_stream" with streaming enabled
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

async function main(): Promise<void> {
  await withFabric({ rootConfig: NODE_CONFIG }, async () => {
    await new MathAgent().aserve("math@fame.fabric");
  });
}

main().catch((error) => {
  console.error("Math agent failed:", error);
  process.exit(1);
});
