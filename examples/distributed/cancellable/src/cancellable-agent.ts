import { withFabric } from "@naylence/runtime";
import {
  BackgroundTaskAgent,
  type Artifact,
  type TaskSendParams,
  TaskState,
  NODE_CONFIG,
  type BackgroundTaskAgentOptions,
  BaseAgentState,
} from "@naylence/agent-sdk";
import { AGENT_ADDR } from "./common.js";

class CancellableAgent extends BackgroundTaskAgent {
  private constructor(
    name: string | null = null,
    options: BackgroundTaskAgentOptions<BaseAgentState> = {},
  ) {
    super(name, options);
  }

  static create(
    name: string | null = null,
    options: BackgroundTaskAgentOptions<BaseAgentState> = {},
  ): CancellableAgent {
    return new CancellableAgent(name, options);
  }

  async runBackgroundTask(params: TaskSendParams): Promise<void> {
    const maxSteps = 10;
    if (await this.getTaskState(params.id) === TaskState.CANCELED) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    const initialArtifact: Artifact = {
      parts: [{ type: "data", data: { progress: 0 } }],
      index: 0,
    };
    await this.updateTaskArtifact(params.id, initialArtifact);

    for (let i = 1; i <= maxSteps; i++) {
      const taskState = await this.getTaskState(params.id);
      if (taskState === TaskState.CANCELED) {
        break;
      }
      const progress = i / maxSteps;
      console.log(`Task ${params.id} progress changed to: ${progress}`);

      const artifact: Artifact = {
        parts: [{ type: "data", data: { progress } }],
        index: 0,
      };

      await this.updateTaskArtifact(params.id, artifact);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}

async function main(): Promise<void> {
  await withFabric({ rootConfig: NODE_CONFIG }, async () => {
    await CancellableAgent.create().aserve(AGENT_ADDR);
  });
}

// Run main function directly (ES module style)
main().catch((error) => {
  console.error("Cancellable agent failed:", error);
  process.exit(1);
});
