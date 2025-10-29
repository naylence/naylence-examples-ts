import type { DeliveryAckFrame } from "@naylence/core";
import { LogLevel, enableLogging, withFabric } from "@naylence/runtime";
import { CLIENT_CONFIG } from "@naylence/agent-sdk";
import { AGENT_ADDR } from "./common.js";

enableLogging(LogLevel.WARNING);

async function main(): Promise<void> {
  await withFabric({ rootConfig: CLIENT_CONFIG }, async (fabric) => {
    console.log("Sending message to MessageAgent...");
    const ack: DeliveryAckFrame | null = await fabric.sendMessage(
      AGENT_ADDR,
      "Hello, World!",
    );
    console.log("Acknowledgment received:", ack);
  });
}

void main().catch((error) => {
  console.error("Client failed:", error);
  process.exitCode = 1;
});
