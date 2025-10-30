/**
 * Client that exercises stickiness. Once the secure channel is established,
 * all subsequent RPCs stay pinned to the same replica.
 */

import { Agent, CLIENT_CONFIG } from "@naylence/agent-sdk";
import { withFabric } from "@naylence/runtime";
import { AGENT_ADDR } from "./common.js";

async function main(): Promise<void> {
  await withFabric({ rootConfig: CLIENT_CONFIG }, async () => {
    const agent = Agent.remoteByAddress(AGENT_ADDR);

    const sum = await agent.add({ x: 3, y: 4 });
    console.log(sum);

    const product = await agent.multiply({ x: 6, y: 7 });
    console.log(product);

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
