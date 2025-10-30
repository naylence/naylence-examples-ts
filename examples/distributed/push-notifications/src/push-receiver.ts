import { withFabric } from "@naylence/runtime";
import { generateId } from "@naylence/core";
import {
  BackgroundTaskAgent,
  Agent,
  type TaskSendParams,
  type TaskPushNotificationConfig,
  NODE_CONFIG,
  type BackgroundTaskAgentOptions,
  BaseAgentState,
} from "@naylence/agent-sdk";
import { RECEIVER_AGENT_ADDR, SENDER_AGENT_ADDR } from "./common.js";

class PushReceiver extends BackgroundTaskAgent {
  private notificationsPerTask: Map<string, string[]> = new Map();

  private constructor(
    name: string | null = null,
    options: BackgroundTaskAgentOptions<BaseAgentState> = {},
  ) {
    super(name, options);
  }

  static create(
    name: string | null = null,
    options: BackgroundTaskAgentOptions<BaseAgentState> = {},
  ): PushReceiver {
    return new PushReceiver(name, options);
  }

  async runBackgroundTask(params: TaskSendParams): Promise<any> {
    const agent = Agent.remoteByAddress(SENDER_AGENT_ADDR);
    const taskId = generateId();
    this.notificationsPerTask.set(taskId, []);

    // Configure push notifications BEFORE starting the task
    const config: TaskPushNotificationConfig = {
      id: taskId,
      pushNotificationConfig: {
        url: RECEIVER_AGENT_ADDR,
      },
    };

    await agent.registerPushEndpoint(config);
    await agent.runTask(null, taskId);

    return { notifications: this.notificationsPerTask.get(taskId) || [] };
  }

  async onMessage(message: any): Promise<null> {
    console.log(`${this.constructor.name} got notification:`, message);
    const taskId = message.task_id;
    const notifications = this.notificationsPerTask.get(taskId);
    if (notifications) {
      notifications.push(message.message);
    }
    return null;
  }
}

async function main(): Promise<void> {
  await withFabric({ rootConfig: NODE_CONFIG }, async () => {
    await PushReceiver.create().aserve(RECEIVER_AGENT_ADDR);
  });
}

main().catch((error) => {
  console.error("PushReceiver failed:", error);
  process.exit(1);
});
