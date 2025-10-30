import { withFabric } from "@naylence/runtime";
import { Agent } from "@naylence/agent-sdk";
import type { FameService } from "@naylence/core";

async function main(): Promise<void> {
  await withFabric(async (fabric) => {
    const handler = await Agent.fromHandler(async () =>
      new Date().toISOString(),
    );
    const agentAddress = await fabric.serve(handler as unknown as FameService);
    console.log(`Agent address: ${agentAddress}`);

    const remote = Agent.remoteByAddress(agentAddress);
    const result = await remote.runTask("Hello", null);
    console.log(`Time: ${result}`);
  });
}

void main().catch((error) => {
  console.error("function-as-agent example failed", error);
});
