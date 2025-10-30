import * as readline from "readline";
import { withFabric, generateId } from "@naylence/runtime";
import { Agent, NODE_CONFIG } from "@naylence/agent-sdk";
import { AGENT_ADDR } from "./common.js";

async function main() {
  await withFabric({ rootConfig: NODE_CONFIG }, async () => {
    const agent = Agent.remoteByAddress(AGENT_ADDR);

    const conversationId = generateId();

    await agent.startTask({
      id: conversationId,
      historyLength: 10,
      payload: { system_prompt: "You are a helpful assistant speaking Pirate" },
    });

    console.log("🔹 Chat (type 'exit' to quit)");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const askQuestion = (query: string): Promise<string> => {
      return new Promise((resolve) => {
        rl.question(query, resolve);
      });
    };

    try {
      let question = "";
      while (true) {
        // Call custom RPC methods with positional arguments (matches Python implementation)
        const text = await agent.run_turn(conversationId, question);
        console.log(`A> ${text}\n`);

        question = await askQuestion("Q> ");

        if (
          !question.trim() ||
          question.toLowerCase() === "exit" ||
          question.toLowerCase() === "quit"
        ) {
          await agent.end_conversation(conversationId);
          break;
        }
      }
    } catch (error) {
      if ((error as any).code !== "ERR_USE_AFTER_CLOSE") {
        throw error;
      }
    } finally {
      rl.close();
      console.log("\nGoodbye!");
    }
  });
}

main().catch((error) => {
  console.error("Client failed:", error);
  process.exit(1);
});
