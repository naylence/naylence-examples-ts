/**
 * Math Agent demonstrating RPC operations with overlay security
 *
 * This agent connects to a sentinel using OAuth2 client credentials flow
 * for admission, and uses overlay security (envelope signing) for message
 * integrity and authenticity. Public keys are exchanged during node attach.
 */

import { BaseAgent, NODE_CONFIG } from "@naylence/agent-sdk";
import { operation, enableLogging, LogLevel } from "@naylence/runtime";
import { AGENT_ADDR } from "./common.js";

enableLogging(LogLevel.DEBUG);

/**
 * Math agent providing addition, multiplication, and Fibonacci streaming
 * with overlay security (envelope signing)
 */
class MathAgent extends BaseAgent {
  /**
   * Add two numbers
   */
  @operation()
  async add(params: { x: number; y: number }): Promise<number> {
    const { x, y } = params;
    return x + y;
  }

  /**
   * Multiply two numbers
   */
  @operation({ name: "multiply" })
  async multi(params: { x: number; y: number }): Promise<number> {
    const { x, y } = params;
    return x * y;
  }

  /**
   * Stream Fibonacci sequence up to n numbers
   */
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
  .aserve(AGENT_ADDR, { rootConfig: NODE_CONFIG })
  .catch((error) => {
    console.error("Math agent failed:", error);
    process.exit(1);
  });
