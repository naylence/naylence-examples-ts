import { Agent, CLIENT_CONFIG } from "@naylence/agent-sdk";
import { withFabric } from "@naylence/runtime";
import { AGENT_ADDR } from "./common.js";

async function main(): Promise<void> {
  await withFabric({ rootConfig: CLIENT_CONFIG }, async () => {
    const agent = Agent.remoteByAddress(AGENT_ADDR);

    // Test simple operations
    const sum = await agent.add({ x: 3, y: 4 });
    console.log(sum);

    const product = await agent.multiply({ x: 6, y: 7 });
    console.log(product);

    // Test streaming operation
    const fibStream = await agent.fib_stream({ _stream: true, n: 10 });
    const results: number[] = [];
    for await (const value of fibStream) {
      results.push(value);
    }
    console.log(results.join(" "));
  });
}

main().catch((error) => {
  console.error("Client failed:", error);
  process.exit(1);
});
