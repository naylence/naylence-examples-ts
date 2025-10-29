/**
 * Client demonstrating OAuth2-gated admission to Naylence fabric
 *
 * This client:
 * 1. Fetches an OAuth2 bearer token using client credentials
 * 2. Connects to the sentinel using the token
 * 3. Makes RPC calls to the math agent
 */

import { Agent, CLIENT_CONFIG } from "@naylence/agent-sdk";
import { withFabric, enableLogging, LogLevel } from "@naylence/runtime";
import { AGENT_ADDR } from "./common.js";

// enableLogging(LogLevel.WARNING);

async function main(): Promise<void> {
  await withFabric({ rootConfig: CLIENT_CONFIG }, async () => {
    const agent = Agent.remoteByAddress(AGENT_ADDR);

    // Test addition
    const sum = await agent.add({ x: 3, y: 4 });
    console.log(sum);

    // Test multiplication
    const product = await agent.multiply({ x: 6, y: 7 });
    console.log(product);

    // Test Fibonacci stream
    const fibStream = await agent.fib_stream({ _stream: true, n: 10 });
    const fibNumbers: number[] = [];
    for await (const num of fibStream) {
      fibNumbers.push(num);
    }
    console.log(fibNumbers.join(" "));
  });
}

main().catch((error: Error) => {
  console.error("Client failed:", error);
  process.exit(1);
});
