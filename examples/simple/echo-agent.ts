import { withFabric, enableLogging, LogLevel } from "@naylence/runtime";
import { Agent, BaseAgent } from "@naylence/agent-sdk";
import type { FameService } from "@naylence/core";

if (typeof process !== "undefined" && !process.env.FAME_PLUGINS) {
  process.env.FAME_PLUGINS = "@naylence/runtime";
}

enableLogging(LogLevel.WARNING);

class EchoAgent extends BaseAgent {
  async runTask(payload: unknown): Promise<unknown> {
    return payload;
  }
}

async function main(): Promise<void> {
  await withFabric(async (fabric) => {
    const agent = new EchoAgent("echo-agent");
    const agentAddress = await fabric.serve(agent as unknown as FameService);
    console.log(`Echo agent is listening at: ${agentAddress}`);

    const remote = Agent.remoteByAddress(agentAddress);
    const result = await remote.runTask("Hello, World!", null);
    console.log(result);
  });
}

void main().catch((error) => {
  console.error("echo-agent example failed", error);
});
