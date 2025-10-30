import { withFabric, FameFabric, operation } from "@naylence/runtime";
import {
  BackgroundTaskAgent,
  type TaskSendParams,
  type TaskPushNotificationConfig,
  NODE_CONFIG,
  type BackgroundTaskAgentOptions,
  BaseAgentState,
} from "@naylence/agent-sdk";
import { SENDER_AGENT_ADDR } from "./common.js";

class PushSender extends BackgroundTaskAgent {
  private pushNotificationConfigs: Map<string, TaskPushNotificationConfig> =
    new Map();

  private constructor(
    name: string | null = null,
    options: BackgroundTaskAgentOptions<BaseAgentState> = {},
  ) {
    super(name, options);
  }

  static create(
    name: string | null = null,
    options: BackgroundTaskAgentOptions<BaseAgentState> = {},
  ): PushSender {
    return new PushSender(name, options);
  }

  async runBackgroundTask(params: TaskSendParams): Promise<void> {
    console.log(`${this.constructor.name} running task ${params.id}`);
    const fabric = FameFabric.current();
    const config = this.pushNotificationConfigs.get(params.id);

    for (let i = 1; i < 10; i++) {
      if (config) {
        const notification = {
          task_id: params.id,
          message: `Notification #${i}`,
        };
        await fabric.sendMessage(
          config.pushNotificationConfig.url,
          notification,
        );
        console.log(`${this.constructor.name} sent notification`, notification);
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    console.log(`${this.constructor.name} completed task ${params.id}`);
  }

  @operation()
  async registerPushEndpoint(
    config: TaskPushNotificationConfig,
  ): Promise<TaskPushNotificationConfig> {
    console.log(
      `Configured push notification endpoint ${JSON.stringify(config)} for task ${config.id}`,
    );
    this.pushNotificationConfigs.set(config.id, config);
    return config;
  }
}

async function main(): Promise<void> {
  await withFabric({ rootConfig: NODE_CONFIG }, async () => {
    await PushSender.create().aserve(SENDER_AGENT_ADDR);
  });
}

main().catch((error) => {
  console.error("PushSender failed:", error);
  process.exit(1);
});
