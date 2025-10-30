import { withFabric } from "@naylence/runtime";
import { Agent, CLIENT_CONFIG } from "@naylence/agent-sdk";
import { AGENT_CAPABILITY } from "@naylence/core";
import { MATH_CAPABILITY } from "./common.js";

async function main(): Promise<void> {
  await withFabric({ rootConfig: CLIENT_CONFIG }, async () => {
    // Discover agent by capabilities instead of by address
    const mathAgent = Agent.remoteByCapabilities([
      AGENT_CAPABILITY,
      MATH_CAPABILITY,
    ]);

    // Call synchronous operations
    const addResult = await (mathAgent as any).add({ x: 5, y: 3 });
    console.log(`add(5, 3) = ${addResult}`);

    const multiplyResult = await (mathAgent as any).multiply({ x: 4, y: 7 });
    console.log(`multiply(4, 7) = ${multiplyResult}`);

    const fibStream = await mathAgent.fibStream({ _stream: true, n: 10 });
    const fibSeq: number[] = [];
    for await (const num of fibStream) {
      fibSeq.push(num);
    }
    console.log(`Fibonacci sequence: ${fibSeq.join(", ")}`);
  });
}

main().catch((error) => {
  console.error("Client failed:", error);
  process.exit(1);
});
