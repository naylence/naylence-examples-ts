import { withFabric } from "@naylence/runtime";
import { BaseAgent, Agent, NODE_CONFIG } from "@naylence/agent-sdk";
import {
  ANALYSIS_AGENT_ADDR,
  SENTIMENT_AGENT_ADDR,
  SUMMARIZER_AGENT_ADDR,
} from "./common.js";

class AnalysisAgent extends BaseAgent {
  async runTask(payload: any, id: string | null): Promise<any> {
    const result = await Agent.broadcast(
      [SUMMARIZER_AGENT_ADDR, SENTIMENT_AGENT_ADDR],
      payload,
    );
    return {
      summary: result[0][1],
      sentiment: result[1][1],
    };
  }
}

await withFabric({ rootConfig: NODE_CONFIG }, async () => {
  await new AnalysisAgent().aserve(ANALYSIS_AGENT_ADDR, { logLevel: "info" });
});
