import { withFabric } from "@naylence/runtime";
import { BaseAgent, NODE_CONFIG } from "@naylence/agent-sdk";
import {
  SUMMARIZER_AGENT_ADDR,
  getOpenAIClient,
  getModelName,
} from "./common.js";

const client = getOpenAIClient();

class SummarizerAgent extends BaseAgent {
  async runTask(payload: any, id: string | null): Promise<any> {
    const response = await client.chat.completions.create({
      model: getModelName(),
      messages: [{ role: "user", content: `Summarize this:\n\n${payload}` }],
    });
    return response.choices[0].message.content?.trim();
  }
}

await withFabric({ rootConfig: NODE_CONFIG }, async () => {
  await new SummarizerAgent().aserve(SUMMARIZER_AGENT_ADDR);
});
