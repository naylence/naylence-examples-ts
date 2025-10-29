import { withFabric, enableLogging, LogLevel } from "@naylence/runtime";
import {
  Agent,
  AgentProxy,
  BaseAgent,
  Task,
  TaskState,
  TaskQueryParams,
  TaskSendParams,
  makeTask,
} from "@naylence/agent-sdk";
import type { FameService } from "@naylence/core";

if (typeof process !== "undefined" && !process.env.FAME_PLUGINS) {
  process.env.FAME_PLUGINS = "@naylence/runtime";
}

enableLogging(LogLevel.WARNING);

class BackgroundTaskAgent extends BaseAgent {
  private readonly tasks = new Map<string, TaskState>();

  async startTask(params: TaskSendParams): Promise<Task> {
    this.tasks.set(params.id, TaskState.WORKING);
    void this.runBackgroundJob(params.id);

    return makeTask({
      id: params.id,
      state: TaskState.WORKING,
      payload: { status: "Working..." },
    });
  }

  async getTaskStatus(params: TaskQueryParams): Promise<Task> {
    const state = this.tasks.get(params.id) ?? TaskState.UNKNOWN;
    const payload =
      state === TaskState.COMPLETED
        ? { status: "Completed!" }
        : { status: "Still working..." };

    return makeTask({
      id: params.id,
      state,
      payload,
    });
  }

  private async runBackgroundJob(taskId: string): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, 200);
    });
    this.tasks.set(taskId, TaskState.COMPLETED);
  }
}

async function main(): Promise<void> {
  await withFabric(async (fabric) => {
    const agent = new BackgroundTaskAgent("background-agent");
    const agentAddress = await fabric.serve(agent as unknown as FameService);
    console.log(`Agent address: ${agentAddress}`);

    const remote = Agent.remoteByAddress(
      agentAddress,
    ) as AgentProxy<BackgroundTaskAgent>;
    const taskId = "my task #1";

    const startResult = await remote.startTask({
      id: taskId,
      payload: { job: "demo" },
    });
    console.log("Start task result:", startResult.status.state);

    const immediateStatus = await remote.getTaskStatus({ id: taskId });
    console.log("Immediate status:", immediateStatus.status.state);

    await new Promise((resolve) => {
      setTimeout(resolve, 400);
    });

    const finalStatus = await remote.getTaskStatus({ id: taskId });
    console.log("Final status:", finalStatus.status.state);
  });
}

void main().catch((error) => {
  console.error("agent-with-bg-task example failed", error);
});
