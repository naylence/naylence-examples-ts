/**
 * Math Agent demonstrating stickiness with strict overlay security.
 * Two replicas run this same binary; requested_logicals uses a wildcard
 * so the sentinel can fan-out and pin traffic to a replica.
 */

import { BaseAgent } from "@naylence/agent-sdk";
import { operation } from "@naylence/runtime";
import { AGENT_ADDR } from "./common.js";
import { STICKINESS_AGENT_CONFIG } from "./config.js";

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

await new MathAgent()
  .aserve(AGENT_ADDR, { rootConfig: STICKINESS_AGENT_CONFIG })
  .catch((error) => {
    console.error("Math agent failed:", error);
    process.exit(1);
  });
