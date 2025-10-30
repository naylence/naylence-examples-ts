/**
 * Non-interactive test client for automated testing
 * Tests the complete conversation flow including state management
 */

import { withFabric, generateId } from "@naylence/runtime";
import { Agent, NODE_CONFIG } from "@naylence/agent-sdk";
import { AGENT_ADDR } from "./common.js";

async function main() {
  await withFabric({ rootConfig: NODE_CONFIG }, async () => {
    const agent = Agent.remoteByAddress(AGENT_ADDR);

    const conversationId = generateId();

    console.log("📝 Starting conversation with pirate assistant...");
    await agent.startTask({
      id: conversationId,
      historyLength: 5,
      payload: { system_prompt: "You are a helpful assistant speaking Pirate" },
    });

    // Test multiple turns to verify state management
    console.log("\n🔹 Turn 1: Initial greeting");
    const response1 = await agent.run_turn(
      conversationId,
      "Hello! What is your name?",
    );
    console.log(`A> ${response1}\n`);

    console.log("🔹 Turn 2: Ask about the weather");
    const response2 = await agent.run_turn(
      conversationId,
      "What do you think about the weather?",
    );
    console.log(`A> ${response2}\n`);

    console.log("🔹 Turn 3: Follow-up question (tests history)");
    const response3 = await agent.run_turn(
      conversationId,
      "Can you repeat what I asked you first?",
    );
    console.log(`A> ${response3}\n`);

    console.log("🔚 Ending conversation...");
    await agent.end_conversation(conversationId);

    console.log("✅ Test completed successfully!");
  });
}

main().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
