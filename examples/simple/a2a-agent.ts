import { withFabric, enableLogging, LogLevel } from "@naylence/runtime";
import {
  Agent,
  AgentProxy,
  BaseAgent,
  Task,
  TaskSendParams,
  TaskState,
  makeTask,
  firstTextPart,
} from "@naylence/agent-sdk";
import type { FameService } from "@naylence/core";

if (typeof process !== "undefined" && !process.env.FAME_PLUGINS) {
  process.env.FAME_PLUGINS = "@naylence/runtime";
}

enableLogging(LogLevel.WARNING);

class SimpleA2AAgent extends BaseAgent {
  async startTask(params: TaskSendParams): Promise<Task> {
    return makeTask({
      id: params.id,
      state: TaskState.COMPLETED,
      payload: "Hello! 👋",
    });
  }
}

async function main(): Promise<void> {
  await withFabric(async (fabric) => {
    const agent = new SimpleA2AAgent("simple-agent");
    const agentAddress = await fabric.serve(agent as unknown as FameService);
    console.log(`Agent address: ${agentAddress}`);

    const remote = Agent.remoteByAddress(
      agentAddress,
    ) as AgentProxy<SimpleA2AAgent>;
    const result = await remote.startTask({
      id: "my task #1",
      payload: "Hello",
    });

    console.log("Result:", result.status.state);
    const reply = firstTextPart(result.status.message);
    if (reply) {
      console.log("Payload:", reply);
    }
  });
}

void main().catch((error) => {
  console.error("a2a-agent example failed", error);
});
