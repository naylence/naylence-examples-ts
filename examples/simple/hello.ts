import { withFabric } from "@naylence/runtime";
import { BaseAgent } from "@naylence/agent-sdk";

class HelloAgent extends BaseAgent {
  async onMessage(message: string) {
    console.log(`Agent received message: ${message}`);
  }
}

async function main(): Promise<void> {
  await withFabric(async (fabric) => {
    const agentAddress = await fabric.serve(new HelloAgent());
    fabric.sendMessage(agentAddress, "Hello, World");
  });
}

void main().catch((error) => {
  console.error("hello example failed", error);
});
