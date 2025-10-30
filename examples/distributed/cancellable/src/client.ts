import { withFabric } from "@naylence/runtime";
import { generateId } from "@naylence/core";
import {
  Agent,
  type DataPart,
  type TaskArtifactUpdateEvent,
  type TaskStatusUpdateEvent,
  makeTaskParams,
  CLIENT_CONFIG,
} from "@naylence/agent-sdk";
import { AGENT_ADDR } from "./common.js";

async function main(): Promise<void> {
  await withFabric({ rootConfig: CLIENT_CONFIG }, async () => {
    const agent = Agent.remoteByAddress(AGENT_ADDR);
    const taskId = generateId();

    await agent.startTask(makeTaskParams({ id: taskId }));

    const updates = await agent.subscribeToTaskUpdates(
      makeTaskParams({ id: taskId }),
    );

    for await (const evt of updates) {
      if ("status" in evt) {
        // TaskStatusUpdateEvent
        const statusEvt = evt as TaskStatusUpdateEvent;
        console.log(`[STATUS] ${statusEvt.status.state}`);
      } else if ("artifact" in evt) {
        // TaskArtifactUpdateEvent
        const artifactEvt = evt as TaskArtifactUpdateEvent;
        const part = artifactEvt.artifact.parts[0] as DataPart;
        const progress = part.data["progress"] as number;
        console.log(`[DATA ] progress: ${progress}`);
        if (progress >= 0.5) {
          console.log(`Canceling task ${taskId}`);
          await agent.cancelTask({ id: taskId });
        }
      }
    }
  });
}

main().catch((error) => {
  console.error("Client failed:", error);
  process.exit(1);
});
