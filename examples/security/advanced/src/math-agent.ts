/**
 * Math Agent demonstrating RPC operations with advanced security
 *
 * This agent uses the advanced security profile with:
 * - X.509/SPIFFE certificates for node identity
 * - Welcome service admission with OAuth2
 * - Strict overlay encryption (sealed channels)
 */

import { BaseAgent, NODE_CONFIG } from "@naylence/agent-sdk";
import { operation } from "@naylence/runtime";
import { AGENT_ADDR } from "./common.js";

/**
 * Math agent providing addition, multiplication, and Fibonacci streaming
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
