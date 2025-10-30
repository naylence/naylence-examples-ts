import { AGENT_ADDR } from "./common.js";
import { withFabric } from "@naylence/runtime";
import {
  BackgroundTaskAgent,
  type TaskSendParams,
  type Artifact,
  NODE_CONFIG,
  type BackgroundTaskAgentOptions,
  BaseAgentState,
} from "@naylence/agent-sdk";

class StatusAgent extends BackgroundTaskAgent {
  private constructor(
    name: string | null = null,
    options: BackgroundTaskAgentOptions<BaseAgentState> = {},
  ) {
    super(name, options);
  }

  static create(
    name: string | null = null,
    options: BackgroundTaskAgentOptions<BaseAgentState> = {},
  ): StatusAgent {
    return new StatusAgent(name, options);
  }

  async runBackgroundTask(params: TaskSendParams): Promise<void> {
    // simulate 5 steps of work with progress messages
    for (let i = 1; i <= 5; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const artifact: Artifact = {
        parts: [{ type: "data", data: { progress: `step ${i}/5 complete` } }],
        index: 0,
      };
      await this.updateTaskArtifact(params.id, artifact);
    }
  }
}

async function main(): Promise<void> {
  await withFabric({ rootConfig: NODE_CONFIG }, async () => {
    await StatusAgent.create().aserve(AGENT_ADDR);
  });
}

main().catch((error) => {
  console.error("StatusAgent failed:", error);
  process.exit(1);
});
