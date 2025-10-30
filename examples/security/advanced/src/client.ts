/**
 * Client demonstrating advanced security with X.509/SPIFFE certificates
 *
 * This client:
 * 1. Fetches an OAuth2 bearer token using client credentials
 * 2. Contacts the welcome service to get admission (placement + attach ticket + CA grant)
 * 3. Obtains a SPIFFE X.509 certificate from the CA service
 * 4. Connects to the sentinel using both the attach ticket and certificate
 * 5. Makes RPC calls to the math agent over sealed channels
 */

import { Agent, CLIENT_CONFIG } from "@naylence/agent-sdk";
import { withFabric } from "@naylence/runtime";
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
