import OpenAI from "openai";
import { generateId, withFabric } from "@naylence/runtime";
import {
  Agent,
  AgentProxy,
  BaseAgent,
  Task,
  TaskSendParams,
  TaskState,
  firstTextPart,
  makeTask,
} from "@naylence/agent-sdk";
import type { FameService } from "@naylence/core";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

type ChatHistoryEntry = {
  role: "user" | "assistant";
  content: string;
};

type HistoryKey = string;

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("Set OPENAI_API_KEY in your environment first.");
}

const client = new OpenAI({ apiKey });

class ChatAgent extends BaseAgent {
  private readonly histories = new Map<HistoryKey, ChatHistoryEntry[]>();

  async startTask(params: TaskSendParams): Promise<Task> {
    const sessionId = params.sessionId ?? params.id;

    const prompt = (firstTextPart(params.message) ?? "").trim();
    const history = this.histories.get(sessionId) ?? [];
    const updatedHistory: ChatHistoryEntry[] = history.concat({
      role: "user",
      content: prompt,
    });

    const historyLength = params.historyLength ?? 10;
    const trimmedHistory = updatedHistory.slice(-historyLength * 2);

    const messages = [
      { role: "system" as const, content: "You are a helpful assistant." },
      ...trimmedHistory.map((entry) => ({
        role: entry.role,
        content: entry.content,
      })),
    ];

    const response = await client.chat.completions.create({
      model: "gpt-5-mini",
      messages,
    });

    const answer =
      response.choices?.[0]?.message?.content ??
      "I could not generate a reply.";

    const finalHistory = trimmedHistory.concat({
      role: "assistant",
      content: answer,
    });
    this.histories.set(sessionId, finalHistory);

    return makeTask({
      id: params.id,
      sessionId,
      state: TaskState.COMPLETED,
      payload: answer,
    });
  }
}

async function main(): Promise<void> {
  await withFabric(async (fabric) => {
    const agentAddress = await fabric.serve(
      new ChatAgent("chat-agent") as unknown as FameService,
    );
    const remote = Agent.remoteByAddress(agentAddress) as AgentProxy<ChatAgent>;

    const sessionId = generateId();
    const rl = createInterface({ input, output });

    console.log("🔹 Chat (type 'exit' to quit)");

    while (true) {
      let questionRaw: string;
      try {
        questionRaw = await rl.question("Q> ");
      } catch (error) {
        if (error && typeof error === "object" && "name" in error) {
          const name = String((error as { name?: unknown }).name);
          if (name === "AbortError") {
            console.log("\nGoodbye!");
            break;
          }
        }
        console.error("chat-agent REPL interrupted", error);
        break;
      }

      const question = questionRaw.trim();
      if (!question || ["exit", "quit"].includes(question.toLowerCase())) {
        console.log("Goodbye!");
        break;
      }

      const task = await remote.startTask({
        id: generateId(),
        payload: question,
        sessionId,
        historyLength: 10,
      });

      const reply = firstTextPart(task.status.message);
      console.log(`A> ${reply ?? "(no response)"}\n`);
    }

    rl.close();
  });
}

void main().catch((error) => {
  console.error("chat-agent example failed", error);
  process.exitCode = 1;
});
