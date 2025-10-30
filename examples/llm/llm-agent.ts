import OpenAI from "openai";
import { withFabric } from "@naylence/runtime";
import { Agent } from "@naylence/agent-sdk";
import type { FameService } from "@naylence/core";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("Set OPENAI_API_KEY in your environment first.");
}

const client = new OpenAI({ apiKey });

async function main(): Promise<void> {
  await withFabric(async (fabric) => {
    const handler = await Agent.fromHandler(async (payload) => {
      const question =
        typeof payload === "string"
          ? payload
          : payload != null
            ? String(payload)
            : "";

      const messages = [
        { role: "system" as const, content: "You are a helpful assistant." },
        {
          role: "user" as const,
          content: question || "Please ask a question.",
        },
      ];

      const response = await client.chat.completions.create({
        model: "gpt-5-mini",
        messages,
      });

      return (
        response.choices?.[0]?.message?.content ??
        "OpenAI returned an empty response."
      );
    });

    const agentAddress = await fabric.serve(handler as unknown as FameService);
    const remote = Agent.remoteByAddress(agentAddress);

    const prompt = "What year did the first moon landing occur?";
    const answer = await remote.runTask(prompt, null);

    console.log(`Q: ${prompt}`);
    console.log(`A: ${answer}`);
  });
}

void main().catch((error) => {
  console.error("llm-agent example failed", error);
  process.exitCode = 1;
});
