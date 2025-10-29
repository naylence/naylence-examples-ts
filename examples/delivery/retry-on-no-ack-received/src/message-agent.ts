import type { FameMessageResponse } from "@naylence/core";
import {
  InProcessFameFabric,
  LogLevel,
  enableLogging,
  withFabric,
} from "@naylence/runtime";
import { BaseAgent, NODE_CONFIG } from "@naylence/agent-sdk";
import { AGENT_ADDR } from "./common.js";
import { LostAckSimulator } from "./lost-ack-simulator.js";

class MessageAgent extends BaseAgent {
  async onMessage(message: unknown): Promise<FameMessageResponse | null> {
    console.log("MessageAgent received message:", message);
    return null;
  }
}

async function main(): Promise<void> {
  enableLogging(LogLevel.INFO);

  await withFabric({ rootConfig: NODE_CONFIG }, async (fabric) => {
    if (fabric instanceof InProcessFameFabric) {
      fabric.node.addEventListener(new LostAckSimulator());
    } else {
      throw new Error("Retry example requires an in-process fabric instance");
    }

    const agent = new MessageAgent();
    await agent.aserve(AGENT_ADDR);
  });
}

void main().catch((error) => {
  console.error("MessageAgent failed:", error);
  process.exitCode = 1;
});
