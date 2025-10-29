import type { FameMessageResponse } from "@naylence/core";
import { LogLevel, enableLogging, withFabric } from "@naylence/runtime";
import { BaseAgent, BaseAgentState, NODE_CONFIG } from "@naylence/agent-sdk";
import { z } from "zod";
import { AGENT_ADDR } from "./common.js";

const counterStateSchema = z.object({
  count: z.number().int().nonnegative(),
});

class CounterState extends BaseAgentState {
  static override readonly schema =
    counterStateSchema as unknown as typeof BaseAgentState.schema;

  count = 0;
}

class MessageAgent extends BaseAgent<CounterState> {
  constructor() {
    super(null, { stateModel: CounterState });
  }

  async onMessage(message: unknown): Promise<FameMessageResponse | null> {
    const shouldCrash = await this.withState(async (state) => {
      console.log("MessageAgent current state:", state.count);
      state.count += 1;
      return state.count % 2 === 1;
    });

    if (shouldCrash) {
      await delay(1000);
      console.log("MessageAgent simulating crash while processing message...");
      process.exit(1);
    }

    console.log("MessageAgent processed message successfully:", message);
    return null;
  }
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  enableLogging(LogLevel.INFO);

  await withFabric({ rootConfig: NODE_CONFIG }, async () => {
    const agent = new MessageAgent();
    await agent.aserve(AGENT_ADDR);
  });
}

void main().catch((error) => {
  console.error("MessageAgent failed:", error);
  process.exitCode = 1;
});
