/**
 * Client demonstrating overlay security with envelope signing
 *
 * This client:
 * 1. Fetches an OAuth2 bearer token for admission
 * 2. Connects to the sentinel with overlay security enabled
 * 3. Exchanges public keys during node attach
 * 4. Signs/verifies all envelopes for message integrity
 * 5. Makes RPC calls to the math agent
 */

import { Agent, CLIENT_CONFIG } from "@naylence/agent-sdk";
import { withFabric } from "@naylence/runtime";
import { AGENT_ADDR } from "./common.js";

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
