import {
  withFabric,
  enableLogging,
  LogLevel,
  FameAddress,
} from "@naylence/runtime";
import {
  Agent,
  AgentProxy,
  BaseAgent,
  Task,
  TaskSendParams,
  TaskState,
  firstTextPart,
  makeTask,
  makeTaskParams,
} from "@naylence/agent-sdk";
import type { FameService } from "@naylence/core";

if (typeof process !== "undefined" && !process.env.FAME_PLUGINS) {
  process.env.FAME_PLUGINS = "@naylence/runtime";
}

enableLogging(LogLevel.WARNING);

class PongAgent extends BaseAgent {
  async startTask(params: TaskSendParams): Promise<Task> {
    const incomingText = firstTextPart(params.message) ?? "";
    const replyText = `Pong: ${incomingText}`;
    return makeTask({
      id: params.id,
      state: TaskState.COMPLETED,
      payload: replyText,
    });
  }
}

class PingAgent extends BaseAgent {
  constructor(
    name: string,
    private readonly pongAddress: FameAddress,
  ) {
    super(name);
  }

  async startTask(params: TaskSendParams): Promise<Task> {
    const pongProxy = Agent.remoteByAddress(
      this.pongAddress,
    ) as AgentProxy<PongAgent>;
    return pongProxy.startTask(params);
  }
}

async function main(): Promise<void> {
  await withFabric(async (fabric) => {
    const pongAgent = new PongAgent("pong-agent");
    const pongAddress = await fabric.serve(pongAgent as unknown as FameService);
    console.log(`[main] PongAgent is listening at: ${pongAddress}`);

    const pingAgent = new PingAgent("ping-agent", pongAddress);
    const pingAddress = await fabric.serve(pingAgent as unknown as FameService);
    console.log(`[main] PingAgent is listening at: ${pingAddress}`);

    const pingProxy = Agent.remoteByAddress(
      pingAddress,
    ) as AgentProxy<PingAgent>;
    const pingParams = makeTaskParams({
      id: "task-123",
      payload: "Hello, Pong!",
    });

    const resultTask = await pingProxy.startTask(pingParams);

    console.log("[main] Received Task from PingAgent:");
    console.log(`       id:    ${resultTask.id}`);
    console.log(`       state: ${resultTask.status.state}`);

    const reply = firstTextPart(resultTask.status.message);
    if (reply) {
      console.log(`       reply: ${reply}`);
    }
  });
}

void main().catch((error) => {
  console.error("agent-ping-pong example failed", error);
});
