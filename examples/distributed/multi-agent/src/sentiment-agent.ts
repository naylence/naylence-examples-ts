import { withFabric } from "@naylence/runtime";
import { BaseAgent, NODE_CONFIG } from "@naylence/agent-sdk";
import {
  SENTIMENT_AGENT_ADDR,
  getOpenAIClient,
  getModelName,
} from "./common.js";

const client = getOpenAIClient();

class SentimentAgent extends BaseAgent {
  async runTask(payload: any, id: string | null): Promise<any> {
    const response = await client.chat.completions.create({
      model: getModelName(),
      messages: [
        {
          role: "user",
          content: `Rate the sentiment of this on a scale 1-5 (number only):\n\n${payload}`,
        },
      ],
    });
    return response.choices[0].message.content?.trim();
  }
}

await withFabric({ rootConfig: NODE_CONFIG }, async () => {
  await new SentimentAgent().aserve(SENTIMENT_AGENT_ADDR);
});
