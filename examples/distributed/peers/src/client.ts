import { Agent, CLIENT_CONFIG } from "@naylence/agent-sdk";
import { withFabric } from "@naylence/runtime";
import { MATH_AGENT1_ADDR, MATH_AGENT2_ADDR } from "./common.js";

async function main() {
  await withFabric({ rootConfig: CLIENT_CONFIG }, async () => {
    const agent1 = Agent.remoteByAddress(MATH_AGENT1_ADDR);

    console.log(await agent1.add({ x: 3, y: 4 }));
    console.log(await agent1.multiply({ x: 6, y: 7 }));

    const agent2 = Agent.remoteByAddress(MATH_AGENT2_ADDR);
    const fibStream = await agent2.fib_stream({ _stream: true, n: 10 });

    const values: number[] = [];
    for await (const v of fibStream) {
      values.push(v as number);
    }
    console.log(values.join(" "));
  });
}

main().catch((error) => {
  console.error("Client failed:", error);
  process.exit(1);
});
