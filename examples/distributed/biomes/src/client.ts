import { withFabric } from "@naylence/runtime";
import { Agent, CLIENT_CONFIG } from "@naylence/agent-sdk";
import { MATH_AGENT1_ADDR, MATH_AGENT2_ADDR } from "./common.js";

async function main(): Promise<void> {
  await withFabric({ rootConfig: CLIENT_CONFIG }, async () => {
    const agent1 = Agent.remoteByAddress(MATH_AGENT1_ADDR);

    // Call add on agent1
    console.log(await agent1.add({ x: 3, y: 4 }));

    const agent2 = Agent.remoteByAddress(MATH_AGENT2_ADDR);

    // Call multiply on agent2 (which delegates to agent1)
    console.log(await agent2.multiply({ x: 6, y: 7 }));

    // Call streaming fib on agent2
    const fibStream = await agent2.fib_stream({ _stream: true, n: 10 });
    const results: number[] = [];
    for await (const v of fibStream) {
      results.push(v);
    }
    console.log(results.join(" "));
  });
}

main().catch((error) => {
  console.error("Client failed:", error);
  process.exit(1);
});
