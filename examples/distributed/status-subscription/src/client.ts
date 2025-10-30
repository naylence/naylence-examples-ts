import { AGENT_ADDR } from "./common.js";
import { withFabric, generateId } from "@naylence/runtime";
import {
  Agent,
  type DataPart,
  type TaskArtifactUpdateEvent,
  type TaskStatusUpdateEvent,
  CLIENT_CONFIG,
  makeTaskParams,
} from "@naylence/agent-sdk";

async function main(): Promise<void> {
  await withFabric({ rootConfig: CLIENT_CONFIG }, async () => {
    const agent = Agent.remoteByAddress(AGENT_ADDR);
    const taskId = generateId();

    // fire off the task
    await agent.startTask(makeTaskParams({ id: taskId }));

    // subscribe to the stream
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
        console.log(`[DATA ] ${part.data["progress"]}`);
      }
    }
  });
}

main().catch((error) => {
  console.error("Client failed:", error);
  process.exit(1);
});
